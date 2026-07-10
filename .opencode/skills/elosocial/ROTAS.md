# Rotas do Frontend

| Rota | Página | Acesso |
|---|---|---|
| `/login` | Login | Público |
| `/cadastro` | Cadastro | Público |
| `/` | Dashboard | Autenticado |
| `/agenda` | Agenda de Atendimentos | Autenticado |
| `/requerentes` | Lista Requerentes | Autenticado |
| `/requerentes/:id` | Detalhe Requerente + Triagem IA | Autenticado |
| `/prontuarios/novo/:applicantId` | Novo Prontuário | Autenticado |
| `/prontuarios/:id` | Ver Prontuário + Resumo IA | Autenticado |
| `/chat` | Chat (Realtime) | Autenticado |
| `/chat-ia` | ChatIA (split-view com IA) | Autenticado |
| `/videoconferencia` | Videoconferência | Autenticado |
| `/conhecimento` | Base de Conhecimento RAG | Autenticado |
| `/perfil` | Perfil do Usuário | Autenticado |
| `/admin` | Admin (usuários + CRAS) | Gerente |

# Endpoints Backend (FastAPI)

## Core

| Método | Rota | Função |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/pdf` | Gera PDF do prontuário |
| POST | `/api/hash` | Gera hash SHA-256 do JSON |

## Admin

| Método | Rota | Função |
|---|---|---|
| POST | `/api/users` | Cria usuário (Admin API + service_role — inclui `cras`) |
| DELETE | `/api/users/:id` | Exclui usuário (Admin API) |

## Videoconferência

| Método | Rota | Função |
|---|---|---|
| POST | `/api/rooms` | Cria sala no Daily.co (pública ou privada) |
| POST | `/api/rooms/join` | Valida código e retorna URL da sala privada |

## IA — Copiloto SUAS

| Método | Rota | Função |
|---|---|---|
| POST | `/api/chat-ai` | Chat contextual com IA sobre prontuário (tool calling RAG) |
| POST | `/api/triagem` | Triagem de vulnerabilidade automática (score + cor) |
| POST | `/api/resumo` | Resumo executivo do histórico do requerente |
| POST | `/api/generate-parecer` | Geração de parecer (formato: padrao_suas, juridico, saude) |
| POST | `/api/search-global` | EloBot: assistente IA gerencial (busca global) |

## RAG — Base de Conhecimento

| Método | Rota | Função |
|---|---|---|
| POST | `/api/rag/upload` | Upload de texto (vetoriza e salva chunks) |
| POST | `/api/rag/upload_file` | Upload de arquivo PDF/TXT (extrai texto + vetoriza) |
| GET | `/api/rag/documents` | Lista documentos da base de conhecimento |
| DELETE | `/api/rag/documents/:id` | Remove documento e chunks associados |
| POST | `/api/rag/query` | Consulta busca híbrida (semântica + lexical) |

## OCR

| Método | Rota | Função |
|---|---|---|
| POST | `/api/ocr/extract_requerente` | Extração de dados de documento (RG, CPF, CNH) via Gemini Vision |
