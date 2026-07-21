# Validation Report — 02_aba_de_ajuda

## Verdict: PASS

**Date:** 2026-07-20
**Commits:** `4d9d319` → `93af515` (3 commits)
**Diff range:** `4d9d319..93af515`

---

## Per-AC Evidence

| AC | Spec-defined outcome | Evidence | Covered? |
|----|---------------------|----------|----------|
| AC-01: /ajuda renders inside `<Layout>` with title "Ajuda" | Page renders with Layout wrapper and title | `Ajuda.jsx:88` — `<Layout title="Ajuda">` | ✅ Yes |
| AC-02: Professional sees 10 sections | 10 sections rendered for non-requerente roles | `Ajuda.jsx:10-21` — `professionalSections` array has 10 entries; `Ajuda.jsx:68` — `sections.map(...)` | ✅ Yes |
| AC-03: Gerente sees same 10 sections including Admin | Admin section present in professional array | `Ajuda.jsx:20` — `{ title: 'Admin', ... }` in `professionalSections` | ✅ Yes |
| AC-04: Requerente sees 6 sections | 6 sections rendered for requerente role | `Ajuda.jsx:23-30` — `requesterSections` array has 6 entries; `Ajuda.jsx:68` — conditional via `isRequerente()` | ✅ Yes |
| AC-05: All sections collapsed by default | `openIndex` initialized to `null` | `Ajuda.jsx:72` — `useState(null)` | ✅ Yes |
| AC-06: Click toggles expand/collapse | `handleToggle` toggles `openIndex` | `Ajuda.jsx:74-76` — toggles between `null` and `index` | ✅ Yes |
| AC-07: Expanded section shows title, description, dashed placeholder | Content structure matches | `Ajuda.jsx:48-57` — title + description + dashed-border div with "Screenshot da página aqui" | ✅ Yes |
| AC-08: Unauthenticated redirect to /login | Route wrapped in `<ProtectedRoute>` | `App.jsx:66` — `<ProtectedRoute><Ajuda /></ProtectedRoute>` | ✅ Yes |
| AC-09: Sidebar shows "Ajuda" for professionals | HelpCircle link in professional array | `Sidebar.jsx:27` — `{ to: '/ajuda', label: 'Ajuda', icon: <HelpCircle size={20} /> }` | ✅ Yes |
| AC-10: Sidebar shows "Ajuda" for requerentes | HelpCircle link in requerente array | `Sidebar.jsx:17` — `{ to: '/ajuda', label: 'Ajuda', icon: <HelpCircle size={20} /> }` | ✅ Yes |
| AC-11: Click navigates to /ajuda | NavLink to="/ajuda" | `Sidebar.jsx:17,27` — `to: '/ajuda'` | ✅ Yes |
| AC-12: Active link highlighted on /ajuda | NavLink isActive class toggle | `Sidebar.jsx:46` — `className={({ isActive }) => isActive ? 'active' : ''}` | ✅ Yes |

---

## Build Gate

| Check | Result |
|-------|--------|
| `npm run build` | ✅ Pass (0 errors) |
| Framework de testes | N/A (não configurado no projeto) |

---

## Test Adequacy

**Note:** Project has no test framework configured. Validation performed via build verification and manual code review against spec ACs.

| Check | Result |
|-------|--------|
| Check A — Sufficient coverage | ⚠️ No automated tests — coverage verified by code inspection |
| Check B — Non-shallow litmus | N/A (no tests) |
| Check C — Necessary | N/A (no tests) |
| Check D — Guideline conformance | N/A (no test guidelines) |

---

## Discrimination Sensor

Not applicable — no automated test suite to inject faults into.

---

## Files Changed

| File | Action |
|------|--------|
| `frontend/src/pages/Ajuda.jsx` | Created (98 lines) |
| `frontend/src/App.jsx` | Modified (+2 lines: import + route) |
| `frontend/src/components/Layout/Sidebar.jsx` | Modified (+3 lines: import + 2 links) |
