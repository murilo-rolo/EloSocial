---
name: elosocial
description: Contexto completo do projeto EloSocial — Prontuário SUAS para CRAS. Stack, arquitetura, DB, rotas, endpoints, convenções e backlog.
---

# EloSocial — Contexto do Projeto

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + JavaScript + Vite + PWA |
| Backend | Python + FastAPI (PDF + admin de usuários) |
| Banco + Auth + Realtime | Supabase Cloud |
| Chat | Supabase Realtime (subscriptions PostgreSQL) |
| PDF | ReportLab |

## Arquitetura

```
Frontend (React PWA) ←→ Supabase SDK (Auth, DB, Realtime)
                    ←→ FastAPI (POST /api/pdf, /api/hash, /api/users)
```

- O frontend se comunica **diretamente com o Supabase** para autenticação, CRUD e chat
- O FastAPI é usado **apenas** para gerar PDF (ReportLab) e administração de usuários (via service_role_key)
- As permissões são controladas via **RLS (Row Level Security)** no banco Supabase

## Decisões de Projeto

| Decisão | Escolha | Motivo |
|---|---|---|
| Linguagem frontend | JavaScript (não TypeScript) | Preferência do usuário |
| Banco de dados | Supabase (PostgreSQL) | Auth + Realtime + RLS nativos |
| Autenticação | Supabase Auth + JWT | Nativo, sem implementar manualmente |
| Chat | Supabase Realtime | Substitui WebSocket customizado |
| Domínio de email | Validação via trigger SQL | Bloqueia emails não-institucionais (`%.gov.br` e `%.gov.com.br`) |
| Escopo por CRAS | Coluna `cras` na tabela `profiles` | Gerente gerencia apenas usuários do mesmo CRAS |
| Deploy | Vercel (frontend + backend serverless) | Monorepo, dois projetos separados |
| Docker | Não usar | Preferência do usuário |
| Relatórios | JSON armazenado + PDF exportado | Imutabilidade via hash SHA-256 |

## Convenções

- **Linguagem:** JavaScript (`.jsx` / `.js`), sem TypeScript
- **CSS:** `frontend/src/index.css` — mobile-first, media queries em 768px, CSS custom properties, sem Tailwind/CSS-in-JS
- **Rotas:** React Router v6 em `App.jsx`
- **Auth:** Supabase Auth via `AuthContext` + hook `useAuth`
- **Joins no Dashboard:** `Promise.all` manual (Supabase FK joins são instáveis neste projeto)
- **Escopo CRAS:** Cada usuário vinculado a uma das 12 unidades; gerentes gerenciam apenas seu próprio CRAS

## Estrutura de Arquivos

```
elosocial/
├── .opencode/
│   └── skills/elosocial/SKILL.md    ← Este arquivo
├── README.md                        ← Documentação pública
├── BACKLOG.md                       ← Backlog contínuo
├── supabase/migrations/
│   ├── 00001_schema.sql             ← Schema + RLS + triggers
│   └── 00002_add_cras.sql           ← CRAS: coluna `cras` + RLS atualizada
├── backend/                         ← FastAPI (Vercel serverless)
│   ├── app/
│   │   ├── main.py                  ← App FastAPI + CORS + rotas
│   │   ├── config.py                ← SUPABASE_URL, SERVICE_KEY, ALLOWED_ORIGINS
│   │   ├── api/
│   │   │   ├── reports.py           ← POST /api/pdf, POST /api/hash
│   │   │   └── users_admin.py       ← POST/DELETE /api/users
│   │   └── services/
│   │       └── pdf_generator.py     ← ReportLab (13 seções + assinatura)
│   ├── api/index.py                 ← Entry point Vercel
│   └── vercel.json
└── frontend/                        ← React + PWA (Vite)
    ├── src/
    │   ├── main.jsx                 ← Entry point
    │   ├── App.jsx                  ← React Router (9 rotas)
    │   ├── index.css                ← Estilos globais mobile-first
    │   ├── lib/supabase.js          ← Cliente Supabase
    │   ├── contexts/AuthContext.jsx ← Estado de autenticação
    │   ├── hooks/
    │   │   ├── useAuth.js           ← login, logout, signup, sessão
    │   │   └── useRealtime.js       ← Subscriptions PostgreSQL
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx   ← Rota protegida por role
    │   │   └── Layout/              ← Layout, Sidebar, Topbar
    │   ├── pages/
    │   │   ├── Login.jsx            ← Login com email institucional
    │   │   ├── Dashboard.jsx        ← Stats + prontuários recentes
    │   │   ├── Requerentes.jsx      ← CRUD + busca nome/CPF
    │   │   ├── RequerenteDetail.jsx ← Detalhes + prontuários vinculados
    │   │   ├── Prontuarios.jsx      ← Lista de prontuários
    │   │   ├── ProntuarioEdit.jsx   ← Formulário 13 seções colapsáveis
    │   │   ├── ProntuarioView.jsx   ← Visualização + exportação PDF/JSON
    │   │   ├── Chat.jsx            ← Chat em tempo real (Realtime)
    │   │   └── Admin.jsx           ← Gerenciar usuários + auditoria + CRAS
    │   └── utils/
    │       ├── roles.js            ← Perfis, CRAS_LIST (12 unidades)
    │       ├── format.js           ← formatação CPF, data, telefone
    │       └── prontuarioSchema.js ← Schema vazio + seções
    ├── public/
    │   ├── manifest.json            ← PWA manifest
    │   ├── sw.js                    ← Service Worker (cache-first)
    │   └── favicon.svg
    ├── vercel.json, vite.config.js, package.json, .env.example
    └── ...
```

## Modelo de Dados (Supabase — 6 tabelas)

### Tabelas

1. **profiles** — Estende `auth.users`. Campos: `id` (FK), `nome`, `email`, `role` (enum: assistente_social, psicologo, pedagogo, tecnico, gerente), `ativo`, `cras` (TEXT, CHECK 12 unidades), `created_at`
2. **applicants** — Requerentes. Campos: `id` (UUID PK), `nis` (unique), `nome`, `cpf` (unique), `rg`, `rg_orgao`, `rg_uf`, `rg_data_emissao`, `data_nascimento`, `sexo`, `telefone`, `endereco` (JSONB), `localizacao` (urbano/rural), `ponto_referencia`, `composicao_familiar` (JSONB), `observacoes`, `created_by` (FK profiles), `created_at`, `updated_at`
3. **prontuarios** — Relatórios. Campos: `id` (UUID PK), `applicant_id` (FK), `created_by` (FK), `dados_json` (JSONB), `hash_assinatura`, `assinado_por` (FK), `assinado_em`, `versao` (int), `created_at`, `updated_at`
4. **atendimentos** — Histórico. Campos: `id` (UUID PK), `prontuario_id` (FK), `profissional_id` (FK), `data_atendimento`, `tipo_atendimento`, `descricao`, `observacoes`, `created_at`
5. **messages** — Chat. Campos: `id` (UUID PK), `remetente_id` (FK), `destinatario_id` (FK), `grupo`, `conteudo`, `lida`, `created_at`
6. **audit_logs** — Auditoria. Campos: `id` (UUID PK), `user_id` (FK), `acao`, `detalhes` (JSONB), `ip`, `created_at`

### RLS

- **profiles:** SELECT autenticados, UPDATE (próprio ou gerente do mesmo CRAS)
- **applicants:** ALL autenticados (compartilhado na rede)
- **prontuarios:** SELECT/INSERT autenticados, UPDATE (criador ou gerente)
- **atendimentos:** SELECT/INSERT autenticados
- **messages:** SELECT (próprias ou de grupo), INSERT autenticados
- **audit_logs:** SELECT só gerente, INSERT autenticados

### Triggers

- `handle_new_user()` (AFTER INSERT `auth.users`) — Cria `profiles` com dados de `raw_user_meta_data` (`nome`, `role`, `cras`)
- `validate_institutional_email()` (BEFORE INSERT `auth.users`) — Rejeita emails fora de `%.gov.br` ou `%.gov.com.br`

## Perfis de Acesso

| Perfil | Prontuário | Requerentes | Chat | Admin |
|---|---|---|---|---|
| Assistente Social | CRUD | CRUD | ✅ | ❌ |
| Psicólogo | CRUD | CRUD | ✅ | ❌ |
| Pedagogo | CRUD | CRUD | ✅ | ❌ |
| Técnico | CRUD | CRUD | ✅ | ❌ |
| Gerente | CRUD (tudo) | CRUD | ✅ | ✅ |

## Unidades CRAS (12 unidades — Belém/PA)

CRAS Aura, CRAS Barreiro, CRAS Bengui, CRAS Cremação, CRAS Guama, CRAS Icoaraci, CRAS Jurunas, CRAS Mosqueiro, CRAS Outeiro, CRAS Pedreira, CRAS Tapana, CRAS Terra Firme

`CRAS_LIST` em `utils/roles.js` — atualizar se unidades mudarem.

## Prontuário SUAS (13 seções em `dados_json`)

1. identificacao, 2. composicao_familiar, 3. habitacional, 4. educacional, 5. trabalho_renda, 6. saude, 7. beneficios, 8. convivencia, 9. participacao, 10. violencia, 11. encaminhamentos, 12. observacoes (+ atendimentos em tabela separada)

## Rotas do Frontend

| Rota | Página | Acesso |
|---|---|---|
| `/login` | Login | Público |
| `/` | Dashboard | Autenticado |
| `/requerentes` | Lista Requerentes | Autenticado |
| `/requerentes/:id` | Detalhe Requerente | Autenticado |
| `/prontuarios` | Lista Prontuários | Autenticado |
| `/prontuarios/novo/:applicantId` | Novo Prontuário | Autenticado |
| `/prontuarios/:id` | Ver Prontuário | Autenticado |
| `/chat` | Chat | Autenticado |
| `/admin` | Admin | Gerente |

## Endpoints Backend (FastAPI)

| Método | Rota | Função |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/pdf` | Gera PDF do prontuário |
| POST | `/api/hash` | Gera hash SHA-256 do JSON |
| POST | `/api/users` | Cria usuário (Admin API + service_role — inclui `cras`) |
| DELETE | `/api/users/:id` | Exclui usuário (Admin API) |

## Como Executar

```bash
# Frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173

# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
# → http://localhost:8000
```

## Variáveis de Ambiente

### Frontend (prefixo `VITE_`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (ex: `http://localhost:8000`)

### Backend
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `ALLOWED_ORIGINS` (separado por vírgula)

## Deploy (Vercel)

Dois projetos separados no mesmo repositório:
1. **Frontend:** root=`frontend`, framework=Vite, build=`npm run build`, output=`dist`
2. **Backend:** root=`backend`, Python auto-detect (usa `api/index.py`)

## Observações Técnicas

1. `service_role_key` fica **apenas** no backend (.env), nunca no frontend
2. `anon_key` fica no frontend (.env) — RLS protege os dados
3. `handle_new_user()` cria profile automaticamente no signup, propagando `nome`, `role` e `cras` do `user_metadata`
4. Para criar usuários sem confirmação de email, usa-se Admin API (`POST /api/users`) com `service_role_key`
5. Frontend usa `import.meta.env.VITE_*` (Vite); backend usa `os.getenv()` + `.env`
6. Dashboard usa `Promise.all` para joins (Supabase FK joins são instáveis)
7. Chat usa Supabase Realtime (subscriptions PostgreSQL), não WebSocket customizado
8. Migration `00002_add_cras.sql` adiciona coluna `cras` com CHECK de 12 unidades
9. Gerentes só gerenciam usuários do mesmo CRAS (RLS + filtro frontend)
10. Domínios de email aceitos: `%.gov.br` e `%.gov.com.br`

## Backlog

### ✅ Concluído
- Supabase: migrations 00001 + 00002, RLS, triggers, seed
- Backend: FastAPI, PDF (ReportLab), admin de usuários com CRAS
- Frontend: setup, auth, layout PWA, Dashboard, Requerentes CRUD
- Frontend: Prontuário SUAS (13 seções), PDF/JSON export
- Frontend: Chat (Realtime), Admin (usuários + CRAS scoping)
- Documentação: README, BACKLOG, SKILL.md

### 🔄 Em andamento
- Testar fluxo completo: cadastro → prontuário → PDF
- Ajustar responsividade mobile (viewport 360px)
- Validar RLS policies
- Deploy: Vercel (frontend + backend)

### 📋 Futuro
- Dashboard estatístico com gráficos
- Relatórios gerenciais
- Filtros avançados (data, profissional, faixa etária, bairro)
- Exportar estatísticas CSV/PDF
