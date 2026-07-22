# Tasks — Auditoria de Ações

## Execution Plan

**Total tasks:** 8 (fits single batch — execute inline)

**Dependency graph:**
- T1 (utility) ← foundation for T4..T8
- T2, T3 (backend) — independent of T1, independent of each other
- T4..T8 (frontend) — depend on T1, independent of each other

**Execution order:** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8

---

## T1: Criar utilitário de auditoria frontend

**ID:** AUDIT-UTIL
**Files:** `frontend/src/utils/audit.js`, `frontend/src/utils/__tests__/audit.test.js`
**Depends on:** none
**Phase:** Foundation
**Tests:** Unit (vitest)
**Gate:** Quick

**Implementation:**
- Criar `auditLog(userId, acao, detalhes)` que chama `supabase.from('audit_logs').insert({ user_id, acao, detalhes })`
- Tratar erro com `console.error` sem lançar exceção (fire-and-forget)
- Importar de `../lib/supabase`

**Done when:**
- [ ] `audit.js` exporta `auditLog` function
- [ ] Função é fire-and-forget (não lança erro se Supabase falhar)
- [ ] Teste unitário verifica que `supabase.from('audit_logs').insert` é chamado com os parâmetros corretos

**Gate check:**
```bash
cd frontend && npx vitest run src/utils/__tests__/audit.test.js --reporter=verbose
```

---

## T2: Auditoria backend — users_admin.py (AUDIT-01, AUDIT-02)

**ID:** AUDIT-BE-USER
**Files:** `backend/app/api/users_admin.py`
**Depends on:** none
**Phase:** Backend
**Tests:** none (verification via Python syntax check)
**Gate:** Build (backend)

**Implementation:**
- No endpoint `POST /api/users`: aceitar campo opcional `created_by` no body, após criar usuário no Supabase Auth, inserir registro em `audit_logs` via service key com `acao = 'criou_usuario'`
- No endpoint `DELETE /api/users/{user_id}`: aceitar `created_by` como query param opcional (ou header), após deletar, inserir registro com `acao = 'excluiu_usuario'`
- Usar `httpx.post` diretamente no REST API do Supabase (mesmo padrão do `rag.py`)

**Done when:**
- [ ] `POST /api/users` insere audit_log com `acao = 'criou_usuario'`
- [ ] `DELETE /api/users/{user_id}` insere audit_log com `acao = 'excluiu_usuario'`
- [ ] Log não interrompe fluxo se falhar

**Gate check:**
```bash
cd backend && python -c "import ast; ast.parse(open('app/api/users_admin.py').read()); print('OK')"
```

---

## T3: Auditoria backend — rag.py (AUDIT-05)

**ID:** AUDIT-BE-RAG
**Files:** `backend/app/api/rag.py`
**Depends on:** none
**Phase:** Backend
**Tests:** none (verification via Python syntax check)
**Gate:** Build (backend)

**Implementation:**
- Em `upload_document()` (após inserir documento e obter `doc_id`), inserir registro em `audit_logs` via service key com `acao = 'adicionou_documento_base_conhecimento'`, `detalhes` contendo `{ document_id: doc_id, title: req.title }`

**Done when:**
- [ ] `POST /api/rag/upload` insere audit_log com `acao = 'adicionou_documento_base_conhecimento'`
- [ ] `POST /api/rag/upload_file` (que delega para upload_document) também gera log

**Gate check:**
```bash
cd backend && python -c "import ast; ast.parse(open('app/api/rag.py').read()); print('OK')"
```

---

## T4: Auditoria frontend — Admin.jsx (toggleStatus, changeRole)

**ID:** AUDIT-FE-ADMIN
**Files:** `frontend/src/pages/Admin.jsx`
**Depends on:** T1
**Phase:** Frontend
**Tests:** none (verificação via build)
**Gate:** Build (frontend)

**Implementation:**
- Importar `auditLog` de `../utils/audit`
- Em `toggleUserStatus`: chamar `auditLog(profile.id, 'alterou_status_requerente', { profile_id: userId, ativo: !currentStatus })`
- Em `changeRole`: chamar `auditLog(profile.id, 'alterou_perfil', { profile_id: userId, role_anterior: u.role, role_nova: newRole })` — precisa capturar role anterior

**Done when:**
- [ ] `toggleUserStatus` gera audit_log após ativar/desativar
- [ ] `changeRole` gera audit_log após alterar perfil

**Gate check:**
```bash
cd frontend && npx vitest run --reporter=verbose 2>&1 | tail -20
```

---

## T5: Auditoria frontend — RequerenteDetail.jsx (AUDIT-03, AUDIT-04)

**ID:** AUDIT-FE-REQDETAIL
**Files:** `frontend/src/pages/RequerenteDetail.jsx`
**Depends on:** T1
**Phase:** Frontend
**Tests:** none (verificação via build)
**Gate:** Build (frontend)

**Implementation:**
- Importar `auditLog` de `../utils/audit`
- Em `handleUpdateStatus`: capturar `status_anterior` (caso?.status) antes do update, chamar `auditLog(profile.id, 'alterou_status_triagem', { triagem_id: caso.id, status_anterior, status_novo: newStatus })`
- Em `handleAssumirCaso`: chamar `auditLog(profile.id, 'assumiu_caso', { triagem_id: caso.id })`
- Em `handleSoltarCaso`: chamar `auditLog(profile.id, 'soltou_caso', { triagem_id: caso.id })`

**Done when:**
- [ ] Alteração de status de triagem gera audit_log
- [ ] Assumir caso gera audit_log
- [ ] Soltar caso gera audit_log

**Gate check:**
```bash
cd frontend && npx vitest run --reporter=verbose 2>&1 | tail -20
```

---

## T6: Auditoria frontend — TriagemSocial.jsx (AUDIT-06)

**ID:** AUDIT-FE-TRIAGEM
**Files:** `frontend/src/pages/TriagemSocial.jsx`
**Depends on:** T1
**Phase:** Frontend
**Tests:** none (verificação via build)
**Gate:** Build (frontend)

**Implementation:**
- Importar `auditLog` de `../utils/audit`
- Em `handleSubmit`: determinar se é criação ou edição (`triagemId` presente), após o `supabase.from('triagens').insert/update` bem-sucedido, chamar `auditLog(profile.id, triagemId ? 'editou_triagem' : 'criou_triagem', { ... })`

**Done when:**
- [ ] Criação de triagem gera audit_log
- [ ] Edição de triagem gera audit_log

**Gate check:**
```bash
cd frontend && npx vitest run --reporter=verbose 2>&1 | tail -20
```

---

## T7: Auditoria frontend — PlanoAcaoCaso.jsx (AUDIT-07, AUDIT-09)

**ID:** AUDIT-FE-PLANO
**Files:** `frontend/src/components/caso/PlanoAcaoCaso.jsx`
**Depends on:** T1
**Phase:** Frontend
**Tests:** none (verificação via build)
**Gate:** Build (frontend)

**Implementation:**
- Importar `auditLog` de `../../utils/audit`
- Em `handleUpdateAgendamentoStatus`: quando `newStatus === 'Concluido'`, chamar `auditLog(profile.id, 'concluiu_agendamento', { agendamento_id: id })`
- Em `handleToggleStatus`: quando `newStatus === 'concluido'`, chamar `auditLog(profile.id, 'concluiu_tarefa', { tarefa_id: item.id, titulo: item.titulo, caso_id: casoId })`

**Done when:**
- [ ] Conclusão de agendamento gera audit_log
- [ ] Conclusão de tarefa gera audit_log (apenas quando status vira 'concluido')

**Gate check:**
```bash
cd frontend && npx vitest run --reporter=verbose 2>&1 | tail -20
```

---

## T8: Auditoria frontend — ProntuarioEdit.jsx (AUDIT-08)

**ID:** AUDIT-FE-PRONT
**Files:** `frontend/src/pages/ProntuarioEdit.jsx`
**Depends on:** T1
**Phase:** Frontend
**Tests:** none (verificação via build)
**Gate:** Build (frontend)

**Implementation:**
- Importar `auditLog` de `../utils/audit`
- Em `handleSave`: quando é INSERT (não `isEditing`), após o insert bem-sucedido, chamar `auditLog(profile.id, 'gerou_prontuario', { applicant_id: applicantId, versao: 1 })`

**Done when:**
- [ ] Criação de novo prontuário gera audit_log
- [ ] Edição de prontuário NÃO gera log (apenas novos)

**Gate check:**
```bash
cd frontend && npx vitest run --reporter=verbose 2>&1 | tail -20
```

---

## Gate Check Commands

| Gate level | Command |
|------------|---------|
| Quick | `cd frontend && npx vitest run src/utils/__tests__/audit.test.js --reporter=verbose` |
| Build (frontend) | `cd frontend && npx vitest run --reporter=verbose` |
| Build (backend) | `cd backend && python -c "import ast; ast.parse(open('app/api/users_admin.py').read()); print('users_admin OK')" && python -c "import ast; ast.parse(open('app/api/rag.py').read()); print('rag OK')"` |
| Full (final) | Run Build (frontend) + Build (backend) + `cd frontend && npx vite build 2>&1 | tail -5` |

---

## Test Coverage Matrix

| Layer | Coverage Expectation | Tool |
|-------|---------------------|------|
| Utility (audit.js) | Unit test: mock supabase insert, verify params, verify fire-and-forget | vitest |
| Backend endpoints | Syntax check, manual verification pattern | Python ast |
| Frontend components | No regression (existing tests pass) | vitest |
