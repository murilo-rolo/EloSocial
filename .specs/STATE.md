# STATE.md — Project Memory

## Decisions

### AD-001: Triagem Status Realtime

**Date:** 2026-07-22
**Status:** Implemented ✅

**Problem:** Status da triagem não atualizava em tempo real na página de detalhe do requerente.

**Decision:**
- Exibir `caso.status` e `caso.prioridade` como badges coloridos dentro do card "Dados do Requerente" em `RequerenteDetail.jsx`, seguindo o mesmo padrão visual de `DashboardRequerente.jsx`
- Adicionar `useRealtime` subscription para `triagens` (qualquer evento) em `RequerenteDetail.jsx`
- Adicionar `useRealtime` subscription para `applicants` (`UPDATE`) em `RequerenteDetail.jsx` e `Requerentes.jsx`
- Sem botão de refresh manual (apenas real-time)
- Sem integração com endpoint `/api/triagem` para popular parecer IA

**Files changed:**
- `frontend/src/pages/RequerenteDetail.jsx`
- `frontend/src/pages/Requerentes.jsx`
- `frontend/src/pages/__tests__/RequerenteDetail.test.jsx`
- `.specs/features/triagem-status-realtime/spec.md`
- `.specs/features/triagem-status-realtime/validation.md`

**Evidence:** Build passes, 22/22 tests pass, all ACs verified.

---

### AD-002: Triagem Status Update

**Date:** 2026-07-22
**Status:** Implemented ✅

**Problem:** Assistente social não tinha UI para alterar o status e prioridade da triagem.

**Decision:**
- Adicionar ícone ✏️ ao lado dos badges de status e prioridade em `RequerenteDetail.jsx` que abre dropdown inline
- Confirmação modal apenas para status "Concluído" e "Cancelado"
- Controles visíveis apenas para perfis profissionais (non-requerente)
- Adicionar dropdown de status rápido na coluna "Triagem" da lista `/requerentes`
- Lista carrega triagens dos applicants exibidos e mantém real-time subscription

**Files changed:**
- `frontend/src/pages/RequerenteDetail.jsx`
- `frontend/src/pages/Requerentes.jsx`
- `frontend/src/pages/__tests__/RequerenteDetail.test.jsx`
- `.specs/STATE.md`

**Evidence:** Build passes, 26/26 tests pass, all ACs verified.

**Post-implementation fix:** Added migration `00004_triagem_status_em_acompanhamento.sql` to add `'em_acompanhamento'` to the DB CHECK constraint — it was missing from the original schema, causing saves to fail silently.

---

### AD-003: Auditoria de Ações

**Date:** 2026-07-22
**Status:** Implemented ✅

**Problem:** A aba "Auditoria" em `/admin` consultava a tabela `audit_logs` mas nenhum código escrevia nela — auditoria vazia e sem função.

**Decision:**
- Abordagem híbrida: função utilitária `auditLog()` no frontend via Supabase client + inserts via service key nos endpoints backend
- 9 ações auditadas: criação/exclusão de usuário, status de triagem, atribuição de caso, upload de documento base IA, criação/edição de triagem, conclusão de agendamento, geração de prontuário, conclusão de tarefa
- Fire-and-forget: erros de log não interrompem a ação original
- Ações do frontend disparam `auditLog()` após sucesso; endpoints backend (users_admin, rag) usam `httpx.post` para Supabase REST

**Files changed:**
- `frontend/src/utils/audit.js`
- `frontend/src/utils/__tests__/audit.test.js`
- `frontend/src/pages/Admin.jsx`
- `frontend/src/pages/RequerenteDetail.jsx`
- `frontend/src/pages/TriagemSocial.jsx`
- `frontend/src/pages/ProntuarioEdit.jsx`
- `frontend/src/components/caso/PlanoAcaoCaso.jsx`
- `backend/app/api/users_admin.py`
- `backend/app/api/rag.py`
- `.specs/features/auditoria-acoes/spec.md`
- `.specs/features/auditoria-acoes/tasks.md`
- `.specs/features/auditoria-acoes/validation.md`

**Evidence:** Build passes, 32/32 tests pass, 9/9 ACs verified by independent Verifier.

---

## Handoff

No active work. All features complete.
