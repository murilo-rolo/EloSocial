# EloSocial + IA Copiloto SUAS

Sistema de Prontuário Eletrônico SUAS para CRAS, agora equipado com Inteligência Artificial avançada.

## 🚀 Novas Funcionalidades de IA (Copiloto SUAS - Nível Enterprise)

Inspirado no projeto Arcane, o sistema foi atualizado com agentes de Inteligência Artificial de nível Enterprise para automatizar e acelerar o fluxo de trabalho dos técnicos:

- **ChatIA (Aba Dedicada e Contextual):** Nova aba exclusiva para interação com a IA. Com design *split-view* (lista de requerentes à esquerda e chat à direita), o técnico pode alternar rapidamente entre pacientes. O Copiloto sabe tudo sobre o requerente selecionado e ajuda a redigir laudos, formatar textos técnicos e responder dúvidas sobre o histórico do cidadão. O clássico chat flutuante também foi mantido para acesso rápido dentro do prontuário.
- **Base de Conhecimento (RAG Enterprise com pgvector):** O sistema possui um "Cérebro Vetorial" alimentado pelos próprios gestores. Permite o upload de arquivos PDF (manuais do SUAS, LOAS, portarias), que são processados, segmentados e transformados em vetores matemáticos (`text-embedding-004`). Quando o técnico faz uma pergunta à IA, o sistema realiza uma "Busca Híbrida" nos PDFs cadastrados para garantir respostas 100% embasadas na documentação oficial, zerando alucinações.
- **Triagem Inteligente de Vulnerabilidade:** Ao acessar o dossiê de uma família, a IA cruza a renda, a composição familiar e o histórico pregressos, gerando um Alerta de Vulnerabilidade automático (Score e Cor: Verde, Amarelo ou Vermelho) junto com um parecer técnico instantâneo, antes mesmo do técnico ler o processo.
- **Resumo Executivo Automático:** A IA varre dezenas de páginas de prontuários antigos, evoluções e anotações em segundos, consolidando tudo num resumo executivo dinâmico. Ideal para a passagem de plantão ou para que um novo assistente social entenda o caso instantaneamente.

---

## 🛠️ Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Frontend | React + JavaScript + Vite + PWA |
| Backend | Python + FastAPI |
| Inteligência Artificial | Google Gemini API (gemini-2.5-flash e text-embedding-004) |
| Banco de Dados (IA) | Supabase (PostgreSQL) com extensão `pgvector` |
| Banco + Auth | Supabase (Auth + Realtime + RLS) |
| Videoconferência | Daily.co API + daily-js SDK |

---

## 📋 Funcionalidades Clássicas do Sistema

- **Gestão de Requerentes:** Cadastro completo com filtros inteligentes (Urbano/Rural).
- **Prontuário SUAS Versionado:** Registro padronizado, seguro e com histórico imutável (Timeline).
- **Dashboard Analítico:** Visão geral do município com gráficos e métricas.
- **Agenda de Atendimentos:** Controle de sessões, reuniões e visitas domiciliares com alertas de atraso.
- **Mensagens da Equipe:** Chat interno em tempo real para comunicação rápida entre técnicos.
- **Videoconferência:** Salas privadas e seguras para atendimento remoto.
- **Controles de Acesso (RBAC):** Permissões granulares para Assistentes Sociais, Psicólogos, Pedagogos, Técnicos e Gerentes. Escopo restrito por unidade CRAS.

---

## ⚙️ Setup Inicial (Gerar Arquivos de Configuração)

O repositório não versiona arquivos com credenciais (`.env`) nem arquivos Docker (`docker-compose.yml`, `Dockerfile`) — eles são gerados a partir de templates `.example`.

Rode o script de setup para criar todos os arquivos de uma vez:

- **Linux/Mac:** `./setup.sh`
- **Windows:** `setup.bat`

Isso vai gerar (se não existirem):
- `frontend/.env` ← de `frontend/.env.example`
- `backend/.env` ← de `backend/.env.example`
- `docker-compose.yml` ← de `docker-compose.example.yml`
- `backend/Dockerfile` ← de `backend/Dockerfile.example`
- `frontend/Dockerfile` ← de `frontend/Dockerfile.example`

Depois, edite os `.env` com suas credenciais reais do Supabase e Google Gemini.

---

## 🐳 Como Rodar com Docker

### 1. Pré-requisitos
- [Docker Desktop](https://docs.docker.com/products/docker-desktop/) instalado
- Conta no [Supabase](https://supabase.com)
- Chave de API do [Google Gemini (Google AI Studio)](https://aistudio.google.com/app/apikey)

### 2. Configure o Banco de Dados (Supabase)
No painel do seu projeto no Supabase, abra o "SQL Editor" e rode as _migrations_ na ordem:
1. `supabase/migrations/00001_schema.sql`
2. `supabase/migrations/00002_add_cras.sql`
3. `supabase/migrations/00003_video_rooms.sql`
4. `supabase/migrations/00004_prontuario_anexos.sql`
5. `supabase/migrations/00005_agendamentos.sql`
6. `supabase/migrations/00006_triagem_vulnerabilidade.sql`
7. `supabase/migrations/00007_rag_pgvector.sql`

### 3. Variáveis de Ambiente
Edite os arquivos criados pelo `setup.sh`:

**`frontend/.env`:**
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
VITE_API_URL=http://localhost:8000
```

**`backend/.env`:**
```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_KEY=sua_service_role_key_do_supabase
GEMINI_API_KEY=sua_chave_do_google_ai_studio
ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Rodar
- **Windows:** `run.bat` ou duplo clique
- **Linux/Mac:** `./run.sh`

O script `run.sh`/`run.bat` executa `setup.sh`/`setup.bat` automaticamente e depois sobe os containers com `docker compose up --build`.

- **Acesse:** `http://localhost:5173`

---

## 🛠️ Como Rodar Manualmente (Sem Docker)

### 1. Backend (Python)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # No Windows
# source venv/bin/activate # No Linux/Mac
pip install -r requirements.txt
# Certifique-se de ter configurado o backend/.env
uvicorn app.main:app --reload
```

### 2. Frontend (Node.js)
```bash
cd frontend
npm install
# Certifique-se de ter configurado o frontend/.env
npm run dev
```

---

## 🏗️ Estrutura do Projeto

```
EloSocial-main/
├── setup.sh / setup.bat        # Gera .env e Dockerfiles a partir dos .example
├── run.sh / run.bat            # Chama setup + docker compose up --build
├── docker-compose.example.yml  # Template do docker-compose
├── supabase/migrations/        # Scripts SQL para criar o banco e as funções da IA
├── backend/                    # Motor Python
│   ├── Dockerfile.example      # Template do Dockerfile do backend
│   ├── app/api/ai.py           # Endpoints do Copiloto, Resumo e Triagem (Gemini)
│   ├── app/api/rag.py          # Endpoints de vetorização e busca na lei (RAG)
│   └── app/main.py             # Inicialização do FastAPI
└── frontend/                   # Interface React Premium
    ├── Dockerfile.example      # Template do Dockerfile do frontend
    └── src/
        ├── pages/              # Dashboard, Requerentes, RequerenteDetail, BaseConhecimento
        ├── components/         # ChatLLM (Chat da IA), Sidebar, SlideOver
        ├── lib/                # Conexão com Supabase
        └── utils/              # Utilitários de formatação
```

## Licença

Projeto desenvolvido para a rede socioassistencial (Inspirado no case Arcane). Uso interno e governamental.
