# Landing Page Pública

## Problem Statement

O sistema EloSocial não possui uma entrada pública amigável. Ao acessar `/`, o usuário é redirecionado para login. Não há apresentação do sistema, funcionalidades ou contexto para novos usuários.

## Goals

- Criar uma landing page pública em `/` que apresente o EloSocial
- Mover a página "Bem vindo" atual para `/sistema`
- Menu com hover dropdown para navegação + botão de login

## Out of Scope

| Feature | Reason |
|---|---|
| Cadastro direto da landing | Fluxo de cadastro já existe em `/cadastro-requerente` |
| Blog / conteúdo dinâmico | Fora do escopo inicial |
| Internacionalização | Sistema é PT-BR |

## User Stories

### P1: Landing Page Pública ⭐ MVP

**User Story**: Como visitante, quero acessar uma página inicial que apresente o sistema para entender o que é o EloSocial antes de fazer login.

**Acceptance Criteria**:

1. WHEN usuario acessa `/` THEN sistema SHALL exibir landing page pública (sem necessidade de autenticação)
2. WHEN usuario passa o mouse sobre itens do menu THEN sistema SHALL exibir dropdown com opções (Quem Somos, Funcionalidades, Contato)
3. WHEN usuario clica em "Acessar Sistema" THEN sistema SHALL redirecionar para `/login`
4. WHEN usuario rola a página THEN sistema SHALL exibir hero section, 6 feature cards e seção "Quem Somos"
5. WHEN usuario está logado e acessa `/` THEN sistema SHALL redirecionar para `/sistema`

### P2: Roteamento Reorganizado

**User Story**: Como usuário logado, quero que a página de boas-vindas esteja em `/sistema` para que a landing page fique acessível publicamente.

**Acceptance Criteria**:

1. WHEN usuario logado acessa `/sistema` THEN sistema SHALL exibir "Bem vindo, {nome}!"
2. WHEN login é feito (staff) THEN sistema SHALL redirecionar para `/sistema`
3. WHEN login é feito (requerente) THEN sistema SHALL redirecionar para `/acompanhamento`
4. WHEN ProtectedRoute detecta role mismatch THEN sistema SHALL redirecionar para `/sistema`
5. WHEN catch-all route é acionado THEN sistema SHALL redirecionar para `/sistema`

## Edge Cases

- WHEN usuario acessa rota inexistente THEN sistema SHALL redirecionar para `/sistema` (se logado) ou `/` (se não logado)
- WHEN theme é dark/light THEN sistema SHALL manter consistência visual na landing

## Requirement Traceability

| Requirement ID | Story | Status |
|---|---|---|
| LAND-01 | P1: Landing Page | ✅ Verified |
| LAND-02 | P1: Hover Menu | ✅ Verified |
| LAND-03 | P1: Feature Cards | ✅ Verified |
| LAND-04 | P1: Quem Somos | ✅ Verified |
| ROUTE-01 | P2: Roteamento | ✅ Verified |
| ROUTE-02 | P2: Auth Redirects | ✅ Verified |

## Success Criteria

- [x] Landing page carrega em < 1s
- [x] Menu hover funciona em desktop e mobile
- [x] Todas as 6 features são apresentadas com ícone e descrição
- [x] Rota `/sistema` funciona idêntico ao `/` atual
- [x] Todos os redirects de auth apontam para `/sistema`

## Implementation Notes

### Arquivos criados
- `src/components/LandingHeader.jsx` — navbar com hover dropdown mobile
- `src/pages/Landing.jsx` — hero + 6 feature cards + Quem Somos + footer

### Arquivos modificados
- `src/App.jsx` — `/` = Landing pública, `/sistema` = Welcome protegido
- `src/pages/Login.jsx` — redirect padrão para `/sistema`
- `src/components/ProtectedRoute.jsx` — role mismatch → `/sistema`
- `src/index.css` — estilos da landing page (header, hero, features, about, footer, responsive)
