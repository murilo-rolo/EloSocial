# Backlog — EloSocial (2 semanas)

## Legenda

- [P] Prioridade: Alta | Média | Baixa
- [T] Tipo: Config | Backend | Frontend | Docs

---

## Semana 1 — Fundação (Backend + Database)

### Dia 1-2: Projeto Supabase

| # | Tarefa | P | T |
|---|---|---|---|
| 1 | Criar projeto no supabase.com | Alta | Config |
| 2 | Migrations: `profiles`, `applicants`, `prontuarios`, `atendimentos`, `messages` | Alta | Config |
| 3 | RLS policies (SELECT livre, INSERT/UPDATE por role) | Alta | Config |
| 4 | Trigger validação de domínio de email institucional | Média | Config |
| 5 | Seed: gerente inicial | Alta | Config |
| 6 | Configurar Authentication (email/senha, SITE_URL) | Alta | Config |

### Dia 3: Backend FastAPI

| # | Tarefa | P | T |
|---|---|---|---|
| 7 | Setup FastAPI + estrutura | Alta | Backend |
| 8 | Endpoint `POST /api/pdf` | Alta | Backend |
| 9 | Template PDF com ReportLab | Alta | Backend |
| 10 | Variáveis de ambiente (.env) | Média | Config |

### Dia 4-5: Frontend — Base

| # | Tarefa | P | T |
|---|---|---|---|
| 11 | Projeto React + Vite + JavaScript (JSX) | Alta | Frontend |
| 12 | `lib/supabase.js` | Alta | Frontend |
| 13 | Páginas: Login, Dashboard (esqueleto), ProtectedRoute | Alta | Frontend |
| 14 | Hook `useAuth` — login, logout, sessão, role | Alta | Frontend |
| 15 | PWA: manifest.json + service worker + ícones | Média | Frontend |
| 16 | Layout responsivo: Sidebar + Topbar (mobile-first) | Alta | Frontend |

---

## Semana 2 — Funcionalidades (Frontend)

### Dia 6-7: Requerentes

| # | Tarefa | P | T |
|---|---|---|---|
| 17 | Página `Requerentes`: listagem + busca por nome/CPF | Alta | Frontend |
| 18 | Formulário de cadastro de requerente | Alta | Frontend |
| 19 | Página `RequerenteDetail`: dados + prontuários vinculados | Alta | Frontend |

### Dia 8-9: Prontuário SUAS

| # | Tarefa | P | T |
|---|---|---|---|
| 20 | `ProntuarioEdit`: formulário com 13 seções colapsáveis | Alta | Frontend |
| 21 | Componentes: Habitacional, Educacional, Trabalho, Saúde, Benefícios, Convivência, Participação, Violência, Observações | Alta | Frontend |
| 22 | Salvamento manual (botão "Salvar") | Alta | Frontend |
| 23 | `ProntuarioView`: visualização + botões de exportar | Alta | Frontend |
| 24 | Exportar PDF → FastAPI | Alta | Frontend |
| 25 | Exportar JSON raw | Baixa | Frontend |

### Dia 10: Chat

| # | Tarefa | P | T |
|---|---|---|---|
| 26 | Hook `useRealtime` — inscrição canal `messages` | Alta | Frontend |
| 27 | Página `Chat`: lista conversas + janela mensagens | Alta | Frontend |
| 28 | Envio de mensagens com persistência | Alta | Frontend |
| 29 | Indicador de mensagens não lidas | Média | Frontend |

### Dia 11: Admin

| # | Tarefa | P | T |
|---|---|---|---|
| 30 | Página `Admin`: listagem de usuários | Alta | Frontend |
| 31 | Ativar/desativar usuário, alterar role | Alta | Frontend |

### Dia 12-14: Finalização

| # | Tarefa | P | T |
|---|---|---|---|
| 32 | Testar fluxo completo: cadastro → prontuário → PDF | Alta | Testes |
| 33 | Ajustar responsividade mobile (viewport 360px) | Alta | Frontend |
| 34 | Validar RLS policies | Alta | Config |
| 35 | Documentar variáveis de ambiente | Média | Docs |
| 36 | Deploy: Vercel (frontend) + Railway/Render (backend) | Média | Config |

---

## Futuro (pós-2 semanas)

| # | Tarefa | P | T |
|---|---|---|---|
| 37 | Dashboard Estatístico — gráficos por período/profissional/tipo | Média | Frontend |
| 38 | Relatórios Gerenciais — totais, médias, indicadores | Média | Frontend |
| 39 | Filtros avançados — data, profissional, faixa etária, bairro | Baixa | Frontend |
| 40 | Exportar estatísticas em CSV/PDF | Baixa | Backend |
