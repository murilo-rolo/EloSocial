from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from typing import Optional
from .suas_context import SUAS_BASE_CONTEXT

load_dotenv()

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class GenerateReportRequest(BaseModel):
    prontuario_context: Dict[str, Any]
    formato: Optional[str] = "padrao_suas"

@router.post("/generate-parecer")
async def generate_parecer(req: GenerateReportRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada no servidor.")

    try:
        context_str = json.dumps(req.prontuario_context, ensure_ascii=False, indent=2)
        
        # Ajusta regras específicas baseadas no formato
        formato_regras = ""
        if req.formato == "juridico":
            formato_regras = "O documento deve ter o tom de um OFÍCIO PARA A JUSTIÇA ou RELATÓRIO PSICOSSOCIAL PARA O MINISTÉRIO PÚBLICO. Use linguagem jurídica e extrema formalidade."
        elif req.formato == "saude":
            formato_regras = "O documento deve ter o tom de um ENCAMINHAMENTO MÉDICO/CLÍNICO para o SUS ou CAPS. Fale mais sobre sintomas, suspeitas de transtornos, higiene e bem-estar físico."
        else:
            formato_regras = "O documento deve ter o tom de um PARECER SOCIAL PADRÃO DO CRAS/CREAS."

        system_instruction = f"""{SUAS_BASE_CONTEXT}

Sua tarefa é ler os dados completos de um prontuário (incluindo dados do requerente, histórico de atendimentos e núcleo familiar) e gerar o documento solicitado.

DIRETRIZES DE FORMATAÇÃO PARA ESTE PEDIDO:
{formato_regras}

O documento deve:
1. Resumir o perfil da família e a situação socioeconômica.
2. Destacar as principais demandas e problemas identificados nos atendimentos.
3. Concluir com uma análise profissional breve e encaminhamentos cabíveis (se houver).
Formate a resposta em texto claro, utilizando quebras de linha e tópicos quando necessário. NÃO invente informações que não estão no contexto.
"""
        
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction
        )
        
        prompt = f"Gere o parecer social com base nos seguintes dados:\n{context_str}"
        response = model.generate_content(prompt)
        
        return {"report": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar relatório com IA: {str(e)}")
