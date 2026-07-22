# Reestruturação da Interface do Requerente — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Spec**: `.specs/features/09_restruturacao_interface_requerente/spec.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from codebase (no existing tests, no testing guidelines found) — strong defaults applied. Vitest + React Testing Library chosen by user.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|------------|-------------------|----------------------|------------------|-------------|
| Sidebar component | unit | AC RIR-01..04: labels corretos, rotas corretas, itens ausentes — todos os ACs 1:1 | `frontend/src/components/Layout/__tests__/Sidebar.test.jsx` | `cd frontend && npx vitest run` |
| App.jsx (routing) | unit | AC RIR-05..08, RIR-07, RIR-11: rotas presentes, redirects corretos | `frontend/src/__tests__/routing.test.jsx` | `cd frontend && npx vitest run` |
| DashboardRequerente | unit | AC RIR-09, RIR-10, RIR-12: ausência quickLinks, presença PlanoAcaoCaso, URLs botões triagem | `frontend/src/pages/__tests__/DashboardRequerente.test.jsx` | `cd frontend && npx vitest run` |
| TriagemSocial / CofreDigital / PlanoAcao | none | Sem alteração de lógica interna; build gate only | — | `cd frontend && npm run build` |

## Gate Check Commands

> Generated from `package.json` (`vite build`); Vitest to be configured in T1.

| Gate Level | When to Use | Command |
|------------|-------------|---------|
| Quick | Após tarefas com testes de componente | `cd frontend && npx vitest run` |
| Build | Após fase completa ou tarefas sem testes | `cd frontend && npm run build` |

---

## Execution Plan

Phases run sequentially. Tasks within a phase run in order.

```
Phase 1 → Phase 2 → Phase 3
Phase 1: T1
Phase 2: T2 → T3 → T4
Phase 3: T5 → T6 → T7 → T8
```

### Phase 1: Setup de Testes

Configurar Vitest + RTL no projeto frontend. Nenhuma alteração de feature — apenas infraestrutura de testes.

```
T1
```

### Phase 2: Roteamento (App.jsx)

Adicionar/renomear rotas e redirects. Sem alterações em componentes.

```
T2 → T3 → T4
```

### Phase 3: Componentes

Modificar Sidebar e DashboardRequerente.

```
T5 → T6 → T7 → T8
```

---

## Task Breakdown

### T1: Configurar Vitest + React Testing Library no frontend

**What**: Instalar dependências e criar `vitest.config.js` + `setupTests.js` no projeto frontend
**Where**: `frontend/package.json`, `frontend/vite.config.js`, `frontend/src/setupTests.js`
**Depends on**: None
**Reuses**: Configuração Vite existente em `frontend/vite.config.js`
**Requirement**: Infraestrutura de testes (pré-requisito para T2..T8)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `vitest`, `@vitest/ui`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom` adicionados como devDependencies
- [ ] `vitest.config.js` criado com `environment: 'jsdom'` e `setupFiles: ['./src/setupTests.js']`
- [ ] `src/setupTests.js` criado com `import '@testing-library/jest-dom'`
- [ ] Gate check passa: `cd frontend && npx vitest run` (zero testes — 0 passed, 0 failed é OK)

**Tests**: none (é a própria infra de testes)
**Gate**: build

---

### T2: Adicionar rota `/documentos` e redirect `/cofre-digital` em App.jsx

**What**: Adicionar `<Route path="/documentos">` com `CofreDigital` e `<Navigate from="/cofre-digital" to="/documentos">` em `frontend/src/App.jsx`
**Where**: `frontend/src/App.jsx`
**Depends on**: T1
**Reuses**: Padrão existente de `<ProtectedRoute roles={['requerente']}>` em App.jsx
**Requirement**: RIR-05, RIR-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Rota `/documentos` adicionada com `ProtectedRoute roles={['requerente']}` renderizando `CofreDigital`
- [ ] `<Navigate from="/cofre-digital" to="/documentos" replace />` adicionado
- [ ] Rota `/cofre-digital` original removida
- [ ] Teste `routing.test.jsx` criado/atualizado: navegar para `/documentos` renderiza `CofreDigital`; navegar para `/cofre-digital` redireciona para `/documentos`
- [ ] Gate check passa: `cd frontend && npx vitest run`

**Tests**: unit
**Gate**: quick

---

### T3: Adicionar rota `/acompanhamento/triagem` e redirect `/triagem` em App.jsx

**What**: Adicionar `<Route path="/acompanhamento/triagem">` com `TriagemSocial` e `<Navigate from="/triagem" to="/acompanhamento/triagem">` em `App.jsx`
**Where**: `frontend/src/App.jsx`
**Depends on**: T2
**Reuses**: Importação de `TriagemSocial` já existente; padrão `ProtectedRoute` existente
**Requirement**: RIR-07, RIR-08

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Rota `/acompanhamento/triagem` adicionada com `ProtectedRoute roles={['requerente']}` renderizando `TriagemSocial`
- [ ] `<Navigate from="/triagem" to="/acompanhamento/triagem" replace />` adicionado
- [ ] Rota `/triagem` original removida
- [ ] Teste: navegar para `/acompanhamento/triagem` renderiza `TriagemSocial`; navegar para `/triagem` redireciona para `/acompanhamento/triagem`
- [ ] Gate check passa: `cd frontend && npx vitest run`

**Tests**: unit
**Gate**: quick

---

### T4: Adicionar redirect `/plano-acao` → `/acompanhamento` em App.jsx

**What**: Adicionar `<Navigate from="/plano-acao" to="/acompanhamento">` e remover rota `/plano-acao` de `App.jsx`
**Where**: `frontend/src/App.jsx`
**Depends on**: T3
**Reuses**: Padrão `<Navigate>` introduzido em T2/T3
**Requirement**: RIR-11

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Rota `/plano-acao` removida de App.jsx
- [ ] `<Navigate from="/plano-acao" to="/acompanhamento" replace />` adicionado
- [ ] Import de `PlanoAcao` (página standalone) removido de App.jsx (se não usado em outro lugar)
- [ ] Teste: navegar para `/plano-acao` redireciona para `/acompanhamento`
- [ ] Gate check passa: `cd frontend && npx vitest run`

**Tests**: unit
**Gate**: quick

---

### T5: Atualizar Sidebar do requerente (labels, rotas e remoções)

**What**: Modificar o bloco de navegação do requerente em `Sidebar.jsx`: label "Dashboard"→"Acompanhamento", "Cofre Digital"→"Documentos" com rota `/documentos`, remoção de "Triagem" e "Plano de Acao"
**Where**: `frontend/src/components/Layout/Sidebar.jsx`
**Depends on**: T4
**Reuses**: Array/lista de itens de navegação existente em `Sidebar.jsx`
**Requirement**: RIR-01, RIR-02, RIR-03, RIR-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Item "Dashboard" renomeado para "Acompanhamento" (rota `/acompanhamento` inalterada)
- [ ] Item "Cofre Digital" renomeado para "Documentos" com rota atualizada para `/documentos`
- [ ] Item "Triagem" removido do array de navegação do requerente
- [ ] Item "Plano de Acao" removido do array de navegação do requerente
- [ ] Teste `Sidebar.test.jsx` criado: renderizar `<Sidebar>` com `profile.role='requerente'` e assert: label "Acompanhamento" presente, label "Documentos" presente, href "/documentos" presente, "Triagem" ausente, "Plano de Acao" ausente, "Dashboard" ausente, "Cofre Digital" ausente
- [ ] Gate check passa: `cd frontend && npx vitest run`

**Tests**: unit
**Gate**: quick

---

### T6: Remover botões quickLinks de DashboardRequerente

**What**: Remover o bloco `quickLinks` (array + grid de cards de navegação) de `DashboardRequerente.jsx`, preservando todo o restante do conteúdo da página
**Where**: `frontend/src/pages/DashboardRequerente.jsx`
**Depends on**: T5
**Reuses**: Estrutura existente de `DashboardRequerente.jsx`
**Requirement**: RIR-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Array `quickLinks` removido
- [ ] Grid/seção de cards de navegação (Video Atendimento, Mensagens, Plano de Acao, Cofre Digital) removida do JSX
- [ ] Imports de ícones usados exclusivamente pelos quickLinks removidos (se houver)
- [ ] Restante do conteúdo da página (status do caso, prioridade, triagem info, etc.) preservado intacto
- [ ] Teste `DashboardRequerente.test.jsx` criado: renderizar com `caso` mockado e confirmar que "Video Atendimento", "Mensagens", "Plano de Acao" e "Cofre Digital" NÃO estão no DOM como botões/links de navegação
- [ ] Gate check passa: `cd frontend && npx vitest run`

**Tests**: unit
**Gate**: quick

---

### T7: Integrar PlanoAcaoCaso como seção em DashboardRequerente

**What**: Adicionar `<PlanoAcaoCaso casoId={caso.id} modo="requerente" />` como seção em `DashboardRequerente.jsx`, exibida apenas quando `caso` está carregado
**Where**: `frontend/src/pages/DashboardRequerente.jsx`
**Depends on**: T6
**Reuses**: Componente `PlanoAcaoCaso` existente em `components/caso/PlanoAcaoCaso.jsx`
**Requirement**: RIR-10

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Import de `PlanoAcaoCaso` adicionado em `DashboardRequerente.jsx`
- [ ] Seção com `<PlanoAcaoCaso casoId={caso.id} modo="requerente" />` adicionada abaixo do conteúdo de status existente, dentro do bloco condicional `{caso && ...}`
- [ ] Quando `caso` é null/undefined, a seção NÃO é renderizada
- [ ] Teste atualizado: renderizar com `caso` mockado confirma presença de `PlanoAcaoCaso`; renderizar sem `caso` confirma ausência
- [ ] Gate check passa: `cd frontend && npx vitest run`

**Tests**: unit
**Gate**: quick

---

### T8: Atualizar botões de triagem em DashboardRequerente para `/acompanhamento/triagem`

**What**: Atualizar as URLs de navegação dos botões "Fazer Triagem" e "Editar Triagem" em `DashboardRequerente.jsx` para apontar para `/acompanhamento/triagem`
**Where**: `frontend/src/pages/DashboardRequerente.jsx`
**Depends on**: T7
**Reuses**: Lógica condicional existente de botões de triagem em `DashboardRequerente.jsx`
**Requirement**: RIR-12

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Botão "Iniciar Triagem" / "Fazer Triagem" navega para `/acompanhamento/triagem` (era `/triagem`)
- [ ] Botão "Editar Triagem" navega para `/acompanhamento/triagem` (era `/triagem?editar=1`) — nota: o parâmetro `?editar=1` pode ser mantido se `TriagemSocial` o usa internamente, ou dropped se a lógica de editar for baseada apenas na existência do caso
- [ ] Teste: renderizar sem `caso` e confirmar que botão navega para `/acompanhamento/triagem`; renderizar com `caso` e confirmar botão "Editar Triagem" navega para `/acompanhamento/triagem`
- [ ] Build completo passa: `cd frontend && npm run build`
- [ ] Gate check passa: `cd frontend && npx vitest run`

**Tests**: unit
**Gate**: build

**Commit**: `feat(requerente): reestrutura interface — sidebar, rotas, plano de ação integrado`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1
Phase 2:  T2 ──→ T3 ──→ T4
Phase 3:  T5 ──→ T6 ──→ T7 ──→ T8
```

---

## Task Granularity Check

| Task | Scope | Status |
|------|-------|--------|
| T1: Configurar Vitest + RTL | 1 config setup | ✅ Granular |
| T2: Rota `/documentos` + redirect | 1 arquivo, 2 rotas relacionadas | ✅ Granular |
| T3: Rota `/acompanhamento/triagem` + redirect | 1 arquivo, 2 rotas relacionadas | ✅ Granular |
| T4: Redirect `/plano-acao` | 1 arquivo, 1 rota | ✅ Granular |
| T5: Atualizar Sidebar | 1 componente | ✅ Granular |
| T6: Remover quickLinks | 1 componente, 1 bloco de JSX | ✅ Granular |
| T7: Adicionar PlanoAcaoCaso | 1 componente, 1 seção | ✅ Granular |
| T8: Atualizar URLs triagem | 1 componente, 2 navegações | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|------|------------------------|---------------|--------|
| T1 | None | Phase 1: T1 (nenhuma seta de entrada) | ✅ Match |
| T2 | T1 | Phase 2: T1 → T2 (T1 encerra Phase 1, T2 inicia Phase 2) | ✅ Match |
| T3 | T2 | Phase 2: T2 → T3 | ✅ Match |
| T4 | T3 | Phase 2: T3 → T4 | ✅ Match |
| T5 | T4 | Phase 3: T4 → T5 (T4 encerra Phase 2, T5 inicia Phase 3) | ✅ Match |
| T6 | T5 | Phase 3: T5 → T6 | ✅ Match |
| T7 | T6 | Phase 3: T6 → T7 | ✅ Match |
| T8 | T7 | Phase 3: T7 → T8 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|------|-----------------------------|-----------------|-----------|--------|
| T1: Setup Vitest | Infraestrutura de testes | none | none | ✅ OK |
| T2: Rota /documentos | App.jsx (routing) | unit | unit | ✅ OK |
| T3: Rota /acompanhamento/triagem | App.jsx (routing) | unit | unit | ✅ OK |
| T4: Redirect /plano-acao | App.jsx (routing) | unit | unit | ✅ OK |
| T5: Sidebar | Sidebar component | unit | unit | ✅ OK |
| T6: Remover quickLinks | DashboardRequerente | unit | unit | ✅ OK |
| T7: PlanoAcaoCaso na Dashboard | DashboardRequerente | unit | unit | ✅ OK |
| T8: URLs triagem | DashboardRequerente | unit | unit | ✅ OK |
