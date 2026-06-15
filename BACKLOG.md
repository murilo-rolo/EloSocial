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
| 5 | Trigger validação de domínio de email institucional (`*.gov.br`, `*.gov.com.br`) | Média | Config |
| 6 | Seed: gerente inicial | Alta | Config |
| 7 | Configurar Authentication (email/senha, SITE_URL) | Alta | Config |

### Backend FastAPI

| # | Tarefa | P | T |
|---|---|---|---|
| 8 | Setup FastAPI + estrutura | Alta | Backend |
| 9 | Endpoint `POST /api/pdf` | Alta | Backend |
| 10 | Template PDF com ReportLab (13 seções + assinatura digital) | Alta | Backend |
| 11 | Endpoint `POST /api/hash` | Média | Backend |
| 12 | Endpoints `POST /api/users` e `DELETE /api/users/:id` (Admin API) | Alta | Backend |
| 13 | Campo `cras` no `CreateUserRequest` | Alta | Backend |
| 14 | Variáveis de ambiente (.env) | Média | Config |

### Frontend — Base

| # | Tarefa | P | T |
|---|---|---|---|
| 15 | Projeto React + Vite + JavaScript (JSX) | Alta | Frontend |
| 16 | `lib/supabase.js` | Alta | Frontend |
| 17 | Páginas: Login, Dashboard (esqueleto), ProtectedRoute | Alta | Frontend |
| 18 | Hook `useAuth` — login, logout, sessão, role | Alta | Frontend |
| 19 | PWA: manifest.json + service worker + ícones | Média | Frontend |
| 20 | Layout responsivo: Sidebar + Topbar (mobile-first) | Alta | Frontend |

### Frontend — Requerentes

| # | Tarefa | P | T |
|---|---|---|---|
| 21 | Página `Requerentes`: listagem + busca por nome/CPF | Alta | Frontend |
| 22 | Formulário de cadastro de requerente | Alta | Frontend |
| 23 | Página `RequerenteDetail`: dados + prontuários vinculados | Alta | Frontend |

### Frontend — Prontuário SUAS

| # | Tarefa | P | T |
|---|---|---|---|
| 24 | `ProntuarioEdit`: formulário com 13 seções colapsáveis | Alta | Frontend |
| 25 | Componentes das seções do prontuário | Alta | Frontend |
| 26 | Salvamento manual (botão "Salvar") | Alta | Frontend |
| 27 | `ProntuarioView`: visualização + botões de exportar | Alta | Frontend |
| 28 | Exportar PDF → FastAPI | Alta | Frontend |
| 29 | Exportar JSON raw | Baixa | Frontend |

### Frontend — Chat

| # | Tarefa | P | T |
|---|---|---|---|
| 30 | Hook `useRealtime` — inscrição canal `messages` | Alta | Frontend |
| 31 | Página `Chat`: lista conversas + janela mensagens | Alta | Frontend |
| 32 | Envio de mensagens com persistência | Alta | Frontend |
| 33 | Indicador de mensagens não lidas | Média | Frontend |

### Frontend — Admin

| # | Tarefa | P | T |
|---|---|---|---|
| 34 | Página `Admin`: listagem de usuários | Alta | Frontend |
| 35 | Ativar/desativar usuário, alterar role | Alta | Frontend |
| 36 | Feature CRAS: filtro por unidade, coluna CRAS na tabela, select no formulário | Alta | Frontend |

### Documentação

| # | Tarefa | P | T |
|---|---|---|---|
| 37 | README.md com stack, setup, deploy, perfis | Alta | Docs |
| 38 | BACKLOG.md | Alta | Docs |
| 39 | `.opencode/context.md` — contexto completo do projeto | Alta | Docs |
| 40 | SKILL.md para Opencode | Alta | Docs |
| 41 | Documentar variáveis de ambiente | Média | Docs |

---

## 🔄 Em Andamento

| # | Tarefa | P | T |
|---|---|---|---|
| 42 | Testar fluxo completo: cadastro → prontuário → PDF | Alta | Testes |
| 43 | Ajustar responsividade mobile (viewport 360px) | Alta | Frontend |
| 44 | Validar RLS policies | Alta | Config |
| 45 | Deploy: Vercel (frontend + backend) | Média | Config |

---

## 📋 Pendente

| # | Tarefa | P | T |
|---|---|---|---|
| 46 | Dashboard Estatístico — gráficos por período/profissional/tipo | Média | Frontend |
| 47 | Relatórios Gerenciais — totais, médias, indicadores | Média | Frontend |
| 48 | Filtros avançados — data, profissional, faixa etária, bairro | Baixa | Frontend |
| 49 | Exportar estatísticas em CSV/PDF | Baixa | Backend |
