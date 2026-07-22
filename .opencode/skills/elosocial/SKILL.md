---
name: elosocial
description: Prontuário SUAS para CRAS com IA Copiloto. Stack, arquitetura, convenções, DB, rotas e endpoints.
---

# EloSocial — Contexto do Projeto

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + JavaScript + Vite + PWA + Tailwind CSS v4 |
| Backend | Python + FastAPI (PDF, IA, admin de usuários) |
| Banco + Auth + Realtime | Supabase Cloud |
| IA / LLM | Google Gemini API (gemini-3.5-flash, gemini-embedding-2) |
| RAG / Vetores | pgvector (Supabase PostgreSQL) |
| Chat | Supabase Realtime (subscriptions PostgreSQL) |
| PDF | ReportLab |
| Videoconferência | Daily.co API + daily-js SDK |
| Ícones | lucide-react |
| Gráficos | recharts |

## Arquitetura

```
Frontend (React PWA + Tailwind) ←→ Supabase SDK (Auth, DB, Realtime)
                                ←→ FastAPI (PDF, IA/RAG/OCR, admin)
```

- Frontend comunica **diretamente com Supabase** para auth, CRUD e chat
- FastAPI usado para: PDF (ReportLab), admin de usuários, **IA (Gemini)**, **RAG (pgvector)**, **OCR**, **geração de pareceres**
- Permissões via **RLS** no banco Supabase

## Decisões de Projeto

| Decisão | Escolha | Motivo |
|---|---|---|
| Linguagem | JavaScript (não TS) | Preferência do usuário |
| Banco | Supabase (PostgreSQL) | Auth + Realtime + RLS nativos |
| Auth | Supabase Auth + JWT | Nativo, sem implementar manualmente |
| Chat | Supabase Realtime | Substitui WebSocket customizado |
| Domínio email | Trigger SQL | Bloqueia emails fora de `%.gov.br` e `%.gov.com.br` |
| Escopo CRAS | Coluna `cras` em `profiles` | Gerente gerencia apenas usuários do mesmo CRAS |
| Deploy | Vercel (frontend + backend serverless) | Monorepo, dois projetos separados |
| Docker | Setup via `setup.sh` (templates `.example` no git, `.env` e Dockerfiles ignorados) | Evita vazar credenciais; artefatos locais gerados sob demanda |
| Relatórios | JSON + PDF exportado | Imutabilidade via hash SHA-256 |
| Videoconferência | Daily.co (chave no backend) | daily-js no frontend |
| IA | Google Gemini (gemini-3.5-flash) | Cota gratuita, tool calling nativo, multimodal (OCR) |
| RAG | pgvector + busca híbrida | Embeddings 768d, busca semântica + textual |
| CSS | Tailwind CSS v4 | Utility-first, tema escuro/claro via CSS custom properties |

## Convenções

- **Linguagem:** JavaScript (`.jsx` / `.js`), sem TypeScript
- **CSS:** Tailwind CSS v4 (`@import "tailwindcss"`) + CSS custom properties para temas (escuro/claro)
- **Rotas:** React Router v6 em `App.jsx`
- **Auth:** Supabase Auth via `AuthContext` + hook `useAuth`
- **Joins no Dashboard:** `Promise.all` manual (Supabase FK joins instáveis)
- **Escopo CRAS:** Cada usuário vinculado a uma das 12 unidades; gerentes gerenciam só o próprio CRAS
- **IA Contexto:** Prompt base em `backend/app/api/suas_context.py` (diretrizes SUAS/LOAS)
- **IA Config:** `GEMINI_API_KEY` centralizada em `backend/app/config.py` (todos os módulos importam de lá)
- **Ícones:** lucide-react em todas as páginas

## Perfis de Acesso

| Perfil | Prontuário | Requerentes | Chat | IA | Admin |
|---|---|---|---|---|---|
| Assistente Social | CRUD | CRUD | ✅ | ✅ | ❌ |
| Psicólogo | CRUD | CRUD | ✅ | ✅ | ❌ |
| Pedagogo | CRUD | CRUD | ✅ | ✅ | ❌ |
| Técnico | CRUD | CRUD | ✅ | ✅ | ❌ |
| Gerente | CRUD (tudo) | CRUD | ✅ | ✅ | ✅ |

## Funcionalidades de IA (Copiloto SUAS)

| Funcionalidade | Endpoint | Descrição | RAG |
|---|---|---|---|
| ChatIA | `POST /api/chat-ai` | Chat contextual com IA sobre prontuário do requerente | ✅ Tool calling + pré-consulta |
| Triagem | `POST /api/triagem` | Análise automática de vulnerabilidade (score + cor) | ✅ Tool calling |
| Resumo | `POST /api/resumo` | Resumo executivo do histórico do requerente | ✅ Tool calling |
| Parecer | `POST /api/generate-parecer` | Geração de relatório (padrão, jurídico, saúde) | ❌ |
| RAG Upload | `POST /api/rag/upload` / `POST /api/rag/upload_file` | Upload de PDFs para base de conhecimento | — |
| RAG Query | `POST /api/rag/query` | Busca híbrida (semântica + textual) | — |
| OCR | `POST /api/ocr/extract_requerente` | Extração de dados de documentos (RG, CPF, CNH) | ❌ |

### Frontend — Copiloto SUAS em RequerenteDetail

| Ação | Descrição |
|---|---|
| **Triagem IA** | Botão no detail que chama `/api/triagem` e salva resultado em `applicants.vulnerabilidade_*` |
| **Resumo IA** | Botão no detail que chama `/api/resumo` e exibe em modal com cópia |
| **Copiloto SUAS** | Widget flutuante (`ChatLLM`) que pré-carrega contexto RAG ao abrir e mantém tool calling |

## Unidades CRAS (Belém/PA)

CRAS Aura, Barreiro, Bengui, Cremação, Guama, Icoaraci, Jurunas, Mosqueiro, Outeiro, Pedreira, Tapana, Terra Firme

## Prontuário SUAS (13 seções em `dados_json`)

1. identificacao, 2. composicao_familiar, 3. habitacional, 4. educacional, 5. trabalho_renda, 6. saude, 7. beneficios, 8. convivencia, 9. participacao, 10. violencia, 11. encaminhamentos, 12. observacoes

## Como Executar

```bash
# Setup (cria .env e Dockerfiles a partir dos templates .example)
./setup.sh

# Frontend
cd frontend && npm install && npm run dev  # → http://localhost:5173
# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --reload-strategy stat  # → http://localhost:8000
```

## Variáveis de Ambiente

Os arquivos `.env` são gerados a partir dos `.env.example` via `setup.sh` / `setup.bat` e ignorados pelo `.gitignore`.

**Frontend (prefixo `VITE_`):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
**Backend:** `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `ALLOWED_ORIGINS`

---

## Arquivos de Referência

Leia estes arquivos **quando necessário** (detalhes não estão no contexto inicial para agilizar a resposta):

- `ESTRUTURA.md` — Árvore completa de diretórios
- `MODELO_DADOS.md` — Schema das tabelas, migrations, RLS e triggers
- `ROTAS.md` — Rotas do frontend + endpoints do backend
- `OBSERVACOES.md` — Observações técnicas importantes
- `BACKLOG.md` — Backlog concluído, em andamento e futuro
