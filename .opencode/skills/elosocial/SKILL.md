---
name: elosocial
description: Use when working on the EloSocial project — Prontuário SUAS for CRAS. Keywords: elosocial, prontuario, SUAS, CRAS, requerente, assistente social. Contains full project context, architecture, file structure, and conventions.
---

# EloSocial Project Skill

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + JavaScript + Vite + PWA |
| Backend | Python + FastAPI (PDF + user admin only) |
| DB + Auth + Realtime | Supabase Cloud |
| Chat | Supabase Realtime (PostgreSQL subscriptions) |
| PDF | ReportLab |

## Architecture

```
Frontend (React PWA) ←→ Supabase SDK (Auth, DB, Realtime)
                    ←→ FastAPI (PDF + user admin via service_role)
```

- Frontend talks **directly to Supabase** for auth, CRUD, and chat
- FastAPI handles **only** PDF generation and user admin (uses service_role_key)
- Permissions are enforced via **Supabase RLS**, not middleware

## Key Conventions

- **Language**: JavaScript (NOT TypeScript). Files use `.jsx` / `.js`
- **No Docker**: Supabase Cloud only (no local Supabase)
- **Mobile-first**: CSS targets mobile first (media queries at 768px)
- **CSS**: Global styles in `frontend/src/index.css` (no CSS-in-JS or Tailwind)
- **Routes**: React Router v6 in `App.jsx`
- **Auth**: Supabase Auth stored in `AuthContext` / `useAuth` hook
- **Query separation**: Dashboard uses manual Promise.all joins (Supabase FK joins are unreliable in this project)

## Directory Structure

```
elosocial/
├── .opencode/
│   ├── context.md          ← Full project context (48 files)
│   └── skills/elosocial/SKILL.md  ← This file
├── README.md
├── BACKLOG.md
├── setup.sh
├── supabase/migrations/00001_schema.sql
├── backend/
│   ├── app/
│   │   ├── main.py          ← FastAPI app + CORS + routes
│   │   ├── config.py        ← Env vars (SUPABASE_URL, SERVICE_KEY)
│   │   ├── api/
│   │   │   ├── reports.py   ← POST /api/pdf, POST /api/hash
│   │   │   └── users_admin.py ← POST/DELETE /api/users
│   │   └── services/
│   │       └── pdf_generator.py ← ReportLab PDF template
│   ├── api/index.py        ← Vercel serverless entry point
│   └── vercel.json         ← Vercel deploy config
└── frontend/
    ├── src/
    │   ├── App.jsx          ← Routes
    │   ├── main.jsx         ← Entry point
    │   ├── index.css        ← All styles (mobile-first)
    │   ├── lib/supabase.js  ← Supabase client
    │   ├── contexts/AuthContext.jsx
    │   ├── hooks/useAuth.js, useRealtime.js
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx
    │   │   └── Layout/{Layout,Sidebar,Topbar}.jsx
    │   ├── pages/
    │   │   ├── Login.jsx, Dashboard.jsx
    │   │   ├── Requerentes.jsx, RequerenteDetail.jsx
    │   │   ├── Prontuarios.jsx, ProntuarioEdit.jsx, ProntuarioView.jsx
    │   │   ├── Chat.jsx, Admin.jsx
    │   └── utils/roles.js, format.js, prontuarioSchema.js
    ├── public/{manifest.json, sw.js, favicon.svg}
    ├── vercel.json, vite.config.js
    └── .env.example
```

## Database (Supabase — 6 tables)

### Tables
1. **profiles** — extends auth.users. Fields: id (FK), nome, email, role (enum), ativo
2. **applicants** — requerentes. Fields: nis (unique), nome, cpf (unique), endereco (JSONB), composicao_familiar (JSONB), created_by (FK)
3. **prontuarios** — relatórios. Fields: applicant_id (FK), created_by (FK), dados_json (JSONB), hash_assinatura, versao
4. **atendimentos** — histórico. Fields: prontuario_id (FK), profissional_id (FK), tipo_atendimento, descricao
5. **messages** — chat. Fields: remetente_id (FK), destinatario_id (FK), grupo, conteudo, lida
6. **audit_logs** — auditoria. Fields: user_id (FK), acao, detalhes (JSONB), ip

### RLS
- profiles: SELECT autenticados, UPDATE próprio
- applicants: ALL autenticados (compartilhado)
- prontuarios: SELECT/INSERT autenticados, UPDATE (criador ou gerente)
- atendimentos: SELECT/INSERT autenticados
- messages: SELECT (próprias/grupo), INSERT autenticados
- audit_logs: SELECT só gerente

### Triggers
- `handle_new_user()` — auto-cria profile on signup
- `validate_institutional_email()` — blocks non-institutional emails

## Roles
- assistente_social, psicologo, pedagogo, tecnico — CRUD prontuários + requerentes + chat
- gerente — all of the above + admin (manage users, audit)

## Prontuário SUAS — 13 sections (single JSONB field `dados_json`)
1. identificacao, 2. composicao_familiar, 3. habitacional, 4. educacional,
5. trabalho_renda, 6. saude, 7. beneficios, 8. convivencia,
9. participacao, 10. violencia, 11. encaminhamentos, 12. observacoes
(+ atendimentos stored in separate table)

## API Endpoints

| Method | Route | Function |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/pdf` | Generate PDF from prontuário JSON |
| POST | `/api/hash` | Generate SHA-256 hash |
| POST | `/api/users` | Create user (Admin API + service_role) |
| DELETE | `/api/users/:id` | Delete user permanently |

## Frontend Routes

| Route | Page | Access |
|---|---|---|
| /login | Login | Public |
| / | Dashboard | Authenticated |
| /requerentes | List requerentes | Authenticated |
| /requerentes/:id | Requerente detail | Authenticated |
| /prontuarios | List prontuários | Authenticated |
| /prontuarios/novo/:applicantId | New prontuário | Authenticated |
| /prontuarios/:id | View prontuário | Authenticated |
| /chat | Chat | Authenticated |
| /admin | User management | Gerente only |

## Running Locally

```bash
# Frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173

# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
# → http://localhost:8000
```

## Environment Variables

### Frontend (VITE_ prefix)
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_API_URL (backend URL, e.g. http://localhost:8000)

### Backend
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- ALLOWED_ORIGINS (comma-separated, e.g. http://localhost:5173,https://elosocial.vercel.app)

## Deploy

Two separate Vercel projects from the same repo:
1. **Frontend**: root=`frontend`, framework=Vite
2. **Backend**: root=`backend`, Python auto-detect (uses `api/index.py`)

## Important Gotchas

1. service_role_key goes ONLY in backend .env, NEVER in frontend
2. anon_key goes in frontend .env — RLS protects data
3. The trigger `handle_new_user()` creates profile on auth signup
4. For creating users without email confirmation, use Admin API (service_role key)
5. Vite uses `import.meta.env.VITE_*` for env vars
6. The Dashboard uses manual Promise.all for joins because Supabase FK joins can be unreliable

## Backlog Status

### Week 1 — COMPLETE
- Supabase: migrations, RLS, triggers, seed
- Backend: FastAPI setup, PDF generator, user admin API
- Frontend: project setup, auth, layout, PWA

### Week 2 — COMPLETE
- Frontend: Dashboard, Requerentes CRUD, Prontuário form (13 sections), Prontuário viewer
- Frontend: Chat (Realtime), Admin (user management)

### Pending
- [ ] Test full flow: cadastro → prontuário → PDF
- [ ] Test mobile responsiveness (360px viewport)
- [ ] Validate RLS policies
- [ ] Deploy to Vercel

### Future
- Dashboard estatístico with charts
- Relatórios gerenciais
- Advanced filters (date, professional, age group, neighborhood)
- Export statistics CSV/PDF
