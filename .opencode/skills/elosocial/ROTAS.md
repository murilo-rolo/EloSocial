# Rotas do Frontend

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
| `/videoconferencia` | Videoconferência | Autenticado |
| `/admin` | Admin | Gerente |

# Endpoints Backend (FastAPI)

| Método | Rota | Função |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/pdf` | Gera PDF do prontuário |
| POST | `/api/hash` | Gera hash SHA-256 do JSON |
| POST | `/api/users` | Cria usuário (Admin API + service_role — inclui `cras`) |
| DELETE | `/api/users/:id` | Exclui usuário (Admin API) |
| POST | `/api/rooms` | Cria sala no Daily.co (pública ou privada) |
| POST | `/api/rooms/join` | Valida código e retorna URL da sala privada |
