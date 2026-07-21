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
│       ├── OBSERVACOES.md
│       └── BACKLOG.md
├── README.md
├── DOCKER.md
├── docs/
│   └── migracao-telemedicina/  # Documentação da migração para telemedicina
│       ├── 00-VISAO-GERAL.md
│       ├── 01-ROLE-REQUERENTE.md
│       ├── 02-TRIAGEM-SOCIAL.md
│       ├── 03-DASHBOARD-REQUERENTE.md
│       ├── 04-CHAT-CASO.md
│       ├── 05-VIDEOCHAMADA.md
│       ├── 06-PLAO-AOCAO.md
│       ├── 07-COFRE-DIGITAL.md
│       ├── 08-MIGRACAO-DATABASE.md
│       ├── 09-ROTA-IMPLEMENTACAO.md
│       └── 10-GUIA-TESTES.md
├── supabase/migrations/
│   ├── 00001_schema.sql         ← Schema + RLS + triggers
│   ├── 00002_add_cras.sql       ← CRAS: coluna `cras` + RLS atualizada
│   ├── 00003_video_rooms.sql    ← Videoconferência: tabelas + RLS
│   ├── 00004_prontuario_anexos.sql ← Anexos de prontuário
│   ├── 00005_agendamentos.sql   ← Agenda de atendimentos
│   ├── 00006_triagem_vulnerabilidade.sql ← Triagem de vulnerabilidade
│   ├── 00007_rag_pgvector.sql   ← Extensão pgvector + tabelas RAG
│   ├── 00008_rag_hybrid_search.sql ← Busca híbrida RAG
│   ├── 00009_realtime_messages.sql ← Mensagens realtime
│   └── 00010_remove_localizacao.sql ← Remoção campo localizacao
├── supabase/seed.sql
├── backend/                       ← FastAPI (Vercel serverless)
│   ├── Dockerfile.example         ← Template do Dockerfile do backend
│   ├── requirements.txt
│   ├── generate_pdf.py            ← Script auxiliar PDF
│   ├── test_gemini.py             ← Teste da API Gemini
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                ← App FastAPI + CORS + rotas
│   │   ├── config.py              ← SUPABASE_URL, SERVICE_KEY, ALLOWED_ORIGINS
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── reports.py         ← POST /api/pdf, POST /api/hash
│   │   │   ├── users_admin.py     ← POST/DELETE /api/users
│   │   │   ├── video.py           ← POST /api/rooms, POST /api/rooms/join
│   │   │   ├── ai.py              ← POST /api/chat-ai, /api/triagem, /api/resumo
│   │   │   ├── report_generator.py ← POST /api/generate-parecer
│   │   │   ├── rag.py             ← POST /api/rag/upload, /rag/query, /rag/documents
│   │   │   ├── ocr.py             ← POST /api/ocr/extract_requerente
│   │   │   └── suas_context.py    ← Contexto base SUAS/LOAS para prompts IA
│   │   └── services/
│   │       └── pdf_generator.py   ← ReportLab (13 seções + assinatura)
│   ├── api/
│   │   └── index.py               ← Entry point Vercel
│   └── vercel.json
└── frontend/                      ← React + PWA (Vite + Tailwind v4)
    ├── Dockerfile.example         ← Template do Dockerfile do frontend
    ├── vite.config.js             ← Vite + React + Tailwind + PWA
    ├── package.json               ← dependencies: tailwindcss, recharts, lucide-react, react-markdown
    ├── src/
    │   ├── main.jsx               ← Entry point
    │   ├── App.jsx                ← React Router (14 rotas)
    │   ├── index.css              ← @import "tailwindcss" + CSS custom properties (tema escuro/claro)
    │   ├── lib/
    │   │   └── supabase.js        ← Cliente Supabase
    │   ├── contexts/
    │   │   └── AuthContext.jsx    ← Estado de autenticação
    │   ├── hooks/
    │   │   ├── useAuth.js         ← login, logout, signup, sessão
    │   │   └── useRealtime.js     ← Subscriptions PostgreSQL
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx ← Rota protegida por role
    │   │   ├── ThemeToggle.jsx    ← Toggle tema escuro/claro
│   │   ├── ChatLLM.jsx        ← Chat flutuante da IA
│   │   ├── SlideOver.jsx      ← Painel lateral
    │   │   ├── Layout/            ← Layout, Sidebar, Topbar
    │   │   ├── Chat/              ← (vazio, componentes em página)
    │   │   ├── Prontuario/        ← (vazio, componentes em página)
    │   │   └── ReportViewer/      ← (vazio, componentes em página)
    │   ├── pages/
    │   │   ├── Login.jsx          ← Login com email institucional
    │   │   ├── Cadastro.jsx       ← Cadastro de novos usuários (pública)
    │   │   ├── Dashboard.jsx      ← Stats + prontuários recentes + gráficos
    │   │   ├── Agenda.jsx         ← Agenda de atendimentos (sessões, visitas)
    │   │   ├── Requerentes.jsx    ← CRUD + busca nome/CPF
    │   │   ├── RequerenteDetail.jsx ← Detalhes + prontuários vinculados + triagem IA
    │   │   ├── ProntuarioEdit.jsx ← Formulário 13 seções colapsáveis
    │   │   ├── ProntuarioView.jsx ← Visualização + exportação PDF/JSON + resumo IA
    │   │   ├── Chat.jsx           ← Chat em tempo real (Realtime)
    │   │   ├── ChatIA.jsx         ← Chat contextual com IA (split-view)
    │   │   ├── Videoconferencia.jsx ← Salas de vídeo (Daily.co)
    │   │   ├── BaseConhecimento.jsx ← Upload/gestão de PDFs RAG
    │   │   ├── Perfil.jsx         ← Perfil do usuário logado
    │   │   └── Admin.jsx          ← Gerenciar usuários + auditoria + CRAS
    │   └── utils/
    │       ├── roles.js           ← Perfis, CRAS_LIST (12 unidades)
    │       ├── format.js          ← formatação CPF, data, telefone
    │       └── prontuarioSchema.js ← Schema vazio + seções
    ├── public/
    │   ├── manifest.json          ← PWA manifest
    │   ├── sw.js                  ← Service Worker (cache-first)
    │   └── favicon.svg
    ├── vercel.json, vite.config.js, package.json, .env.example
    └── ...
```
