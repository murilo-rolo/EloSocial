from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from .suas_context import SUAS_BASE_CONTEXT

load_dotenv()

router = APIRouter()

# Configuração da API do Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []
    prontuario_context: Dict[str, Any]

class TriagemRequest(BaseModel):
    prontuario_context: Dict[str, Any]

@router.post("/chat-ai")
async def chat_with_ai(req: ChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada no servidor.")

    try:
        # Preparando a instrução de sistema (System Prompt) com os dados do prontuário
        context_str = json.dumps(req.prontuario_context, ensure_ascii=False, indent=2)
        system_instruction = f"""{SUAS_BASE_CONTEXT}

Você está integrado ao sistema EloSocial (Prontuário Eletrônico SUAS).
Sua função é auxiliar o profissional analisando os dados do prontuário do requerente em foco, de forma dinâmica e interativa como um chat.
Você deve basear suas respostas ÚNICA E EXCLUSIVAMENTE nas informações fornecidas no contexto abaixo.
Se a informação solicitada não estiver no contexto, responda que você não possui essa informação com base no prontuário atual, mas use seu conhecimento de SUAS para orientar o que o profissional pode perguntar ou investigar.

DADOS DO PRONTUÁRIO (CONTEXTO):
{context_str}
"""
        
        # Inicializando o modelo
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash", # Usando modelo rápido e eficiente
            system_instruction=system_instruction
        )
        
        # Convertendo histórico para o formato do Gemini
        # Gemini usa "user" e "model"
        formatted_history = []
        for msg in req.history:
            role = "user" if msg.role == "user" else "model"
            formatted_history.append({"role": role, "parts": [msg.content]})
            
        # Iniciando sessão de chat
        chat_session = model.start_chat(history=formatted_history)
        
        # Enviando mensagem do usuário
        response = chat_session.send_message(req.message)
        
        return {"response": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao comunicar com a IA: {str(e)}")

@router.post("/triagem")
async def triagem_vulnerabilidade(req: TriagemRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada no servidor.")

    try:
        context_str = json.dumps(req.prontuario_context, ensure_ascii=False, indent=2)
        system_instruction = f"""{SUAS_BASE_CONTEXT}
        
Você é um especialista em Assistência Social (SUAS). Sua tarefa é realizar a triagem de vulnerabilidade social de uma família com base nos dados fornecidos.
Analise os dados do requerente e os históricos (se houver) e determine o Nível de Risco/Vulnerabilidade.

Retorne ÚNICA E EXCLUSIVAMENTE um objeto JSON válido (sem markdown, sem blocos de código) no seguinte formato exato:
{{
  "score": "Alto Risco" | "Médio Risco" | "Baixo Risco",
  "cor": "vermelho" | "amarelo" | "verde",
  "motivo": "Breve justificativa de 1 a 2 frases explicando o porquê desta classificação."
}}

DADOS PARA TRIAGEM:
{context_str}
"""
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction
        )
        
        response = model.generate_content("Realize a triagem e retorne o JSON.")
        
        # Parse JSON
        resp_text = response.text.strip()
        if resp_text.startswith("```json"):
            resp_text = resp_text.replace("```json", "").replace("```", "").strip()
        elif resp_text.startswith("```"):
            resp_text = resp_text.replace("```", "").strip()
            
        return json.loads(resp_text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na triagem com IA: {str(e)}")

@router.post("/resumo")
async def gerar_resumo(req: TriagemRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada no servidor.")

    try:
        context_str = json.dumps(req.prontuario_context, ensure_ascii=False, indent=2)
        system_instruction = f"""{SUAS_BASE_CONTEXT}
        
Você é um especialista em Assistência Social (SUAS). Sua tarefa é ler todo o histórico e dados de um requerente e gerar um "Resumo Executivo" em formato Markdown.
O objetivo deste resumo é permitir que um novo profissional ou gerente entenda a situação atual e o histórico da família em segundos, sem precisar ler dezenas de páginas.

Inclua:
- Uma breve introdução sobre a família.
- Principais vulnerabilidades identificadas.
- Resumo cronológico muito sucinto das últimas intervenções.
- Próximos passos sugeridos ou alertas importantes.

Retorne APENAS o texto em Markdown, sem blocos de código (```markdown), apenas o conteúdo direto formatado de forma limpa e profissional.

DADOS DA FAMÍLIA E HISTÓRICO:
{context_str}
"""
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash", # Mudado para flash por conta do limite de cota da API (429) no plano gratuito
            system_instruction=system_instruction
        )
        
        response = model.generate_content("Gere o resumo executivo em Markdown.")
        
        return {"resumo": response.text.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar resumo com IA: {str(e)}")
