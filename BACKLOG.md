# Backlog — EloSocial

## Legenda

- [P] Prioridade: Alta | Média | Baixa
- [T] Tipo: Config | Backend | Frontend | Docs | Testes

---

## ✅ Concluído

### Projeto Supabase

| # | Tarefa | P | T |
|---|---|---|---|
| 1 | Criar projeto no supabase.com | Alta | Config |
| 2 | Migrations: `profiles`, `applicants`, `prontuarios`, `atendimentos`, `messages` | Alta | Config |
| 3 | RLS policies (SELECT livre, INSERT/UPDATE por role) | Alta | Config |
| 4 | Migration 00002: coluna `cras` na tabela `profiles` (12 unidades), RLS atualizada | Alta | Config |
| 5 | Migration 00003: `video_rooms` e `video_participants` + RLS | Alta | Config |
| 6 | Trigger validação de domínio de email institucional (`*.gov.br`, `*.gov.com.br`) | Média | Config |
| 7 | Seed: gerente inicial | Alta | Config |
| 8 | Configurar Authentication (email/senha, SITE_URL) | Alta | Config |

### Backend FastAPI

| # | Tarefa | P | T |
|---|---|---|---|
| 9 | Setup FastAPI + estrutura | Alta | Backend |
| 10 | Endpoint `POST /api/pdf` | Alta | Backend |
| 11 | Template PDF com ReportLab (13 seções + assinatura digital) | Alta | Backend |
| 12 | Endpoint `POST /api/hash` | Média | Backend |
| 13 | Endpoints `POST /api/users` e `DELETE /api/users/:id` (Admin API) | Alta | Backend |
| 14 | Campo `cras` no `CreateUserRequest` | Alta | Backend |
| 15 | Variáveis de ambiente (.env) | Média | Config |
| 16 | Endpoints `POST /api/rooms` e `POST /api/rooms/join` (Daily.co) | Alta | Backend |

### Frontend — Base

| # | Tarefa | P | T |
|---|---|---|---|
| 17 | Projeto React + Vite + JavaScript (JSX) | Alta | Frontend |
| 18 | `lib/supabase.js` | Alta | Frontend |
| 19 | Páginas: Login, Dashboard (esqueleto), ProtectedRoute | Alta | Frontend |
| 20 | Hook `useAuth` — login, logout, sessão, role | Alta | Frontend |
| 21 | PWA: manifest.json + service worker + ícones | Média | Frontend |
| 22 | Layout responsivo: Sidebar + Topbar (mobile-first) | Alta | Frontend |

### Frontend — Requerentes

| # | Tarefa | P | T |
|---|---|---|---|
| 23 | Página `Requerentes`: listagem + busca por nome/CPF | Alta | Frontend |
| 24 | Formulário de cadastro de requerente | Alta | Frontend |
| 25 | Página `RequerenteDetail`: dados + prontuários vinculados | Alta | Frontend |

### Frontend — Prontuário SUAS

| # | Tarefa | P | T |
|---|---|---|---|
| 26 | `ProntuarioEdit`: formulário com 13 seções colapsáveis | Alta | Frontend |
| 27 | Componentes das seções do prontuário | Alta | Frontend |
| 28 | Salvamento manual (botão "Salvar") | Alta | Frontend |
| 29 | `ProntuarioView`: visualização + botões de exportar | Alta | Frontend |
| 30 | Exportar PDF → FastAPI | Alta | Frontend |
| 31 | Exportar JSON raw | Baixa | Frontend |

### Frontend — Chat

| # | Tarefa | P | T |
|---|---|---|---|
| 32 | Hook `useRealtime` — inscrição canal `messages` | Alta | Frontend |
| 33 | Página `Chat`: lista conversas + janela mensagens | Alta | Frontend |
| 34 | Envio de mensagens com persistência | Alta | Frontend |
| 35 | Indicador de mensagens não lidas | Média | Frontend |

### Frontend — Admin

| # | Tarefa | P | T |
|---|---|---|---|
| 36 | Página `Admin`: listagem de usuários | Alta | Frontend |
| 37 | Ativar/desativar usuário, alterar role | Alta | Frontend |
| 38 | Feature CRAS: filtro por unidade, coluna CRAS na tabela, select no formulário | Alta | Frontend |

### Frontend — Videoconferência

| # | Tarefa | P | T |
|---|---|---|---|
| 39 | Página `Videoconferencia`: lista de salas, criar sala (pública/privada) | Alta | Frontend |
| 40 | Integração Daily.co: iframe de vídeo, entrar/sair da chamada | Alta | Frontend |
| 41 | Salas privadas: código de acesso, validação via backend | Alta | Frontend |
| 42 | Seleção de participantes no momento da criação | Média | Frontend |

### Documentação

| # | Tarefa | P | T |
|---|---|---|---|
| 43 | README.md com stack, setup, deploy, perfis | Alta | Docs |
| 44 | BACKLOG.md | Alta | Docs |
| 45 | SKILL.md para Opencode | Alta | Docs |
| 46 | Documentar variáveis de ambiente | Média | Docs |

---

## 🔄 Em Andamento

| # | Tarefa | P | T |
|---|---|---|---|
| 47 | Testar fluxo completo: cadastro → prontuário → PDF | Alta | Testes |
| 48 | Ajustar responsividade mobile (viewport 360px) | Alta | Frontend |
| 49 | Validar RLS policies | Alta | Config |
| 50 | Deploy: Vercel (frontend + backend) | Média | Config |

---

## 📋 Pendente

| # | Tarefa | P | T |
|---|---|---|---|
| 51 | Dashboard Estatístico — gráficos por período/profissional/tipo | Média | Frontend |
| 52 | Relatórios Gerenciais — totais, médias, indicadores | Média | Frontend |
| 53 | Filtros avançados — data, profissional, faixa etária, bairro | Baixa | Frontend |
| 54 | Exportar estatísticas em CSV/PDF | Baixa | Backend |
