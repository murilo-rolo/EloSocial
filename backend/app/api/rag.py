from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
from typing import List, Optional
import google.generativeai as genai
import os
from dotenv import load_dotenv
from app.config import SUPABASE_URL, SUPABASE_SERVICE_KEY

load_dotenv()
router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

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
            raise HTTPException(500, f"Erro ao salvar documento: {resp.text}")
        
        doc = resp.json()[0]
        doc_id = doc["id"]
        
        # 2. Chunking e Embeddings
        chunks = chunk_text(req.content)
        chunk_payloads = []
        
        for c in chunks:
            # Gerar embedding
            emb_resp = genai.embed_content(
                model="models/text-embedding-004",
                content=c,
                task_type="retrieval_document"
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
            raise HTTPException(500, f"Erro ao salvar chunks: {resp_chunks.text}")
            
    return {"message": "Documento vetorizado e salvo com sucesso!", "chunks_count": len(chunks)}

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

@router.post("/rag/query")
async def query_knowledge_base(req: RAGQueryRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(500, "GEMINI_API_KEY não configurada")

    # 1. Gerar embedding da query
    emb_resp = genai.embed_content(
        model="models/text-embedding-004",
        content=req.query,
        task_type="retrieval_query"
    )
    query_embedding = emb_resp['embedding']
    
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    
    # 2. Chamar RPC no Supabase
    async with httpx.AsyncClient() as client:
        rpc_payload = {
            "query_embedding": query_embedding,
            "match_threshold": req.match_threshold,
            "match_count": req.match_count
        }
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/rpc/match_knowledge_chunks",
            headers=headers,
            json=rpc_payload
        )
        if resp.status_code != 200:
            raise HTTPException(500, f"Erro na busca vetorial: {resp.text}")
            
        matches = resp.json()
        
    return {"matches": matches}
