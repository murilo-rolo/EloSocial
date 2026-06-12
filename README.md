# EloSocial

Sistema de Prontuário Eletrônico SUAS para CRAS.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + JavaScript + Vite + PWA |
| Backend | Python + FastAPI (apenas PDF) |
| Banco + Auth | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| Chat | Supabase Realtime (WebSocket nativo) |
| PDF | ReportLab |

## Funcionalidades

- **Prontuário SUAS** — Registro único padronizado com 13 seções
- **Busca de Requerentes** — Por CPF ou nome, com prontuários vinculados
- **Chat interno** — Mensagens em tempo real entre profissionais
- **Exportação PDF** — Prontuário completo em PDF formatado
- **Controle de Acesso** — 5 perfis: assistente social, psicólogo, pedagogo, técnico, gerente
- **Dispositivo Móvel** — PWA instalável no celular
- **Estatísticas** *(futuro)* — Dashboard gerencial com gráficos de atendimentos, prontuários e indicadores da unidade

## Perfis

| Perfil | Acesso |
|---|---|
| Assistente Social | Cadastra requerentes, preenche seções social/habitacional/trabalho/benefícios/encaminhamentos |
| Psicólogo | Preenche seções saúde/convivência/violência/observações |
| Pedagogo | Preenche seções educacional/participação/observações |
| Técnico | Preenche composição familiar/atendimentos/encaminhamentos |
| Gerente | Acessa tudo, gerencia usuários, auditoria |

## Pré-requisitos

- Node.js 18+
- Python 3.10+
- Conta gratuita em [supabase.com](https://supabase.com)

## Setup rápido

### 1. Supabase

Crie um projeto em supabase.com, execute `supabase/migrations/00001_schema.sql` no SQL Editor e configure Authentication.

### 2. Backend (local)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### 3. Frontend (local)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Deploy no Vercel

O projeto está configurado para deploy como **dois projetos separados** no Vercel (monorepo).

### Frontend (elosocial.vercel.app)

| Config | Valor |
|---|---|
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output | `dist` |
| Env: `VITE_SUPABASE_URL` | URL do seu Supabase |
| Env: `VITE_SUPABASE_ANON_KEY` | Anon key do Supabase |
| Env: `VITE_API_URL` | URL do backend (ex: `https://elosocial-api.vercel.app`) |

**Passo a passo:**
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório git
3. Em **Root Directory**, digite `frontend`
4. Clique em **Deploy**
5. Vá em **Settings > Environment Variables** e adicione as 3 variáveis acima
6. Re-deploy

### Backend (elosocial-api.vercel.app)

O backend do EloSocial já inclui o arquivo `api/index.py` para funcionar como Serverless Function no Vercel.

| Config | Valor |
|---|---|
| Root Directory | `backend` |
| Framework | Other |
| Build | Detectado automaticamente (`@vercel/python`) |
| Env: `SUPABASE_URL` | URL do seu Supabase |
| Env: `SUPABASE_SERVICE_KEY` | Service role key do Supabase |
| Env: `ALLOWED_ORIGINS` | `https://elosocial.vercel.app` |

**Passo a passo:**
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o **mesmo** repositório
3. Em **Root Directory**, digite `backend`
4. Clique em **Deploy**
5. Vá em **Settings > Environment Variables** e adicione as variáveis
6. Re-deploy

> **Atenção:** O Vercel tem limite de 10s para serverless functions. Para relatórios PDF muito grandes, considere usar [Render](https://render.com) para o backend (suporta processos longos).

## Estrutura

```
elosocial/
├── supabase/migrations/   # Schema SQL + RLS
├── backend/               # FastAPI (PDF)
│   └── app/services/pdf_generator.py
└── frontend/              # React + PWA
    └── src/
        ├── pages/         # Login, Dashboard, Requerentes, Prontuario, Chat, Admin
        ├── components/    # Layout, Chat, Prontuario (seções), ProtectedRoute
        ├── hooks/         # useAuth, useRealtime
        ├── lib/supabase.js
        └── utils/         # roles, prontuarioSchema, format
```

## Licença

Projeto interno — uso exclusivo da rede socioassistencial.
