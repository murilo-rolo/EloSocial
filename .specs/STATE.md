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

---

## Handoff

No active work. All features complete.
