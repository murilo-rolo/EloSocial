# EloSocial

Sistema de Prontuário Eletrônico SUAS para CRAS.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + JavaScript + Vite + PWA |
| Backend | Python + FastAPI (PDF + admin de usuários) |
| Banco + Auth | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| Chat | Supabase Realtime (WebSocket nativo) |
| PDF | ReportLab |
| Videoconferência | Daily.co API + daily-js SDK |

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React PWA)                        │
│                                                                 │
│  ┌──────────┐ ┌───────────┐ ┌──────┐ ┌──────────────┐ ┌──────┐│
│  │ Dashboard│ │Requerentes│ │ Chat │ │Videoconf.    │ │Admin ││
│  └────┬─────┘ └─────┬─────┘ └──┬───┘ └──────┬───────┘ └──┬───┘│
│       │              │          │            │            │    │
│  ┌────▼──────────────▼──────────▼────────────▼────────────▼──┐│
│  │                Supabase SDK (supabase-js)                  ││
│  │        Auth · DB queries · Realtime · daily-js            ││
│  └─────────────────────┬─────────────────────────────────────┘│
└────────────────────────┼───────────────────────────────────────┘
                         │
           ┌─────────────┼──────────────┬──────────────┐
           ▼             ▼              ▼              ▼
┌──────────────────┐ ┌───────────┐ ┌──────────────┐ ┌──────────────┐
│  Supabase Auth    │ │PostgreSQL │ │ Supabase API │ │ Daily.co API │
│ (email + JWT)     │ │  (RLS)    │ │ (service_key)│ │  (vídeo)     │
└──────────────────┘ └───────────┘ └──────┬───────┘ └──────▲───────┘
                                          │                │
                                 ┌────────┴────────┐       │
                                 │  FastAPI (PDF +  │       │
                                 │   admin + rooms) │───────┘
                                 │ POST /api/rooms  │
                                 └─────────────────┘
```

### Fluxo de dados

| Operação | Caminho |
|---|---|
| CRUD (requerentes, prontuários) | Frontend → Supabase SDK → PostgreSQL (RLS valida o JWT do usuário) → resposta direta |
| Chat | Frontend → INSERT messages → PostgreSQL NOTIFY → Realtime broadcast → todos os participantes |
| Exportar PDF | Frontend coleta dados → `POST /api/pdf` → FastAPI (ReportLab) → download do PDF |
| Criar usuário | Frontend → `POST /api/users` → FastAPI → Supabase Admin API → Auth + trigger cria profile |
| Videoconferência | Frontend → `POST /api/rooms` → FastAPI cria sala no Daily.co → frontend entra com daily-js |

### Decisões arquiteturais

| Decisão | Escolha | Motivo |
|---|---|---|
| Auth | Supabase Auth + JWT, sem middleware | RLS no banco valida permissão em cada consulta |
| CRUD | Direto do frontend ao Supabase | Evita replicar lógica de negócio no backend |
| FastAPI | Apenas PDF + admin + vídeo | Operações que exigem chave secreta (service_role, Daily.co API key) |
| Deploy | Dois projetos Vercel separados | Frontend como S3/CDN, backend como serverless function |
| Chat | Supabase Realtime | Substitui WebSocket customizado, integrado ao banco |

## Funcionalidades

- **Prontuário SUAS** — Registro único padronizado com 13 seções
- **Busca de Requerentes** — Por CPF ou nome, com prontuários vinculados
- **Chat interno** — Mensagens em tempo real entre profissionais
- **Videoconferência** — Salas de vídeo públicas ou privadas (com código de acesso) entre profissionais, via Daily.co
- **Exportação PDF** — Prontuário completo em PDF formatado
- **Controle de Acesso** — 5 perfis: assistente social, psicólogo, pedagogo, técnico, gerente
- **Escopo por CRAS** — Cada profissional vinculado a uma das 12 unidades de Belém; gerentes gerenciam apenas seu próprio CRAS
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

## Unidades CRAS

O sistema atende 12 unidades do CRAS em Belém/PA:

| CRAS | Região |
|---|---|
| CRAS Aura | |
| CRAS Barreiro | |
| CRAS Bengui | |
| CRAS Cremação | |
| CRAS Guama | |
| CRAS Icoaraci | |
| CRAS Jurunas | |
| CRAS Mosqueiro | |
| CRAS Outeiro | |
| CRAS Pedreira | |
| CRAS Tapana | |
| CRAS Terra Firme | |

Cada profissional é vinculado a um CRAS no momento do cadastro. Gerentes só visualizam e gerenciam usuários do seu próprio CRAS.

## Pré-requisitos

- Node.js 18+
- Python 3.10+
- Conta gratuita em [supabase.com](https://supabase.com)
- Conta gratuita em [daily.co](https://daily.co) (para videoconferência)

## Setup rápido

### 🐳 Rodar com Docker (Recomendado & Mais Simples)

Para rodar com Docker sem precisar instalar Node.js ou Python na sua máquina:

1. **Configurar as variáveis de ambiente:**
   - No **Linux/macOS**, execute `./run.sh`
   - No **Windows**, execute `run.bat` (ou dê dois cliques no arquivo)
2. **Atualizar credenciais:**
   Abra os arquivos `.env` gerados em `backend/.env` e `frontend/.env` e configure suas chaves do Supabase.
3. **Acessar:**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:8000](http://localhost:8000)

*Para mais detalhes, confira o guia completo em [DOCKER.md](file:///home/gabriel/Downloads/EloSocial-main/DOCKER.md).*

---

### 🛠️ Setup Manual (Sem Docker)

#### 1. Supabase

Crie um projeto em supabase.com, execute as migrations em ordem no SQL Editor (`00001_schema.sql`, `00002_add_cras.sql`, `00003_video_rooms.sql`) e configure Authentication.

#### 2. Backend (local)

```bash
cd backend
python -m venv venv && venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env
# Configure SUPABASE_URL, SUPABASE_SERVICE_KEY, ALLOWED_ORIGINS e DAILY_API_KEY no .env
uvicorn app.main:app --reload
```

#### 3. Frontend (local)

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
| Env: `DAILY_API_KEY` | API key do Daily.co (videoconferência) |

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
├── supabase/migrations/   # Schema SQL + RLS (00001) + CRAS (00002) + Vídeo (00003)
├── backend/               # FastAPI (PDF + admin + videoconferência)
│   ├── app/api/video.py   # POST /api/rooms, /api/rooms/join
│   └── app/services/pdf_generator.py
└── frontend/              # React + PWA
    └── src/
        ├── pages/         # Login, Dashboard, Requerentes, Prontuario, Chat, Videoconferencia, Admin
        ├── components/    # Layout, Chat, Prontuario (seções), ProtectedRoute
        ├── hooks/         # useAuth, useRealtime
        ├── lib/supabase.js
        └── utils/         # roles, prontuarioSchema, format
```

## Fluxo Git

```bash
# Criar e trocar para uma nova branch
git checkout -b nome-da-feature

# Verificar arquivos modificados
git status

# Adicionar arquivos ao stage
git add .
git add caminho/do/arquivo   # ou específico

# Commitar com mensagem descritiva
git commit -m "Descrição do que foi feito"

# Trocar para outra branch já existente
git checkout nome-da-branch

# Buscar alterações do remoto
git pull

# Publicar commits no remoto (primeiro push da branch)
git push -u origin nome-da-branch

# Publicar commits nas próximas vezes
git push
```

## Licença

Projeto interno — uso exclusivo da rede socioassistencial.
