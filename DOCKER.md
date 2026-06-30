# Executando o EloSocial com Docker 🐳

Este guia orienta qualquer pessoa a rodar o projeto **EloSocial** localmente usando Docker, sem a necessidade de instalar Node.js ou Python diretamente na máquina host.

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:
- **Docker**: [Instalar Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: Geralmente já vem integrado ao Docker Desktop.

---

## ⚡ Como Rodar o Projeto

### Passo 1: Gerar os Arquivos de Configuração

Arquivos com credenciais (`.env`) e arquivos Docker (`docker-compose.yml`, `Dockerfile`) **não são versionados** no repositório — eles são gerados a partir de templates `.example` pelo script de setup:

*   **No Linux / macOS:**
    ```bash
    ./setup.sh
    ```
*   **No Windows:**
    ```cmd
    setup.bat
    ```

O script cria (se não existirem):
- `frontend/.env` ← `frontend/.env.example`
- `backend/.env` ← `backend/.env.example`
- `docker-compose.yml` ← `docker-compose.example.yml`
- `backend/Dockerfile` ← `backend/Dockerfile.example`
- `frontend/Dockerfile` ← `frontend/Dockerfile.example`

### Passo 2: Configurar as Credenciais

Abra os arquivos `.env` gerados e insira suas credenciais de desenvolvimento:

1.  No arquivo **`frontend/.env`**:
    ```env
    VITE_SUPABASE_URL=https://seu-projeto.supabase.co
    VITE_SUPABASE_ANON_KEY=sua-anon-key
    VITE_API_URL=http://localhost:8000
    ```
2.  No arquivo **`backend/.env`**:
    ```env
    SUPABASE_URL=https://seu-projeto.supabase.co
    SUPABASE_SERVICE_KEY=sua-service-role-key
    ALLOWED_ORIGINS=http://localhost:5173
    DAILY_API_KEY=sua-daily-api-key # Opcional (para videoconferência)
    ```

### Passo 3: Iniciar a Aplicação

O atalho mais rápido é usar o `run.sh` / `run.bat`, que executa o setup automaticamente e já sobe os containers:

```bash
# Linux / macOS
./run.sh

# Windows
run.bat
```

Ou, manualmente, após rodar o setup:

```bash
docker compose up --build
```

---

## 🌐 Acessando a Aplicação

Depois que os containers estiverem em execução:

*   **Frontend (React/Vite):** [http://localhost:5173](http://localhost:5173)
*   **Backend (FastAPI):** [http://localhost:8000](http://localhost:8000)
    *   *Documentação interativa da API (Swagger UI):* [http://localhost:8000/docs](http://localhost:8000/docs)
    *   *Endpoint de Healthcheck:* [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 🛠️ Como Funciona a Estrutura Docker

O repositório versiona **templates** (`.example`) em vez dos arquivos diretos, para evitar vazar credenciais ou versões locais:

- **`docker-compose.example.yml`** → Template da orquestração dos dois serviços.
- **`backend/Dockerfile.example`** → Template do container Python com FastAPI + Uvicorn com live-reload.
- **`frontend/Dockerfile.example`** → Template do container Node.js com Vite dev server + Fast Refresh.

Ao rodar `setup.sh` / `setup.bat`, esses templates são copiados para os nomes reais (sem `.example`), que são ignorados pelo `.gitignore` e ficam apenas no ambiente local.

---

## ❌ Solução de Problemas Comuns

### 1. Erro de porta já em uso (`Port already in use`)
Se você já tiver outra aplicação rodando nas portas `5173` ou `8000`, o Docker Compose falhará.
- **Solução:** Pare os outros serviços na sua máquina local ou altere o mapeamento de portas no arquivo `docker-compose.yml` (seção `ports:`, ex: `"5174:5173"`).

### 2. Alterações no arquivo `.env` não estão refletindo
- **Solução:** Pare os containers (`Ctrl + C`) e suba novamente com o comando `docker compose up --build` para forçar a atualização das variáveis no container.

### 3. Permissão negada no `run.sh` (Linux/macOS)
Se o sistema acusar falta de permissão para rodar o `./run.sh`:
- **Solução:** Conceda permissão de execução rodando `chmod +x run.sh` no terminal e tente novamente.
