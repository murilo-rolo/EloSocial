# EloSocial — Contexto do Projeto

## Stack

- **Frontend:** React + JavaScript + Vite + PWA
- **Backend:** Python + FastAPI (apenas geração de PDF)
- **Banco + Auth + Realtime:** Supabase Cloud
- **Chat:** Supabase Realtime (subscriptions PostgreSQL)
- **PDF:** ReportLab

## Arquitetura

```
Frontend (React PWA) ←→ Supabase SDK (Auth, DB, Realtime)
                    ←→ FastAPI (apenas POST /api/pdf, POST /api/users, DELETE /api/users/:id)
```

- O frontend se comunica **diretamente com o Supabase** para autenticação, CRUD e chat
- O FastAPI é usado **apenas** para gerar PDF (ReportLab) e administração de usuários (via service_role_key)
- As permissões são controladas via **RLS (Row Level Security)** no banco Supabase

## Decisões de Projeto

| Decisão | Escolha | Motivo |
|---|---|---|
| Linguagem frontend | JavaScript (não TypeScript) | Preferência do usuário |
| Banco de dados | Supabase (PostgreSQL) | Mais simples que SQLite para auth, realtime e RLS |
| Autenticação | Supabase Auth + JWT | Nativo, sem implementar manualmente |
| Chat | Supabase Realtime | Substitui WebSocket customizado |
| Domínio de email | Validação via trigger SQL | Bloqueia emails não-institucionais |
| Deploy | Vercel (frontend + backend serverless) | Frontend e backend como dois projetos separados |
| Docker | Não usar | Preferência do usuário |
| Relatórios | JSON armazenado + PDF exportado | Imutabilidade via hash SHA-256 |

## Estrutura de Arquivos (48 arquivos)

```
elosocial/
├── .opencode/context.md          ← Este arquivo
├── README.md                     ← Documentação completa
├── BACKLOG.md                    ← Plano de 2 semanas (36 tarefas)
├── setup.sh                      ← Script de setup
│
├── supabase/
│   ├── migrations/00001_schema.sql   ← Schema + RLS + triggers
│   └── seed.sql                   ← Seed (gerente inicial)
│
├── backend/                       ← FastAPI (deploy separado no Vercel)
│   ├── app/
│   │   ├── main.py                ← App FastAPI + CORS + rotas
│   │   ├── config.py              ← Variáveis de ambiente
│   │   ├── api/
│   │   │   ├── reports.py         ← POST /api/pdf, POST /api/hash
│   │   │   └── users_admin.py     ← POST /api/users, DELETE /api/users/:id
│   │   └── services/
│   │       └── pdf_generator.py   ← Geração de PDF (ReportLab)
│   ├── api/index.py               ← Entry point para Vercel
│   ├── vercel.json                ← Config deploy Vercel
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                      ← React + PWA (deploy separado no Vercel)
    ├── src/
    │   ├── main.jsx               ← Entry point
    │   ├── App.jsx                ← Rotas (React Router)
    │   ├── index.css              ← Estilos globais (mobile-first)
    │   ├── lib/supabase.js        ← Cliente Supabase
    │   ├── contexts/AuthContext.jsx ← Contexto de autenticação
    │   ├── hooks/
    │   │   ├── useAuth.js         ← Hook de autenticação
    │   │   └── useRealtime.js     ← Hook de Subscriptions
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx ← Rota protegida por role
    │   │   └── Layout/            ← Sidebar + Topbar + Layout
    │   ├── pages/
    │   │   ├── Login.jsx          ← Login com email institucional
    │   │   ├── Dashboard.jsx      ← Stats + prontuários recentes
    │   │   ├── Requerentes.jsx    ← CRUD + busca por nome/CPF
    │   │   ├── RequerenteDetail.jsx ← Detalhes + prontuários vinculados
    │   │   ├── Prontuarios.jsx    ← Lista de prontuários
    │   │   ├── ProntuarioEdit.jsx ← Formulário 13 seções (colapsáveis)
    │   │   ├── ProntuarioView.jsx ← Visualização + exportação PDF/JSON
    │   │   ├── Chat.jsx          ← Chat em tempo real (Realtime)
    │   │   └── Admin.jsx         ← Gerenciar usuários + auditoria
    │   └── utils/
    │       ├── roles.js          ← Constantes de perfis
    │       ├── format.js         ← Formatação (CPF, data, telefone)
    │       └── prontuarioSchema.js ← Schema do Prontuário SUAS
    ├── public/
    │   ├── manifest.json         ← PWA manifest
    │   ├── sw.js                 ← Service Worker
    │   └── favicon.svg           ← Ícone
    ├── vercel.json               ← Config deploy Vercel
    ├── vite.config.js            ← Vite + PWA plugin
    ├── package.json
    └── .env.example
```

## Modelo de Dados (Supabase)

### Tabelas

1. **profiles** — Estende `auth.users`. Campos: `id` (FK), `nome`, `email`, `role` (enum: assistente_social, psicologo, pedagogo, tecnico, gerente), `ativo`, `created_at`
2. **applicants** — Requerentes. Campos: `id` (UUID), `nis` (unique), `nome`, `cpf` (unique), `rg`, `data_nascimento`, `telefone`, `endereco` (JSONB), `localizacao` (urbano/rural), `composicao_familiar` (JSONB), `created_by` (FK→profiles)
3. **prontuarios** — Relatórios. Campos: `id`, `applicant_id` (FK), `created_by` (FK), `dados_json` (JSONB), `hash_assinatura`, `assinado_por` (FK), `versao`, timestamps
4. **atendimentos** — Histórico. Campos: `id`, `prontuario_id` (FK), `profissional_id` (FK), `data_atendimento`, `tipo_atendimento`, `descricao`, `observacoes`
5. **messages** — Chat. Campos: `id`, `remetente_id` (FK), `destinatario_id` (FK), `grupo`, `conteudo`, `lida`, `created_at`
6. **audit_logs** — Auditoria. Campos: `id`, `user_id` (FK), `acao`, `detalhes` (JSONB), `ip`, `created_at`

### RLS Policies

- **profiles:** SELECT autenticados, UPDATE próprio
- **applicants:** ALL autenticados (compartilhado na rede)
- **prontuarios:** SELECT autenticados, INSERT autenticados, UPDATE (criador ou gerente)
- **atendimentos:** SELECT autenticados, INSERT autenticados
- **messages:** SELECT (próprias ou de grupo), INSERT autenticados
- **audit_logs:** SELECT só gerente, INSERT autenticados

### Triggers

- `handle_new_user()` — Cria profile automaticamente após signup no Auth
- `validate_institutional_email()` — Bloqueia emails que não sejam de domínios permitidos

## Perfis de Acesso

| Perfil | Prontuário | Requerentes | Chat | Admin |
|---|---|---|---|---|
| Assistente Social | CRUD | CRUD | ✅ | ❌ |
| Psicólogo | CRUD | CRUD | ✅ | ❌ |
| Pedagogo | CRUD | CRUD | ✅ | ❌ |
| Técnico | CRUD | CRUD | ✅ | ❌ |
| Gerente | CRUD (tudo) | CRUD | ✅ | ✅ |

## Prontuário SUAS (13 seções)

1. Identificação e Endereço
2. Composição Familiar
3. Condições Habitacionais
4. Condições Educacionais
5. Trabalho e Rendimento
6. Condições de Saúde
7. Benefícios Eventuais
8. Convivência Familiar e Comunitária
9. Participação em Programas
10. Violência e Violação de Direitos
11. Encaminhamentos
12. Histórico de Atendimentos (separado na tabela `atendimentos`)
13. Observações Técnicas

## Rotas da Aplicação

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

## Backend Endpoints (FastAPI)

| Método | Rota | Função |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/pdf` | Gera PDF do prontuário |
| POST | `/api/hash` | Gera hash SHA-256 do JSON |
| POST | `/api/users` | Cria usuário (Admin API) |
| DELETE | `/api/users/:id` | Exclui usuário (Admin API) |

## Como Executar

### Local
```bash
# Frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173

# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
# → http://localhost:8000
```

### Deploy (Vercel)
- **Frontend:** Root = `frontend`, build = `npm run build`, output = `dist`
- **Backend:** Root = `backend`, Python auto-detect
- Env vars: ver README.md

## O que foi implementado (sessão atual)

- README.md e BACKLOG.md
- Schema completo do Supabase (6 tabelas, RLS, triggers)
- Backend FastAPI (PDF com ReportLab, admin de usuários)
- Frontend completo:
  - Autenticação (login, logout, sessão)
  - Layout responsivo mobile-first
  - Dashboard com estatísticas
  - CRUD de requerentes com busca por nome/CPF
  - Formulário do Prontuário SUAS (13 seções colapsáveis)
  - Visualização e exportação do prontuário (PDF + JSON)
  - Chat em tempo real com Supabase Realtime
  - Admin (gerenciar usuários: criar, ativar/desativar, alterar role, excluir)

## Próximos passos (BACKLOG.md pendentes)

### Tarefas restantes da Semana 2:
- [ ] Testar fluxo completo: cadastro → prontuário → PDF
- [ ] Ajustar responsividade mobile (viewport 360px)
- [ ] Validar RLS policies
- [ ] Deploy: Vercel (frontend + backend)

### Futuro:
- Dashboard estatístico com gráficos
- Relatórios gerenciais
- Filtros avançados
- Exportar estatísticas CSV/PDF

## Observações Técnicas

1. O service_role_key do Supabase fica apenas no backend (.env), nunca no frontend
2. A anon_key do Supabase fica no frontend (.env) — RLS protege os dados
3. O trigger `handle_new_user()` cria profile automaticamente ao criar usuário via Auth
4. Para criar usuários sem confirmação de email, usa-se a Admin API com service_role_key
5. O frontend usa `import.meta.env.VITE_*` para variáveis de ambiente (Vite)
6. O backend usa variáveis de ambiente com `os.getenv()` + `.env`
7. O chat usa Supabase Realtime (subscriptions PostgreSQL), não WebSocket customizado
