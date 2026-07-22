# Alterações BD — Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/alteracoes-bd/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec — confirm before Execute. Guidelines found: none — strong defaults applied. Existing test patterns in `frontend/src/pages/__tests__/` and `frontend/src/components/*/__tests__/`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Page Component | unit | All ACs for the page; key sections render; edge cases (empty/missing data) | `src/pages/__tests__/*.test.jsx` | `npx vitest run` |
| UI Component | unit | Key ACs (filtering, conditional rendering, display changes) | `src/components/*/__tests__/*.test.jsx` | `npx vitest run` |
| DB Migration | none | — (build gate only) | `supabase/migrations/` | — |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npx vitest run` |
| Build | After phase completion or config/entity-only tasks | `npm run build` (frontend) |

---

## Execution Plan

Phases are ordered and run sequentially — each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Database

```
T1
```

### Phase 2: Chat Privacy

```
T2
```

### Phase 3: Detalhe do Requerente

```
T3 → T4 → T5
```

### Phase 4: Plano de Ação do Requerente

```
T6
```

### Phase 5: Listagem de Requerentes

```
T7
```

---

## Task Breakdown

### T1: Create RLS migration for chat privacy

**What**: Create `00005_chat_privado_rls.sql` — new RLS policy on `mensagens_caso` so professionals see only messages where they are `remetente_id` or `destinatario_id`, and fill `destinatario_id` retroactively for existing professional messages.

**Where**: `supabase/migrations/00005_chat_privado_rls.sql`

**Depends on**: None

**Reuses**: Existing policy patterns from `00003_chat_requerente_rls.sql`

**Requirement**: BD-01

**Done when**:

- [ ] Migration drops old SELECT policy on `mensagens_caso`
- [ ] Migration fills NULL `destinatario_id` on professional messages: `UPDATE ... SET destinatario_id = (SELECT user_id FROM triagens WHERE id = caso_id) WHERE destinatario_id IS NULL AND remetente_tipo = 'assistente'`
- [ ] Migration creates new SELECT policy: `remetente_id = auth.uid() OR destinatario_id = auth.uid()`
- [ ] Migration preserves INSERT and UPDATE policies unchanged
- [ ] SQL is syntactically valid (no errors if run manually)

**Tests**: none
**Gate**: build

---

### T2: Update MensagensCaso to use destinatario_id

**What**: Modify `MensagensCaso.jsx` to accept `applicantUserId` prop, filter messages by current user's `remetente_id`/`destinatario_id`, and set `destinatario_id` when sending.

**Where**: `frontend/src/components/caso/MensagensCaso.jsx`

**Depends on**: None

**Reuses**: Existing chat UI, `useRealtime` hook, `supabase` client

**Requirement**: BD-01

**Done when**:

- [ ] New prop `applicantUserId` accepted (string | null)
- [ ] Send: `destinatario_id` is set to `applicantUserId` when `modo === 'assistente'`
- [ ] Fetch: query includes `.or(`remetente_id.eq.${profileId},destinatario_id.eq.${profileId}`)` filter
- [ ] RLS change from T1 ensures DB-level filtering too
- [ ] Tests: messages render correctly for professional (filtered to own), and for requester (existing ChatCaso behavior unaffected)
- [ ] Gate check passes: `npx vitest run`

**Tests**: unit
**Gate**: quick

---

### T3: Add DocumentosCaso section to RequerenteDetail

**What**: Add a "Documentos" section in `RequerenteDetail.jsx` that renders `<DocumentosCaso>` filtered to show only documents uploaded by the requester. Add optional `filtroTipo` prop to `DocumentosCaso.jsx`.

**Where**: `frontend/src/pages/RequerenteDetail.jsx`, `frontend/src/components/caso/DocumentosCaso.jsx`

**Depends on**: None

**Reuses**: Existing `DocumentosCaso` component, Supabase query patterns

**Requirement**: BD-02

**Done when**:

- [ ] `DocumentosCaso.jsx` accepts optional prop `filtroTipo` ('requerente' | 'assistente' | null)
- [ ] When `filtroTipo` is set, query adds `.eq('uploaded_by_tipo', filtroTipo)`
- [ ] `RequerenteDetail.jsx` renders `<DocumentosCaso casoId={caso.id} modo="assistente" filtroTipo="requerente" />` in a "Documentos" section
- [ ] When no documents exist, shows "Nenhum documento enviado"
- [ ] Tests: section renders with filtered documents; empty state shows message
- [ ] Gate check passes: `npx vitest run`

**Tests**: unit
**Gate**: quick

---

### T4: Remove priority from RequerenteDetail and DashboardRequerente

**What**: Remove priority badge and pencil icon from `RequerenteDetail.jsx`. Remove priority badge from `DashboardRequerente.jsx`. Keep the `prioridade` column in the database and scoring algorithm unchanged.

**Where**: `frontend/src/pages/RequerenteDetail.jsx`, `frontend/src/pages/DashboardRequerente.jsx`

**Depends on**: None

**Reuses**: N/A — removal only

**Requirement**: BD-03

**Done when**:

- [ ] `RequerenteDetail.jsx`: priority badge and pencil icon no longer render (professional or not)
- [ ] `DashboardRequerente.jsx`: priority badge no longer renders
- [ ] Database `triagens.prioridade` column untouched
- [ ] `triagemScoring.js` algorithm untouched
- [ ] Tests: priority badge not present in DOM for either page
- [ ] Gate check passes: `npx vitest run`

**Tests**: unit
**Gate**: quick

---

### T5: Add triagem info section in RequerenteDetail

**What**: Add a "Dados da Triagem" section in `RequerenteDetail.jsx` that displays relevant fields from `triagens.dados_acolhimento` JSONB (contato, motivo, urgência, relato/sintomas).

**Where**: `frontend/src/pages/RequerenteDetail.jsx`

**Depends on**: None

**Reuses**: `getDados()` pattern (from `DashboardRequerente.jsx`), `dados_acolhimento` JSONB structure

**Requirement**: BD-06

**Done when**:

- [ ] Section "Dados da Triagem" renders in `RequerenteDetail.jsx` below the Status badges
- [ ] Displays: contato (telefone, bairro), motivo (demanda_principal), urgência (nível), sintomas/relato
- [ ] When `dados_acolhimento` is null/empty, shows "Nenhuma triagem realizada"
- [ ] Data extraction follows same pattern as `DashboardRequerente.jsx` (`getDados()` helper or inline)
- [ ] Tests: section renders with triagem data; empty state shows message
- [ ] Gate check passes: `npx vitest run`

**Tests**: unit
**Gate**: quick

---

### T6: Show agendamentos in PlanoAcaoCaso for requester mode

**What**: Modify `PlanoAcaoCaso.jsx` to show agendamentos for `modo='requerente'` (currently gated to `modo='assistente'`). Pass `applicantId` prop from `DashboardRequerente.jsx`. Allow requester to confirm attendance or cancel appointments.

**Where**: `frontend/src/components/caso/PlanoAcaoCaso.jsx`, `frontend/src/pages/DashboardRequerente.jsx`

**Depends on**: None

**Reuses**: Existing agendamentos section UI, action buttons pattern (Concluir/Cancelar for professional)

**Requirement**: BD-04

**Done when**:

- [ ] `PlanoAcaoCaso.jsx`: gate `modo === 'assistente'` that hides agendamentos is removed or extended to also show for `modo === 'requerente'`
- [ ] `DashboardRequerente.jsx`: passes `applicantId` prop to `<PlanoAcaoCaso>`
- [ ] Requester can see agendamentos listed with date/time, tipo, status
- [ ] Requester can click "Confirmar Presença" (sets status to `Concluido`) or "Cancelar" (sets status to `Cancelado`)
- [ ] When no agendamentos: shows "Nenhum agendamento ou ação pendente"
- [ ] Tests: agendamentos render in requester mode; action buttons work
- [ ] Gate check passes: `npx vitest run`

**Tests**: unit
**Gate**: quick

---

### T7: Reformular Requerentes list columns and remove inline status edit

**What**: Change table columns in `Requerentes.jsx` from "Requerente Principal | Contato | Triagem | Ações" to "Requerente | Contato | Status | Assistente Social". Remove inline status change dropdown. Fetch `assistente_social_id` from `triagens` and join `profiles` to display the professional's name (or "Ausente").

**Where**: `frontend/src/pages/Requerentes.jsx`

**Depends on**: None

**Reuses**: Existing data fetching pattern (load applicants → load triagens → build triagensMap), Supabase join query for profiles

**Requirement**: BD-05, BD-07

**Done when**:

- [ ] Column headers: "Requerente" (nome), "Contato" (telefone), "Status" (status da triagem com badge colorido), "Assistente Social" (nome do profissional ou "Ausente")
- [ ] "Assistente Social" column fetches `profiles.nome` via FK `triagens.assistente_social_id`
- [ ] When `assistente_social_id` is null, shows "Ausente"
- [ ] No inline status edit UI (dropdown/pencil) in the list page
- [ ] "Ações" column removed (eye icon to detail is now implicit in the row link or inline)
- [ ] Tests: columns render correctly; "Ausente" shows when no AS assigned; no status edit controls present
- [ ] Gate check passes: `npx vitest run`

**Tests**: unit
**Gate**: quick

---

## Phase Execution Map

```
Phase 1:  T1 (RLS migration)
Phase 2:  T2 (MensagensCaso chat privacy)
Phase 3:  T3 (Documentos section) → T4 (Remove priority) → T5 (Triagem section)
Phase 4:  T6 (Agendamentos no Plano de Ação)
Phase 5:  T7 (Requerentes list columns)
```

Execution is strictly sequential — each phase completes before the next begins, and tasks within a phase execute in order.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Create RLS migration | 1 file (SQL) | ✅ Granular |
| T2: Update MensagensCaso | 1 component | ✅ Granular |
| T3: Add DocumentosCaso section | 2 files, cohesive (component + detail page) | ✅ Granular |
| T4: Remove priority UI | 2 pages, same concern (removal) | ✅ Granular |
| T5: Add triagem section | 1 page | ✅ Granular |
| T6: Show agendamentos for requester | 2 files, cohesive (component + dashboard) | ✅ Granular |
| T7: Reformular list columns | 1 page | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | No incoming arrows | ✅ Match |
| T2 | None | No incoming arrows | ✅ Match |
| T3 | None | No incoming arrows | ✅ Match |
| T4 | None | No incoming arrows | ✅ Match |
| T5 | None | No incoming arrows | ✅ Match |
| T6 | None | No incoming arrows | ✅ Match |
| T7 | None | No incoming arrows | ✅ Match |

All tasks are independent (no cross-task dependencies) — they modify different files or different sections of the same file without conflict.

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: RLS migration | DB Migration | none | none | ✅ OK |
| T2: MensagensCaso chat | UI Component | unit | unit | ✅ OK |
| T3: Documentos section | Page + UI Component | unit | unit | ✅ OK |
| T4: Remove priority | Page Component | unit | unit | ✅ OK |
| T5: Triagem section | Page Component | unit | unit | ✅ OK |
| T6: Agendamentos for requester | Page + UI Component | unit | unit | ✅ OK |
| T7: List columns | Page Component | unit | unit | ✅ OK |
