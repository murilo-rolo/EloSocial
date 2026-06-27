# EloSocial + IA Copiloto SUAS

Sistema de Prontuário Eletrônico SUAS para CRAS, agora equipado com Inteligência Artificial avançada (Inspirado no projeto Arcane).

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

## ⚙️ Como Rodar Localmente (Setup Rápido via Docker)

A maneira mais fácil de rodar o projeto inteiro (Frontend + Backend Python) na sua máquina é utilizando o Docker.

### 1. Preparação
Você precisará de:
1. Docker Desktop instalado.
2. Conta no [Supabase](https://supabase.com).
3. Chave de API do [Google Gemini (Google AI Studio)](https://aistudio.google.com/app/apikey).

### 2. Configure o Banco de Dados (Supabase)
No painel do seu projeto no Supabase, abra o "SQL Editor" e rode as _migrations_ na ordem exata para criar o banco e habilitar a IA vetorial:
1. `supabase/migrations/00001_schema.sql`
2. `supabase/migrations/00002_add_cras.sql`
3. `supabase/migrations/00003_video_rooms.sql`
4. `supabase/migrations/00004_prontuario_anexos.sql`
5. `supabase/migrations/00005_agendamentos.sql`
6. `supabase/migrations/00006_triagem_vulnerabilidade.sql`
7. `supabase/migrations/00007_rag_pgvector.sql` (Crucial para o Cérebro Vetorial da IA)

### 3. Variáveis de Ambiente
Crie ou edite os arquivos `.env` baseando-se nos `.env.example`:

**No `frontend/.env`:**
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
VITE_API_URL=http://localhost:8000
```

**No `backend/.env`:**
```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_KEY=sua_service_role_key_do_supabase
GEMINI_API_KEY=sua_chave_do_google_ai_studio
ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Rodando o Projeto
Abra o terminal na raiz do projeto e execute:
- **Windows:** Dê um duplo clique no arquivo `run.bat` ou rode `.\run.bat` no terminal.
- **Linux/Mac:** Rode `./run.sh` no terminal.

O Docker vai baixar todas as dependências, iniciar o servidor Python na porta `8000` e o painel React na porta `5173`.
- **Acesse:** `http://localhost:5173`

---

## 🛠️ Como Rodar Manualmente (Sem Docker)

Se preferir rodar sem o Docker:

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
Abra outro terminal:
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
├── supabase/migrations/   # Scripts SQL para criar o banco e as funções da IA
├── backend/               # Motor Python
│   ├── app/api/ai.py      # Endpoints do Copiloto, Resumo e Triagem (Gemini)
│   ├── app/api/rag.py     # Endpoints de vetorização e busca na lei (RAG)
│   └── app/main.py        # Inicialização do FastAPI
└── frontend/              # Interface React Premium
    └── src/
        ├── pages/         # Dashboard, Requerentes, RequerenteDetail, BaseConhecimento
        ├── components/    # ChatLLM (Chat da IA), Sidebar, SlideOver
        ├── lib/           # Conexão com Supabase
        └── utils/         # Utilitários de formatação
```

## Licença

Projeto desenvolvido para a rede socioassistencial (Inspirado no case Arcane). Uso interno e governamental.
