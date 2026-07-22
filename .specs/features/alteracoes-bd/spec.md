# Alterações BD — Specification

## Problem Statement

O sistema possui 6 pontos que precisam de alterações no banco de dados e/ou interface: privacidade do chat (mensagens visíveis a todos os profissionais), exibição de documentos do requerente no dossiê, remoção da prioridade da interface, exibição de agendamentos no Plano de Ação do requerente, reformulação das colunas da listagem de requerentes, e remoção da mudança de status na listagem.

## Out of Scope

| Item | Razão |
|------|-------|
| Remoção da coluna `prioridade` do banco | Decidido: manter no DB e no scoring, remover apenas da UI |
| Alterações no algoritmo de scoring da triagem | Decidido: manter scoring inalterado |
| Reestruturação de rotas backend | Todas as alterações são RLS + frontend |

---

## Assumptions & Open Questions

| Decisão | Escolha | Rationale | Confirmado |
|---------|---------|-----------|------------|
| Chat: requerente também filtrado | Requerente vê apenas mensagens com o profissional selecionado | Privacidade simétrica em ambos os lados | ✅ |
| Coluna "Motivo" na listagem | Não exibir. Colunas: Requerente \| Contato \| Status \| Assistente Social | Simplifica a listagem | ✅ |
| Prioridade: remover só da UI | Manter no banco e no scoring | Decisão reversível sem perda de dados | ✅ |
| Agendamentos no Plano de Ação: interativo | Requerente pode confirmar presença, cancelar | Experiência completa para o requerente | ✅ |
| Mudança de status: remover da listagem, manter no detalhe | Lápis permanece no detalhe (`/requerentes/:id`) | Status editável apenas no dossiê | ✅ |

---

## User Stories

### P1: Chat privado por profissional ⭐ MVP

**User Story**: Como profissional, quero ver apenas minhas trocas de mensagens com o requerente, sem ver mensagens de outros profissionais, para garantir privacidade do atendimento.

**Acceptance Criteria**:

1. WHEN um profissional acessa o chat do caso THEN o sistema SHALL exibir apenas mensagens onde ele é o `remetente_id` ou `destinatario_id`
2. WHEN um requerente acessa o ChatCaso THEN o sistema SHALL exibir apenas mensagens entre ele e o profissional selecionado
3. WHEN um profissional envia mensagem THEN o sistema SHALL salvar com `destinatario_id` = id do requerente
4. WHEN o requerente envia mensagem THEN o sistema SHALL salvar com `destinatario_id` = id do profissional alvo da conversa

**Independent Test**: Criar 2 profissionais, cada um troca mensagens com o requerente. Cada profissional vê apenas suas próprias mensagens. Requerente vê as mensagens separadas por profissional.

**Requirement IDs**: BD-01

---

### P1: Seção Documentos em /requerentes/:id ⭐ MVP

**User Story**: Como profissional, quero ver os documentos enviados pelo requerente diretamente no dossiê dele, sem precisar ir a outra tela.

**Acceptance Criteria**:

1. WHEN acesso `/requerentes/:id` THEN o sistema SHALL exibir uma seção "Documentos" com os arquivos onde `uploaded_by_tipo = 'requerente'`
2. WHEN o requerente faz upload de um documento THEN ele SHALL aparecer automaticamente na seção de documentos (tempo real)
3. WHEN o requerente não enviou documentos THEN o sistema SHALL exibir "Nenhum documento enviado"

**Independent Test**: Como requerente, enviar um documento. Como profissional, ver o documento aparecer na seção do dossiê.

**Requirement IDs**: BD-02

---

### P1: Remover prioridade da interface ⭐ MVP

**User Story**: Como profissional e requerente, não quero mais ver o campo de prioridade nas telas do caso.

**Acceptance Criteria**:

1. WHEN acesso `/requerentes/:id` (profissional) THEN o sistema SHALL NÃO exibir o campo de prioridade
2. WHEN acesso o Dashboard do requerente THEN o sistema SHALL NÃO exibir prioridade
3. WHEN uma triagem é concluída THEN o sistema SHALL continuar calculando prioridade internamente no scoring

**Independent Test**: Acessar a interface do profissional e do requerente — prioridade não aparece em nenhum lugar.

**Requirement IDs**: BD-03

---

### P1: Agendamentos no Plano de Ação ⭐ MVP

**User Story**: Como requerente, quero ver meus agendamentos dentro do Plano de Ação para ter uma visão unificada do acompanhamento.

**Acceptance Criteria**:

1. WHEN acesso o Plano de Ação como requerente THEN o sistema SHALL exibir os agendamentos (`agendamentos`) como itens da lista
2. WHEN clico em um agendamento THEN o sistema SHALL permitir confirmar presença ou cancelar
3. WHEN não há agendamentos THEN o sistema SHALL exibir "Nenhum agendamento ou ação pendente"

**Independent Test**: Profissional agenda uma data. Requerente vê o agendamento no Plano de Ação e pode confirmar/cancelar.

**Requirement IDs**: BD-04

---

### P1: Reformular colunas da listagem ⭐ MVP

**User Story**: Como profissional, quero ver na listagem de requerentes as colunas "Requerente | Contato | Status | Assistente Social".

**Acceptance Criteria**:

1. WHEN acesso `/requerentes` THEN o sistema SHALL exibir as colunas: Requerente (nome), Contato (telefone), Status (status da triagem), Assistente Social (nome do vinculado ou "Ausente")
2. WHEN não há `assistente_social_id` no caso THEN o sistema SHALL exibir "Ausente" na coluna
3. WHEN o status do caso é `null` THEN o sistema SHALL exibir um valor padrão (ex: "Pendente")

**Independent Test**: Acessar a listagem com casos com e sem assistente social vinculado — colunas corretas e valores esperados.

**Requirement IDs**: BD-05

---

### P1: Seção de triagem no detalhe ⭐ MVP

**User Story**: Como profissional, quero ver as informações da triagem do requerente dentro do dossiê dele.

**Acceptance Criteria**:

1. WHEN acesso `/requerentes/:id` THEN o sistema SHALL exibir uma seção com os dados da triagem (extraídos de `triagens.dados_acolhimento`)
2. WHEN o requerente ainda não fez triagem THEN o sistema SHALL exibir "Nenhuma triagem realizada"

**Independent Test**: Acessar o dossiê de um requerente com e sem triagem — seção exibe dados quando existe, mensagem quando não.

**Requirement IDs**: BD-06

---

### P2: Remover mudança de status da listagem

**User Story**: Como profissional, quero alterar o status do requerente apenas no dossiê, não na listagem.

**Acceptance Criteria**:

1. WHEN acesso `/requerentes` THEN o sistema SHALL NÃO exibir controle de alteração de status por linha
2. WHEN acesso `/requerentes/:id` THEN o sistema SHALL manter o lápis/botão de editar status

**Independent Test**: Acessar a listagem — sem dropdown/select de status por linha. Acessar o detalhe — lápis presente.

**Requirement IDs**: BD-07

---

## Edge Cases

- WHEN a triagem não existe para o requerente THEN a seção de triagem no detalhe SHALL exibir "Nenhuma triagem realizada"
- WHEN não há assistente social atribuído THEN a coluna na listagem SHALL exibir "Ausente"
- WHEN o requerente não enviou documentos THEN a seção de documentos no detalhe SHALL exibir "Nenhum documento enviado"
- WHEN não há agendamentos THEN a seção de Plano de Ação SHALL exibir "Nenhum agendamento ou ação pendente"
- WHEN o requerente tenta ver mensagens de um profissional com quem nunca trocou mensagens THEN o chat SHALL exibir lista vazia

---

## Requirement Traceability

| ID | Story | Phase | Status |
|----|-------|-------|--------|
| BD-01 | Chat privado por profissional | Specified | Pending |
| BD-02 | Seção Documentos no detalhe | Specified | Pending |
| BD-03 | Remover prioridade da interface | Specified | Pending |
| BD-04 | Agendamentos no Plano de Ação | Specified | Pending |
| BD-05 | Reformular colunas da listagem | Specified | Pending |
| BD-06 | Seção triagem no detalhe | Specified | Pending |
| BD-07 | Remover mudança de status da listagem | Specified | Pending |
