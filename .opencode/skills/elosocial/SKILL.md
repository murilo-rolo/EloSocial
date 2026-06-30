---
name: elosocial
description: Prontuário SUAS para CRAS. Stack, arquitetura, convenções, DB, rotas e endpoints.
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
| Videoconferência | Daily.co API + daily-js SDK |

## Arquitetura

```
Frontend (React PWA) ←→ Supabase SDK (Auth, DB, Realtime)
                    ←→ FastAPI (POST /api/pdf, /api/hash, /api/users)
```

- Frontend comunica **diretamente com Supabase** para auth, CRUD e chat
- FastAPI usado **apenas** para PDF (ReportLab) e admin de usuários (service_role_key)
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

## Convenções

- **Linguagem:** JavaScript (`.jsx` / `.js`), sem TypeScript
- **CSS:** `index.css` — mobile-first, media queries 768px, CSS custom properties, sem Tailwind/CSS-in-JS
- **Rotas:** React Router v6 em `App.jsx`
- **Auth:** Supabase Auth via `AuthContext` + hook `useAuth`
- **Joins no Dashboard:** `Promise.all` manual (Supabase FK joins instáveis)
- **Escopo CRAS:** Cada usuário vinculado a uma das 12 unidades; gerentes gerenciam só o próprio CRAS

## Perfis de Acesso

| Perfil | Prontuário | Requerentes | Chat | Admin |
|---|---|---|---|---|
| Assistente Social | CRUD | CRUD | ✅ | ❌ |
| Psicólogo | CRUD | CRUD | ✅ | ❌ |
| Pedagogo | CRUD | CRUD | ✅ | ❌ |
| Técnico | CRUD | CRUD | ✅ | ❌ |
| Gerente | CRUD (tudo) | CRUD | ✅ | ✅ |

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
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload  # → http://localhost:8000
```

## Variáveis de Ambiente

Os arquivos `.env` são gerados a partir dos `.env.example` via `setup.sh` / `setup.bat` e ignorados pelo `.gitignore`.

**Frontend (prefixo `VITE_`):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
**Backend:** `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ALLOWED_ORIGINS`

---

## Arquivos de Referência

Leia estes arquivos **quando necessário** (detalhes não estão no contexto inicial para agilizar a resposta):

- `ESTRUTURA.md` — Árvore completa de diretórios
- `MODELO_DADOS.md` — Schema das 8 tabelas, RLS e triggers
- `ROTAS.md` — Rotas do frontend + endpoints do backend
- `OBSERVACOES.md` — 13 observações técnicas importantes
- `BACKLOG.md` — Backlog concluído, em andamento e futuro
