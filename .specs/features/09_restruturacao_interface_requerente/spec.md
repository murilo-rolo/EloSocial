# Reestruturação da Interface do Requerente — Especificação

## Problem Statement

A interface do requerente possui inconsistências de navegação: itens de sidebar com labels desatualizados, uma página `/plano-acao` isolada que deveria ser parte do acompanhamento, atalhos redundantes dentro de `/acompanhamento` (já cobertos pela sidebar), e `/triagem` acessível diretamente pela sidebar em vez de ser contextualizada como sub-fluxo de `/acompanhamento`. O resultado é uma UX fragmentada e confusa para o usuário final.

## Goals

- [ ] Sidebar do requerente com labels e rotas corretos e limpos
- [ ] `/acompanhamento` como hub central: inclui status do caso, plano de ação e acesso contextual à triagem
- [ ] Navegação sem redundância: remover botões quickLinks que duplicam a sidebar
- [ ] Triagem acessada como sub-fluxo contextual de `/acompanhamento`, não como item independente da sidebar

## Out of Scope

| Feature | Reason |
|---------|--------|
| Alteração no conteúdo ou lógica interna do `TriagemSocial` | Apenas rota e ponto de acesso mudam |
| Alteração no conteúdo ou lógica interna do `CofreDigital`/`DocumentosCaso` | Apenas label e rota mudam |
| Criação de nova UI para o Plano de Ação | Reutiliza `PlanoAcaoCaso` existente como seção |
| Mudanças nas páginas de outros perfis (assistente, gerente) | Escopo restrito ao perfil `requerente` |
| Alteração no fluxo de auth/ProtectedRoute | Apenas rotas nomeadas mudam |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|-----------------------|----------------|-----------|------------|
| Rota `/acompanhamento/triagem` implementada como rota flat no mesmo nível das outras rotas em `App.jsx` | Rota flat | Mais simples; sem nested routes/Outlet | y |
| Plano de Ação integrado como seção adicional diretamente na página `/acompanhamento`, abaixo do conteúdo de status | Seção inline | Evita tabs/accordions desnecessários | y |
| Rotas antigas `/cofre-digital`, `/plano-acao` e `/triagem` redirecionam para as novas | `<Navigate>` | Preserva bookmarks e links antigos | y |
| O componente `TriagemSocial.jsx` não é alterado internamente — apenas a rota muda | Sem alteração no componente | Triagem usa `navigate('/acompanhamento', { replace: true })` ao concluir, o que permanece correto | y |
| O botão de acesso à triagem em `/acompanhamento` usa o mesmo padrão já existente (botão "Iniciar Triagem" / "Editar Triagem") mas agora navega para `/acompanhamento/triagem` | Navegar para `/acompanhamento/triagem` | Substitui `/triagem` e `/triagem?editar=1` | y |
| Verificação se triagem foi feita: usa o mesmo estado `caso` já carregado em `DashboardRequerente` | Reutiliza estado existente | Sem nova query | y |

**Open questions:** nenhum — todos resolvidos ou registrados acima.

---

## User Stories

### P1: Sidebar com labels e rotas corretos ⭐ MVP

**User Story**: Como requerente, quero que a sidebar reflita claramente as seções disponíveis, com nomes e rotas corretos, para navegar sem confusão.

**Why P1**: É a base de toda navegação — erros aqui afetam toda a UX.

**Acceptance Criteria**:

1. WHEN o requerente visualiza a sidebar THEN sistema SHALL exibir "Acompanhamento" (não "Dashboard") como primeiro item, com rota `/acompanhamento`
2. WHEN o requerente visualiza a sidebar THEN sistema SHALL exibir "Documentos" (não "Cofre Digital") como quinto item, com rota `/documentos`
3. WHEN o requerente visualiza a sidebar THEN sistema SHALL NOT exibir item "Triagem"
4. WHEN o requerente visualiza a sidebar THEN sistema SHALL NOT exibir item "Plano de Acao"
5. WHEN o requerente clica em "Documentos" na sidebar THEN sistema SHALL navegar para `/documentos` e exibir o conteúdo de documentos do caso

**Independent Test**: Renderizar `<Sidebar>` com `profile.role = 'requerente'` e verificar labels/rotas/ausências.

---

### P1: Rota `/documentos` servindo o componente CofreDigital ⭐ MVP

**User Story**: Como requerente, quero acessar meus documentos em `/documentos` para que a URL seja clara e consistente com o label da sidebar.

**Why P1**: Rota e label devem ser coerentes; sem isso o item "Documentos" na sidebar quebra.

**Acceptance Criteria**:

1. WHEN o requerente navega para `/documentos` THEN sistema SHALL renderizar o componente `CofreDigital`
2. WHEN o requerente navega para `/cofre-digital` (URL antiga) THEN sistema SHALL redirecionar automaticamente para `/documentos`
3. WHEN o usuário não é requerente e acessa `/documentos` THEN sistema SHALL redirecionar para `/sistema` (comportamento `ProtectedRoute` preservado)

**Independent Test**: Montar o roteador com a rota `/documentos` e verificar que `CofreDigital` é renderizado; verificar redirecionamento de `/cofre-digital`.

---

### P1: Rota `/acompanhamento/triagem` e remoção de `/triagem` da sidebar ⭐ MVP

**User Story**: Como requerente, quero acessar a triagem a partir do meu painel de acompanhamento, não como item independente da sidebar, para entender que triagem é parte do meu processo de acompanhamento.

**Why P1**: Remove item confuso da sidebar e contextualiza o fluxo corretamente.

**Acceptance Criteria**:

1. WHEN o requerente navega para `/acompanhamento/triagem` THEN sistema SHALL renderizar o componente `TriagemSocial`
2. WHEN o requerente navega para `/triagem` (URL antiga) THEN sistema SHALL redirecionar para `/acompanhamento/triagem`
3. WHEN `TriagemSocial` conclui o submit THEN sistema SHALL navegar para `/acompanhamento` (comportamento existente preservado)

**Independent Test**: Montar roteador e verificar que `/acompanhamento/triagem` renderiza `TriagemSocial`; verificar redirecionamento de `/triagem`.

---

### P1: Botões quickLinks removidos de `/acompanhamento` ⭐ MVP

**User Story**: Como requerente, quero que `/acompanhamento` não exiba atalhos redundantes para páginas já acessíveis pela sidebar, para ter uma interface mais limpa.

**Why P1**: Elimina redundância direta com a sidebar.

**Acceptance Criteria**:

1. WHEN o requerente acessa `/acompanhamento` THEN sistema SHALL NOT renderizar botões de navegação para "Video Atendimento", "Mensagens", "Plano de Acao" ou "Cofre Digital"
2. WHEN o requerente acessa `/acompanhamento` THEN sistema SHALL manter todas as informações do caso (status, prioridade, triagem, etc.)

**Independent Test**: Renderizar `DashboardRequerente` com caso mockado e confirmar ausência dos 4 botões quickLinks.

---

### P1: Plano de Ação integrado em `/acompanhamento` como seção ⭐ MVP

**User Story**: Como requerente, quero ver meu plano de ação diretamente na página de acompanhamento, sem precisar navegar para outra página, para ter visão completa do meu caso em um só lugar.

**Why P1**: Elimina a rota `/plano-acao` e consolida a experiência.

**Acceptance Criteria**:

1. WHEN o requerente acessa `/acompanhamento` e possui um caso ativo THEN sistema SHALL renderizar o componente `PlanoAcaoCaso` com `modo="requerente"` abaixo do conteúdo de status do caso
2. WHEN o requerente acessa `/plano-acao` (URL antiga) THEN sistema SHALL redirecionar para `/acompanhamento`
3. WHEN o requerente não possui caso ativo THEN sistema SHALL NOT renderizar a seção de Plano de Ação (comportamento consistente com o estado "sem caso")

**Independent Test**: Renderizar `DashboardRequerente` com `caso` mockado e confirmar presença de `PlanoAcaoCaso`; renderizar sem caso e confirmar ausência.

---

### P1: Botões de acesso à triagem em `/acompanhamento` com rota correta ⭐ MVP

**User Story**: Como requerente, quero que o botão "Fazer Triagem" ou "Editar Triagem" na página de acompanhamento me leve para `/acompanhamento/triagem`, para que o fluxo de triagem seja acessado de forma contextual.

**Why P1**: Completa a migração da rota de triagem.

**Acceptance Criteria**:

1. WHEN o requerente acessa `/acompanhamento` sem triagem existente THEN sistema SHALL exibir botão "Fazer Triagem" navegando para `/acompanhamento/triagem`
2. WHEN o requerente acessa `/acompanhamento` com triagem já existente THEN sistema SHALL exibir botão "Editar Triagem" navegando para `/acompanhamento/triagem`

**Independent Test**: Renderizar `DashboardRequerente` sem caso e confirmar que o botão "Fazer Triagem" aponta para `/acompanhamento/triagem`; renderizar com caso e confirmar "Editar Triagem".

---

## Edge Cases

- WHEN requerente acessa `/plano-acao` diretamente THEN sistema SHALL redirecionar para `/acompanhamento`
- WHEN requerente acessa `/triagem` diretamente THEN sistema SHALL redirecionar para `/acompanhamento/triagem`
- WHEN requerente acessa `/cofre-digital` diretamente THEN sistema SHALL redirecionar para `/documentos`
- WHEN `DashboardRequerente` está carregando o caso THEN sistema SHALL manter o loading state existente sem renderizar a seção de Plano de Ação prematuramente

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|----------------|-------|-------|--------|
| RIR-01 | Sidebar: label "Acompanhamento" | Tasks | Pending |
| RIR-02 | Sidebar: label "Documentos" + rota `/documentos` | Tasks | Pending |
| RIR-03 | Sidebar: remoção de "Triagem" | Tasks | Pending |
| RIR-04 | Sidebar: remoção de "Plano de Acao" | Tasks | Pending |
| RIR-05 | Rota `/documentos` renderiza `CofreDigital` | Tasks | Pending |
| RIR-06 | Redirect `/cofre-digital` → `/documentos` | Tasks | Pending |
| RIR-07 | Rota `/acompanhamento/triagem` renderiza `TriagemSocial` | Tasks | Pending |
| RIR-08 | Redirect `/triagem` → `/acompanhamento/triagem` | Tasks | Pending |
| RIR-09 | Remoção dos botões quickLinks de `/acompanhamento` | Tasks | Pending |
| RIR-10 | `PlanoAcaoCaso` como seção em `/acompanhamento` | Tasks | Pending |
| RIR-11 | Redirect `/plano-acao` → `/acompanhamento` | Tasks | Pending |
| RIR-12 | Botão triagem em `/acompanhamento` aponta para `/acompanhamento/triagem` | Tasks | Pending |

**ID format:** `RIR-NN` (Reestruturação Interface Requerente)
**Coverage:** 12 total, 0 mapped to tasks yet, 12 unmapped ⚠️

---

## Success Criteria

- [ ] Sidebar do requerente exibe exatamente: Acompanhamento, Mensagens, Video, Documentos, Ajuda (5 itens)
- [ ] Zero rotas mortas: `/cofre-digital`, `/triagem` e `/plano-acao` redirecionam para as novas
- [ ] `/acompanhamento` contém seção de Plano de Ação e não contém botões quickLinks
- [ ] Triagem acessível apenas via `/acompanhamento/triagem` (não mais item direto na sidebar)
- [ ] Nenhuma regressão: páginas de outros perfis inalteradas
