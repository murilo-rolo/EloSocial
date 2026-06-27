from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from .suas_context import SUAS_BASE_CONTEXT

load_dotenv()

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class GlobalSearchRequest(BaseModel):
    query: str
    all_applicants_context: List[Dict[str, Any]]
    chat_history: List[Dict[str, str]] = []

@router.post("/search-global")
async def search_global(req: GlobalSearchRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada no servidor.")

    try:
        # Limit data to avoid huge payloads (just an example safety measure)
        safe_context = req.all_applicants_context[:100]
        context_str = json.dumps(safe_context, ensure_ascii=False)
        
        system_instruction = f"""{SUAS_BASE_CONTEXT}

Você é o "EloBot", um assistente de IA global do sistema EloSocial (nível gerencial).
Você tem acesso aos dados macro dos requerentes cadastrados no sistema. Use esses dados para responder perguntas analíticas, mapeamento de demandas territoriais ou buscas específicas.
DADOS DOS REQUERENTES ATUAIS (formato JSON):
{context_str}

Regras:
1. Responda APENAS com base nos dados fornecidos acima.
2. Seja direto, conciso e cordial.
3. Utilize os conceitos de Proteção Social do SUAS em suas análises.
4. Se perguntarem algo que não está nos dados, diga que não tem essa informação.
5. Formate sua resposta em Markdown (negritos, listas).
"""
        
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction
        )
        
        # Build chat history for context if needed
        history = []
        for msg in req.chat_history:
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})
            
        chat = model.start_chat(history=history)
        response = chat.send_message(req.query)
        
        return {"response": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na IA Global: {str(e)}")
