# Auditoria de Ações — Specification

## Problem Statement

A aba "Auditoria" no `/admin` exibe o componente e consulta a tabela `audit_logs`, mas nenhum registro é inserido — o sistema nunca audita ações. Sem trilha de auditoria, não há accountability sobre operações críticas: criação/exclusão de usuários, alterações em requerentes, atribuição de casos, conclusão de agendamentos/tarefas, geração de prontuários e upload de documentos na base de conhecimento.

## Goals

- [x] Registrar em `audit_logs` toda ação crítica listada abaixo, com usuário, timestamp e detalhes contextuais
- [x] Gerentes visualizam os registros na aba "Auditoria" imediatamente após as ações ocorrerem

## Out of Scope

| Item | Motivo |
|------|--------|
| Auditoria de leitura/consulta (ex: visualizar prontuário) | Apenas alterações são relevantes para accountability |
| Exportar logs (CSV/PDF) | A aba já exibe os dados; export é melhoria futura |
| IP do usuário | Exige infraestrutura adicional (proxy, headers); não critical para MVP |
| Tabela separada de auditoria | `audit_logs` já existe com RLS adequado |

---

## Assumptions & Open Questions

| Assumption | Default | Rationale | Confirmed? |
|------------|---------|-----------|------------|
| user_id do autor disponível no frontend via `useAuth().profile.id` | Sempre usamos `profile.id` | Consistente com toda a codebase | ✅ |
| Backend endpoints recebem `user_id` para registrar o autor | Campo opcional nos requests | Backend usa service key, não auth; precisa receber de quem chamou | ✅ |
| RLS atual é suficiente | Qualquer authenticated pode INSERT; só gerente pode SELECT | Já está em produção | ✅ |

**Open questions:** none.

---

## User Stories

### P1: AUDIT-01 — Usuário cadastrado é registrado na auditoria ⭐ MVP

**User Story**: Como gerente, quero que a criação de um novo usuário fique registrada na auditoria para que eu possa rastrear quem criou cada conta.

**Acceptance Criteria**:
1. WHEN um usuário é criado via `POST /api/users` THEN `audit_logs` SHALL conter um registro com `acao = 'criou_usuario'` e `detalhes` contendo email e perfil do novo usuário

---

### P1: AUDIT-02 — Usuário excluído é registrado na auditoria ⭐ MVP

**User Story**: Como gerente, quero que a exclusão de um usuário fique registrada na auditoria.

**Acceptance Criteria**:
1. WHEN um usuário é excluído via `DELETE /api/users/{user_id}` THEN `audit_logs` SHALL conter um registro com `acao = 'excluiu_usuario'`

---

### P1: AUDIT-03 — Alteração de status de requerente é registrada ⭐ MVP

**User Story**: Como profissional, quero que alterações no status da triagem sejam auditadas.

**Acceptance Criteria**:
1. WHEN o status de uma triagem é alterado em `RequerenteDetail.jsx` THEN `audit_logs` SHALL conter `acao = 'alterou_status_triagem'` com `detalhes` contendo `triagem_id`, `status_anterior` e `status_novo`

---

### P1: AUDIT-04 — Atribuição de assistente social é registrada ⭐ MVP

**User Story**: Como assistente social, quero que assumir ou soltar um caso fique registrado.

**Acceptance Criteria**:
1. WHEN um assistente social assume um caso THEN `audit_logs` SHALL conter `acao = 'assumiu_caso'`
2. WHEN um assistente social solta um caso THEN `audit_logs` SHALL conter `acao = 'soltou_caso'`

---

### P1: AUDIT-05 — Upload de documento na base de conhecimento é registrado ⭐ MVP

**User Story**: Como gerente, quero que todo documento adicionado à base de conhecimento da IA seja auditado.

**Acceptance Criteria**:
1. WHEN um documento é enviado via `POST /api/rag/upload` ou `/rag/upload_file` THEN `audit_logs` SHALL conter `acao = 'adicionou_documento_base_conhecimento'` com `detalhes` contendo `document_id` e `title`

---

### P1: AUDIT-06 — Triagem criada/editada é registrada ⭐ MVP

**User Story**: Como profissional, quero que a criação ou edição de uma triagem seja auditada.

**Acceptance Criteria**:
1. WHEN uma triagem é criada via `TriagemSocial.jsx` THEN `audit_logs` SHALL conter `acao = 'criou_triagem'`
2. WHEN uma triagem é editada THEN `audit_logs` SHALL conter `acao = 'editou_triagem'`

---

### P1: AUDIT-07 — Agendamento concluído é registrado ⭐ MVP

**User Story**: Como profissional, quero que a conclusão de um agendamento seja auditada.

**Acceptance Criteria**:
1. WHEN um agendamento é marcado como "Concluido" THEN `audit_logs` SHALL conter `acao = 'concluiu_agendamento'`

---

### P1: AUDIT-08 — Geração de novo prontuário é registrada ⭐ MVP

**User Story**: Como profissional, quero que a criação de um novo prontuário seja auditada.

**Acceptance Criteria**:
1. WHEN um novo prontuário é salvo via `ProntuarioEdit.jsx` THEN `audit_logs` SHALL conter `acao = 'gerou_prontuario'`

---

### P1: AUDIT-09 — Tarefa no plano de ação concluída é registrada ⭐ MVP

**User Story**: Como profissional, quero que a conclusão de uma tarefa no plano de ação seja auditada.

**Acceptance Criteria**:
1. WHEN uma tarefa é marcada como "concluido" THEN `audit_logs` SHALL conter `acao = 'concluiu_tarefa'` com `detalhes` contendo `tarefa_id` e `titulo`

---

## Edge Cases

- WHEN o insert em `audit_logs` falha (ex: RLS, rede) THEN a ação original NÃO SHALL ser interrompida — o log é fire-and-forget
- WHEN o usuário não está autenticado THEN nenhum log é inserido (não aplicável pois todas as ações exigem auth)

---

## Requirement Traceability

| ID | Story | Phase | Status |
|----|-------|-------|--------|
| AUDIT-01 | P1: Usuário cadastrado | Execute | ✅ Verified |
| AUDIT-02 | P1: Usuário excluído | Execute | ✅ Verified |
| AUDIT-03 | P1: Status requerente alterado | Execute | ✅ Verified |
| AUDIT-04 | P1: Assistente social atribuído | Execute | ✅ Verified |
| AUDIT-05 | P1: Documento base conhecimento | Execute | ✅ Verified |
| AUDIT-06 | P1: Triagem criada/editada | Execute | ✅ Verified |
| AUDIT-07 | P1: Agendamento concluído | Execute | ✅ Verified |
| AUDIT-08 | P1: Prontuário gerado | Execute | ✅ Verified |
| AUDIT-09 | P1: Tarefa plano ação concluída | Execute | ✅ Verified |

**Coverage:** 9 total, 9 mapped, 0 unmapped

---

## Success Criteria

- [x] Após cada uma das 9 ações, um registro é criado em `audit_logs` com o `user_id` do autor
- [x] A aba "Auditoria" exibe os registros sem alterações no componente (já funciona)
- [x] Nenhuma ação original é interrompida se o log falhar
