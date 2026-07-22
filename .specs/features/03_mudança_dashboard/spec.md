# Feature: Mudança da Página de Entrada

## Visão Geral

A página de entrada (`/`) atualmente renderiza o Dashboard analítico (`Dashboard.jsx`) — o mesmo para todos os perfis, incluindo requerentes. O objetivo é simplificar a página de entrada para exibir apenas uma mensagem de boas-vindas, e mover o dashboard analítico para uma rota dedicada `/dashboard`.

## Contexto

- **Rota `/`**: Renderiza `Dashboard.jsx` (stats, gráficos, prontuários recentes) — sem distinção de perfil.
- **Sidebar profissional**: Link "Dashboard" aponta para `/`.
- **Sidebar requerente**: Link "Dashboard" aponta para `/acompanhamento` (DashboardRequerente) — não sofre alteração.
- **Login redirect**: Redireciona para `/` para todos os perfis.

## Requisitos

### REQ-01: Página de entrada com mensagem de boas-vindas
- **Critério**: Ao acessar `/`, o usuário autenticado vê uma mensagem "Bem vindo, *{nome}*!" onde `{nome}` é o primeiro nome do perfil, em itálico.
- **Aplicável para**: Todos os perfis (profissionais e requerentes).
- **Arquivo**: `frontend/src/pages/Welcome.jsx` (novo)

### REQ-02: Dashboard analytics acessível via rota dedicada
- **Critério**: A rota `/dashboard` renderiza o componente `Dashboard.jsx` (atual conteúdo de `/`).
- **Arquivo**: `frontend/src/App.jsx`

### REQ-03: Sidebar do profissional aponta para `/dashboard`
- **Critério**: O link "Dashboard" na sidebar para perfis não-requerente aponta para `/dashboard` em vez de `/`.
- **Arquivo**: `frontend/src/components/Layout/Sidebar.jsx`

## Fora do Escopo

- Alterações no Dashboard.jsx (conteúdo permanece o mesmo)
- Alterações na sidebar do requerente
- Alterações no schema do banco
- Notificações ou contadores na página de entrada
