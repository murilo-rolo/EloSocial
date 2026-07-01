# EloSocial + IA Copiloto SUAS

Sistema de Prontuário Eletrônico SUAS para CRAS, agora equipado com Inteligência Artificial avançada.

## 🚀 Novas Funcionalidades de IA (Copiloto SUAS)

O sistema foi atualizado com agentes de Inteligência Artificial para acelerar o trabalho dos assistentes sociais e técnicos:

- **Triagem Inteligente:** Ao criar ou visualizar o dossiê de uma família, a IA analisa a renda, composição familiar e histórico, emitindo um Alerta de Vulnerabilidade (Score e Cor: Verde, Amarelo, Vermelho) e um parecer técnico instantâneo.
- **Resumo Executivo Automático:** A IA lê todos os prontuários e históricos longos de uma família em segundos, gerando um resumo executivo pontual para que novos técnicos entendam o caso sem precisar ler dezenas de páginas.
- **Assistente Contextual (Chat):** Um chat flutuante embutido dentro do Prontuário. O Copiloto sabe tudo sobre a família que você está visualizando e pode te ajudar a redigir laudos, sugerir políticas públicas e responder dúvidas sobre o caso.
- **Cérebro Vetorial (RAG):** O sistema possui uma "Base de Conhecimento" onde gerentes podem colar textos de Manuais do SUAS, LOAS e diretrizes. A IA transforma esses textos em vetores matemáticos e, quando o técnico faz uma pergunta no chat, a IA vasculha a lei para dar uma resposta 100% embasada, zerando alucinações.

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

## 🔄 Como Atualizar o Sistema Localmente (Pull e Rebuild)

Sempre que houver código novo no repositório do GitHub (por exemplo, após a Inteligência Artificial ou outro desenvolvedor subir alterações) e você precisar atualizar a sua máquina local para rodar a última versão, siga estes passos:

Abra o **PowerShell** ou Terminal dentro da pasta principal do projeto (`EloSocial-main`) e execute:

```bash
# 1. Baixa as atualizações do GitHub (Arquivos modificados)
git pull origin main

# 2. Sincroniza pacotes do Frontend (Baixa bibliotecas que não sobem pro Git)
cd frontend
npm install
cd ..

# 3. Recria o "Cérebro" do Docker com o código novo
docker compose up --build -d
```

*(Nota: Se houver problemas com o visual antigo preso na memória, você pode apagar o cache do Vite executando `Remove-Item -Recurse -Force frontend\.vite` no PowerShell antes do Passo 3).*

---

## Licença

Projeto desenvolvido para a rede socioassistencial (Inspirado no case Arcane). Uso interno e governamental.
