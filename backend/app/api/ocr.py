from fastapi import APIRouter, HTTPException, UploadFile, File
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

@router.post("/ocr/extract_requerente")
async def extract_requerente(file: UploadFile = File(...)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada no servidor.")

    try:
        # Lê os bytes do arquivo enviado
        file_bytes = await file.read()
        mime_type = file.content_type
        
        # Validar tipo de arquivo
        supported_types = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        if mime_type not in supported_types:
            raise HTTPException(status_code=400, detail=f"Tipo de arquivo não suportado ({mime_type}). Envie JPG, PNG, WEBP ou PDF.")

        # Instruções para o Gemini
        system_instruction = """
        Você é um assistente especialista em leitura de documentos oficiais brasileiros (RG, CNH, CPF, Comprovante de Residência, etc).
        Sua tarefa é extrair as informações do documento anexado e preencher os dados de um cidadão para um sistema de assistência social.
        Se alguma informação não estiver presente no documento, deixe o valor do campo como uma string vazia ("").
        
        Retorne ÚNICA E EXCLUSIVAMENTE um objeto JSON válido (sem marcação markdown, sem bloco de código ```json) com os seguintes campos:
        {
          "nome": "Nome completo",
          "cpf": "Apenas os 11 números, sem pontos ou traços",
          "rg": "Apenas números e letras do RG",
          "data_nascimento": "No formato YYYY-MM-DD",
          "nome_mae": "Nome completo da mãe",
          "sexo": "Masculino" ou "Feminino"
        }
        """
        
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction,
            generation_config={"response_mime_type": "application/json"}
        )
        
        contents = [
            {"mime_type": mime_type, "data": file_bytes},
            "Extraia os dados deste documento e retorne no formato JSON."
        ]
        
        response = model.generate_content(contents)
        
        # O gemini já retorna JSON puro devido ao response_mime_type
        return json.loads(response.text)

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Erro ao converter a resposta da IA para JSON.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na extração OCR: {str(e)}")
