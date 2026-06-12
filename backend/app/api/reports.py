from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from pydantic import BaseModel
import hashlib
import json
from app.services.pdf_generator import gerar_pdf

router = APIRouter()

class PDFRequest(BaseModel):
    prontuario: dict
    requerente: dict
    profissional_nome: str
    atendimentos: list = None

@router.post("/pdf")
def generate_pdf(data: PDFRequest):
    try:
        pdf_buffer = gerar_pdf(
            prontuario=data.prontuario,
            requerente=data.requerente,
            profissional_nome=data.profissional_nome,
            atendimentos=data.atendimentos,
        )
        return Response(
            content=pdf_buffer.read(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=prontuario_suas.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/hash")
def generate_hash(data: dict):
    content = json.dumps(data, sort_keys=True, ensure_ascii=False)
    hash_val = hashlib.sha256(content.encode()).hexdigest()
    return {"hash": hash_val}
