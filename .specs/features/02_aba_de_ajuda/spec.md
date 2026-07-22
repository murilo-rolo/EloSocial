# Ajuda — Página de Ajuda do Sistema

## Problem Statement

Os usuários do EloSocial (profissionais e requerentes) não têm uma referência centralizada de como usar cada funcionalidade do sistema. Atualmente, o conhecimento é transmitido por treinamento presencial ou oral, o que gera inconsistência e sobrecarga na equipe. Uma página de Ajuda com seções colapsáveis por role resolve isso de forma autônoma e escalável.

## Goals

- [x] Criar uma página `/ajuda` acessível a profissionais e requerentes autenticados
- [x] Apresentar descrições de cada página do sistema, organizadas por role do usuário
- [x] Usar accordion (seções colapsáveis) para navegação limpa entre seções
- [x] Incluir placeholders prontos para screenshots futuros

## Out of Scope

| Feature | Reason |
|---------|--------|
| Screenshots/imagens reais | Serão adicionados em iteração futura; placeholders servem como espaço reservado |
| Busca textual dentro da ajuda | Funcionalidade P2 — MVP não precisa |
| Vídeos tutoriais | Fora do escopo inicial |
| Tradução para outros idiomas | Sistema é monolíngue (pt-BR) |
| Ajuda contextual (tooltip por página) | Abordagem diferente; pode vir em feature futura |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|----------------------|---------------|-----------|------------|
| Accordion inicia todas as seções fechadas | Sim, todas colapsadas por padrão | Evita sobrecarga visual; usuário expande só o que precisa |
| Placeholder de screenshot: div com borda tracejada + texto | Sim | Permite adicionar imagens depois sem alterar layout |
| Admin aparece apenas para gerente | Sim | Página Admin já tem restrição de role; ajuda reflete isso |
| Profissionais veem 10 seções, requerentes veem 6 | Sim | Mapeamento direto das rotas existentes por role |
| Acessibilidade: profissionais + requerentes autenticados | Sim | Confirmado pelo usuário |
| Sem login = redirect para /login | Sim | Página é rota protegida |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Página de Ajuda com Accordion por Role ⭐ MVP

**User Story**: As a professional/requerente, I want a help page that describes each system page so that I can understand how to use the system without external training.

**Why P1**: This is the core deliverable — a functional help page accessible to all authenticated users.

**Acceptance Criteria**:

1. WHEN user navigates to `/ajuda` THEN system SHALL render a page inside `<Layout>` with title "Ajuda"
2. WHEN user is a professional (Assistente Social, Psicólogo, Pedagogo, Técnico) THEN system SHALL show 10 help sections: Dashboard, Agenda, Requerentes, Prontuário, Chat IA, Mensagens, Videoconferência, Base de Conhecimento, Perfil, Admin
3. WHEN user is a gerente THEN system SHALL show the same 10 sections including Admin
4. WHEN user is a requerente THEN system SHALL show 6 help sections: Dashboard, Triagem, Mensagens, Video, Plano de Ação, Cofre Digital
5. WHEN page loads THEN system SHALL display all accordion sections collapsed by default
6. WHEN user clicks an accordion section header THEN system SHALL toggle (expand/collapse) that section's content
7. WHEN a section is expanded THEN system SHALL show: section title, description text, and a dashed-border placeholder div for future screenshots
8. WHEN unauthenticated user visits `/ajuda` THEN system SHALL redirect to `/login`

**Independent Test**: Login as any professional → navigate to /ajuda → see 10 sections → click one → expands with description + placeholder. Login as requerente → see 6 sections only.

---

### P2: Link na Sidebar para Ambos os Roles

**User Story**: As a user, I want a "Ajuda" link in the sidebar so that I can quickly access help from any page.

**Why P2**: Discoverability — users need to find the help page without knowing the URL.

**Acceptance Criteria**:

1. WHEN Sidebar renders for a professional THEN system SHALL show a "Ajuda" link with `HelpCircle` icon (lucide-react)
2. WHEN Sidebar renders for a requerente THEN system SHALL show a "Ajuda" link with `HelpCircle` icon
3. WHEN user clicks "Ajuda" in Sidebar THEN system SHALL navigate to `/ajuda`
4. WHEN user is on `/ajuda` THEN system SHALL highlight the "Ajuda" Sidebar link as active

**Independent Test**: Login → check Sidebar → "Ajuda" link visible → click → navigates to /ajuda → link highlighted.

---

## Content per Section

### Professional Sections

| # | Section Title | Icon | Description |
|---|--------------|------|-------------|
| 1 | Dashboard | LayoutDashboard | Visão geral do sistema com estatísticas de atendimentos, prontuários recentes e gráficos de desempenho. Acesse rapidamente os dados mais importantes do seu dia a dia. |
| 2 | Agenda | Calendar | Gerencie seus atendimentos, sessões e visitas domiciliares. Visualize sua agenda do dia, semana ou mês e registre novos compromissos. |
| 3 | Requerentes | Users | Busque, cadastre e gerencie requerentes. Acesse o histórico completo de atendimentos e prontuários de cada pessoa atendida. |
| 4 | Prontuário | FileText | Fichas de atendimento com 13 seções detalhadas (identificação, composição familiar, habitacional, educação, trabalho, saúde, benefícios, convivência, participação, violência, encaminhamentos, observações). Exporte em PDF ou JSON. |
| 5 | Chat IA | Bot | Assistente inteligente que responde perguntas sobre o prontuário do requerente, sugere encaminhamentos e ajuda na análise de vulnerabilidade. |
| 6 | Mensagens | MessageSquare | Chat em tempo real entre profissionais da equipe. Comunique-se sobre casos, compartilhe informações e coordene atendimentos. |
| 7 | Videoconferência | Video | Realize atendimentos por vídeo com requerentes ou equipe técnica. Salas públicas ou privadas com código de acesso. |
| 8 | Base de Conhecimento | BookOpen | Upload e gestão de documentos (PDFs) para a base de conhecimento da IA. Quanto mais documentos, melhor as respostas do Copiloto. |
| 9 | Perfil | User | Visualize e edite seus dados pessoais, senha e informações de perfil. |
| 10 | Admin | Settings | (Apenas Gerente) Gerencie usuários do sistema, crie novas contas, atribua CRAS e monitore a auditoria de ações. |

### Requerente Sections

| # | Section Title | Icon | Description |
|---|--------------|------|-------------|
| 1 | Dashboard | LayoutDashboard | Acompanhe o status do seu atendimento, veja próximas ações e receba notificações importantes da equipe técnica. |
| 2 | Triagem | ClipboardList | Visualize sua avaliação de vulnerabilidade. A IA analisa suas respostas e indica o nível de prioridade do seu caso. |
| 3 | Mensagens | MessageSquare | Converse em tempo real com a equipe técnica responsável pelo seu atendimento. Envie dúvidas, documentos e atualizações. |
| 4 | Video | VideoParticipation | Participe de videochamadas com profissionais. Acesse salas de atendimento por vídeo de forma segura e simples. |
| 5 | Plano de Ação | ListTodo | Acompanhe as etapas do seu plano de ação social. Veja tarefas, prazos e progresso do seu acompanhamento. |
| 6 | Cofre Digital | FolderOpen | Armazene e acesse seus documentos de forma segura. Anexe RG, CPF, comprovantes e outros arquivos importantes ao seu prontuário. |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---------------|-------|-------|--------|
| AJUDA-01 | P1: Página de Ajuda com Accordion | Execute | Verified |
| AJUDA-02 | P1: Página de Ajuda com Accordion | Execute | Verified |
| AJUDA-03 | P1: Página de Ajuda com Accordion | Execute | Verified |
| AJUDA-04 | P1: Página de Ajuda com Accordion | Execute | Verified |
| AJUDA-05 | P1: Página de Ajuda com Accordion | Execute | Verified |
| AJUDA-06 | P1: Página de Ajuda com Accordion | Execute | Verified |
| AJUDA-07 | P1: Página de Ajuda com Accordion | Execute | Verified |
| AJUDA-08 | P1: Página de Ajuda com Accordion | Execute | Verified |
| AJUDA-09 | P2: Link na Sidebar | Execute | Verified |
| AJUDA-10 | P2: Link na Sidebar | Execute | Verified |
| AJUDA-11 | P2: Link na Sidebar | Execute | Verified |
| AJUDA-12 | P2: Link na Sidebar | Execute | Verified |

**Coverage:** 12 total, 12 mapped to tasks, 0 unmapped ✅

---

## Success Criteria

- [x] Profissional logado vê 10 seções de ajuda ao navegar para /ajuda
- [x] Requerente logado vê 6 seções de ajuda ao navegar para /ajuda
- [x] Todas as seções iniciam colapsadas e expandem ao clicar
- [x] Cada seção contém descrição + placeholder para screenshot
- [x] Link "Ajuda" aparece na Sidebar para todos os perfis autenticados
- [x] Usuário não logado é redirecionado para /login
