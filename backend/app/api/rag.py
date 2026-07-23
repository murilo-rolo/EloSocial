import time
import random
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
import httpx
import io
import pypdf
from typing import List, Optional
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from app.config import SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY

router = APIRouter()

class DocumentUploadRequest(BaseModel):
    title: str
    content: str
    user_id: Optional[str] = None

class RAGQueryRequest(BaseModel):
    query: str
    match_threshold: float = 0.5
    match_count: int = 5

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
    return chunks


def _batch_embed(texts: list[str], task_type: str = "retrieval_document") -> list[list[float]]:
    if not texts:
        return []
    emb_resp = genai.embed_content(
        model="models/gemini-embedding-2",
        content=texts,
        task_type=task_type,
        output_dimensionality=768,
    )
    return emb_resp['embedding']


def _embed_with_retry(content: str, task_type: str, max_retries: int = 3) -> list[float]:
    last_error = None
    for attempt in range(max_retries):
        try:
            emb_resp = genai.embed_content(
                model="models/gemini-embedding-2",
                content=content,
                task_type=task_type,
                output_dimensionality=768,
            )
            return emb_resp['embedding']
        except ResourceExhausted as e:
            last_error = e
            if attempt < max_retries - 1:
                delay = 2 ** attempt + random.random()
                time.sleep(delay)
    raise HTTPException(
        status_code=429,
        detail="Cota da API Gemini exaurida. Tente novamente em alguns segundos.",
        headers={"Retry-After": str(int(2 ** max_retries))},
    )


@router.post("/rag/upload")
async def upload_document(req: DocumentUploadRequest):
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY não configurada")
        raise HTTPException(500, "GEMINI_API_KEY não configurada")

    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    
    # 1. Inserir documento pai
    async with httpx.AsyncClient() as client:
        doc_payload = {"title": req.title, "content": req.content}
        if req.user_id:
            doc_payload["created_by"] = req.user_id
            
        insert_headers = {**headers, "Prefer": "return=representation"}
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/knowledge_documents", 
            headers=insert_headers, 
            json=doc_payload
        )
        if resp.status_code not in (200, 201):
            print(f"Erro ao salvar documento no supabase: {resp.text}")
            raise HTTPException(500, f"Erro ao salvar documento: {resp.text}")
        
        doc = resp.json()[0]
        doc_id = doc["id"]
        
        # 2. Chunking e Embeddings (batch - 1 chamada)
        chunks = chunk_text(req.content)
        embeddings = _batch_embed(chunks)
        chunk_payloads = [
            {"document_id": doc_id, "chunk_text": c, "embedding": emb}
            for c, emb in zip(chunks, embeddings)
        ]
            
        # 3. Salvar chunks
        resp_chunks = await client.post(
            f"{SUPABASE_URL}/rest/v1/knowledge_chunks",
            headers=headers,
            json=chunk_payloads
        )
        if resp_chunks.status_code not in (200, 201):
            print(f"Erro ao salvar chunks no supabase: {resp_chunks.text}")
            raise HTTPException(500, f"Erro ao salvar chunks: {resp_chunks.text}")

        if req.user_id:
            try:
                await client.post(
                    f"{SUPABASE_URL}/rest/v1/audit_logs",
                    headers=headers,
                    json={
                        "user_id": req.user_id,
                        "acao": "adicionou_documento_base_conhecimento",
                        "detalhes": {"document_id": doc_id, "title": req.title},
                    },
                )
            except Exception:
                pass
            
    return {"message": "Documento vetorizado e salvo com sucesso!", "chunks_count": len(chunks)}

@router.post("/rag/upload_file")
async def upload_document_file(
    title: str = Form(...),
    user_id: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    if not GEMINI_API_KEY:
        raise HTTPException(500, "GEMINI_API_KEY não configurada")
        
    content = ""
    file_bytes = await file.read()
    
    if file.filename.endswith(".pdf"):
        try:
            pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    content += text + "\n"
        except Exception as e:
            print(f"Erro ao ler PDF: {str(e)}")
            raise HTTPException(400, f"Erro ao ler PDF: {str(e)}")
    else:
        try:
            content = file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            raise HTTPException(400, "Apenas arquivos PDF ou texto (.txt) são suportados.")
            
    if not content.strip():
        raise HTTPException(400, "Nenhum texto pôde ser extraído do arquivo.")
        
    # Reutiliza o endpoint existente enviando os dados em memória
    return await upload_document(DocumentUploadRequest(
        title=title,
        content=content,
        user_id=user_id
    ))


class StorageUploadRequest(BaseModel):
    title: str
    storage_path: str
    user_id: Optional[str] = None


async def _download_from_storage(bucket: str, path: str) -> bytes:
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}",
            headers=headers
        )
        if resp.status_code == 404:
            raise HTTPException(400, "Arquivo não encontrado no storage.")
        if resp.status_code != 200:
            raise HTTPException(500, f"Erro ao baixar arquivo do storage: {resp.text}")
        return resp.content


async def _delete_from_storage(bucket: str, path: str):
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }
    async with httpx.AsyncClient() as client:
        await client.delete(
            f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}",
            headers=headers
        )


@router.post("/rag/upload_from_storage")
async def upload_document_from_storage(req: StorageUploadRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(500, "GEMINI_API_KEY não configurada")

    bucket = "conhecimento_uploads"

    file_bytes = await _download_from_storage(bucket, req.storage_path)

    content = ""

    if req.storage_path.endswith(".pdf"):
        try:
            pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    content += text + "\n"
        except Exception as e:
            print(f"Erro ao ler PDF: {str(e)}")
            raise HTTPException(400, f"Erro ao ler PDF: {str(e)}")
    else:
        try:
            content = file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            raise HTTPException(400, "Apenas arquivos PDF ou texto (.txt) são suportados.")

    if not content.strip():
        raise HTTPException(400, "Nenhum texto pôde ser extraído do arquivo.")

    try:
        await _delete_from_storage(bucket, req.storage_path)
    except Exception:
        pass

    return await upload_document(DocumentUploadRequest(
        title=req.title,
        content=content,
        user_id=req.user_id
    ))


@router.get("/rag/documents")
async def list_documents():
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/knowledge_documents?select=id,title,created_at&order=created_at.desc",
            headers=headers
        )
        if resp.status_code != 200:
            raise HTTPException(500, f"Erro ao listar documentos: {resp.text}")
            
        return resp.json()

@router.delete("/rag/documents/{doc_id}")
async def delete_document(doc_id: str):
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{SUPABASE_URL}/rest/v1/knowledge_documents?id=eq.{doc_id}",
            headers=headers
        )
        if resp.status_code not in (200, 204):
            raise HTTPException(500, f"Erro ao deletar documento: {resp.text}")
            
    return {"message": "Documento removido com sucesso."}

@router.post("/rag/query")
async def query_knowledge_base(req: RAGQueryRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(500, "GEMINI_API_KEY não configurada")

    # 1. Gerar embedding da query (com retry)
    query_embedding = _embed_with_retry(req.query, task_type="retrieval_query")
    
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    
    # 2. Chamar RPC Híbrido no Supabase
    async with httpx.AsyncClient() as client:
        rpc_payload = {
            "query_text": req.query,
            "query_embedding": query_embedding,
            "match_threshold": req.match_threshold,
            "match_count": req.match_count
        }
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/rpc/hybrid_search_knowledge",
            headers=headers,
            json=rpc_payload
        )
        if resp.status_code != 200:
            # Fallback para o match_knowledge_chunks original se a migration 00008 não rodou
            if "Could not find the function" in resp.text:
                fallback_payload = {
                    "query_embedding": query_embedding,
                    "match_threshold": req.match_threshold,
                    "match_count": req.match_count
                }
                resp = await client.post(
                    f"{SUPABASE_URL}/rest/v1/rpc/match_knowledge_chunks",
                    headers=headers,
                    json=fallback_payload
                )
            if resp.status_code != 200:
                raise HTTPException(500, f"Erro na busca vetorial: {resp.text}")
            
        matches = resp.json()
        
    return {"matches": matches}
