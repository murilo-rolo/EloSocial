# Feature: Alterações na Interface do Profissional

## Visão Geral
Reformular a interface do profissional para remover páginas redundantes, consolidar ferramentas no dossiê do requerente e adicionar funcionalidades de plano de ação, agendamentos e videochamada.

## Requisitos

### REQ-01: Remover página /chat-ia
- **Critério**: Rota `/chat-ia` não existe mais; sidebar não tem link "Chat IA"
- **Arquivos**: `App.jsx`, `Sidebar.jsx`, `ChatIA.jsx`

### REQ-02: Remover botões Triagem IA e Resumo IA do dossiê
- **Critério**: Barra "Assistentes de IA" em `/requerentes/:id` é removida. Copiloto SUAS (ChatLLM) permanece.
- **Arquivo**: `RequerenteDetail.jsx`

### REQ-03: Adicionar seção Plano de Ação ao dossiê
- **Critério**: Card "Plano de Ação" em `/requerentes/:id` com PlanoAcaoCaso modo="assistente". Tarefas criadas aparecem em `/acompanhamento` do requerente e vice-versa.
- **Arquivo**: `RequerenteDetail.jsx`

### REQ-04: Remover página /agenda e adicionar agendamentos no Plano de Ação
- **Critério**: Rota `/agenda` removida, sidebar sem "Agenda". Sub-seção "Agendamentos" no Plano de Ação permite CRUD filtrado por applicant_id.
- **Arquivos**: `App.jsx`, `Sidebar.jsx`, `PlanoAcaoCaso.jsx`

### REQ-05: Melhorar visual da seção Mensagens
- **Critério**: Chat com balões modernos, avatar/ícone do remetente, sombra sutil, data inline.
- **Arquivo**: `MensagensCaso.jsx`, `RequerenteDetail.jsx`

### REQ-06: Adicionar tarefas no Plano de Ação
- **Critério**: Já implementado via PlanoAcaoCaso modo="assistente". Habilitado por REQ-03.

### REQ-07: Agendar Video Chamada no Plano de Ação
- **Critério**: Botão "Agendar Video Chamada" cria sala Daily.co imediatamente, exibe link + código de acesso.
- **Arquivo**: `PlanoAcaoCaso.jsx`, `RequerenteDetail.jsx`

## Fora do Escopo
- Alterações no schema do banco (sem migrations novas)
- Notificações push para videochamada agendada
- Histórico de videochamadas anteriores
