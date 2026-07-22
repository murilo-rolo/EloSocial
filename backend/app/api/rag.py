from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
import httpx
import io
import pypdf
from typing import List, Optional
import google.generativeai as genai
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
        
        # 2. Chunking e Embeddings
        chunks = chunk_text(req.content)
        chunk_payloads = []
        
        for c in chunks:
            # Gerar embedding
            emb_resp = genai.embed_content(
                model="models/gemini-embedding-2",
                content=c,
                task_type="retrieval_document",
                output_dimensionality=768
            )
            embedding = emb_resp['embedding']
            
            chunk_payloads.append({
                "document_id": doc_id,
                "chunk_text": c,
                "embedding": embedding
            })
            
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

    # 1. Gerar embedding da query
    emb_resp = genai.embed_content(
        model="models/gemini-embedding-2",
        content=req.query,
        task_type="retrieval_query",
        output_dimensionality=768
    )
    query_embedding = emb_resp['embedding']
    
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
