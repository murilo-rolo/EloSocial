# Estrutura de Arquivos

```
elosocial/
├── setup.sh / setup.bat              # Gera .env e Dockerfiles a partir dos .example
├── run.sh / run.bat                  # Chama setup + docker compose up --build
├── docker-compose.example.yml        # Template do docker-compose (ignorado pelo .gitignore)
├── .gitignore
├── .opencode/
│   └── skills/elosocial/
│       ├── SKILL.md
│       ├── ESTRUTURA.md       ← este arquivo
│       ├── MODELO_DADOS.md
│       ├── ROTAS.md
│       └── OBSERVACOES.md
├── README.md
├── DOCKER.md
├── supabase/migrations/
│   ├── 00001_schema.sql       ← Schema + RLS + triggers
│   ├── 00002_add_cras.sql     ← CRAS: coluna `cras` + RLS atualizada
│   └── 00003_video_rooms.sql  ← Videoconferência: tabelas + RLS
├── backend/                   ← FastAPI (Vercel serverless)
│   ├── Dockerfile.example     ← Template do Dockerfile do backend
│   ├── app/
│   │   ├── main.py            ← App FastAPI + CORS + rotas
│   │   ├── config.py          ← SUPABASE_URL, SERVICE_KEY, ALLOWED_ORIGINS
│   │   ├── api/
│   │   │   ├── reports.py     ← POST /api/pdf, POST /api/hash
│   │   │   ├── users_admin.py ← POST/DELETE /api/users
│   │   │   └── video.py       ← POST /api/rooms, POST /api/rooms/join
│   │   └── services/
│   │       └── pdf_generator.py ← ReportLab (13 seções + assinatura)
│   ├── api/index.py           ← Entry point Vercel
│   └── vercel.json
└── frontend/                  ← React + PWA (Vite)
    ├── Dockerfile.example     ← Template do Dockerfile do frontend
    ├── src/
    │   ├── main.jsx           ← Entry point
    │   ├── App.jsx            ← React Router (9 rotas)
    │   ├── index.css          ← Estilos globais mobile-first
    │   ├── lib/supabase.js    ← Cliente Supabase
    │   ├── contexts/AuthContext.jsx ← Estado de autenticação
    │   ├── hooks/
    │   │   ├── useAuth.js     ← login, logout, signup, sessão
    │   │   └── useRealtime.js ← Subscriptions PostgreSQL
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx ← Rota protegida por role
    │   │   └── Layout/        ← Layout, Sidebar, Topbar
    │   ├── pages/
    │   │   ├── Login.jsx      ← Login com email institucional
    │   │   ├── Dashboard.jsx  ← Stats + prontuários recentes
    │   │   ├── Requerentes.jsx ← CRUD + busca nome/CPF
    │   │   ├── RequerenteDetail.jsx ← Detalhes + prontuários vinculados
    │   │   ├── Prontuarios.jsx ← Lista de prontuários
    │   │   ├── ProntuarioEdit.jsx ← Formulário 13 seções colapsáveis
    │   │   ├── ProntuarioView.jsx ← Visualização + exportação PDF/JSON
    │   │   ├── Chat.jsx       ← Chat em tempo real (Realtime)
    │   │   ├── Videoconferencia.jsx ← Salas de vídeo (Daily.co)
    │   │   └── Admin.jsx      ← Gerenciar usuários + auditoria + CRAS
    │   └── utils/
    │       ├── roles.js       ← Perfis, CRAS_LIST (12 unidades)
    │       ├── format.js      ← formatação CPF, data, telefone
    │       └── prontuarioSchema.js ← Schema vazio + seções
    ├── public/
    │   ├── manifest.json      ← PWA manifest
    │   ├── sw.js              ← Service Worker (cache-first)
    │   └── favicon.svg
    ├── vercel.json, vite.config.js, package.json, .env.example
    └── ...
```
