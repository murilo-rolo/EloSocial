# Executando o EloSocial com Docker 🐳

Este guia orienta qualquer pessoa a rodar o projeto **EloSocial** localmente usando Docker, sem a necessidade de instalar Node.js ou Python diretamente na máquina host.

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:
- **Docker**: [Instalar Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: Geralmente já vem integrado ao Docker Desktop.

---

## ⚡ Como Rodar o Projeto

### Passo 1: Preparar as Variáveis de Ambiente (`.env`)

O projeto necessita de chaves do **Supabase** e **Daily.co** para funcionar corretamente. 

Para facilitar, criamos scripts automatizados que criam os arquivos `.env` caso eles não existam:

*   **No Linux / macOS:**
    Abra o terminal na pasta do projeto e execute:
    ```bash
    ./run.sh
    ```
*   **No Windows:**
    Basta dar dois cliques no arquivo `run.bat` ou executar no prompt de comando:
    ```cmd
    run.bat
    ```

*Os scripts criarão automaticamente os arquivos `backend/.env` e `frontend/.env` copiando a partir dos exemplos.*

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

Se você utilizou os scripts do **Passo 1**, o Docker já começará a baixar as imagens e rodar a aplicação automaticamente. 

Se preferir iniciar manualmente no terminal, basta executar o comando padrão do Docker Compose:

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

- **`frontend/Dockerfile`**: Configura um container Node.js rodando o servidor de desenvolvimento do Vite com suporte a Fast Refresh (Hot Module Replacement).
- **`backend/Dockerfile`**: Configura um container Python com FastAPI rodando sob Uvicorn com live-reload ativo.
- **`docker-compose.yml`**: Orquestra os dois serviços para rodarem juntos. Ele mapeia os volumes locais para os containers para permitir que qualquer alteração feita no código local reflita instantaneamente no navegador/API.

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
