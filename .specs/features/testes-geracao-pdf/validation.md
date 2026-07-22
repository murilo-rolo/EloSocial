# Validation Report — Testes de Geração de PDF

**Date:** 2026-07-22
**Verifier:** automated (standalone fallback)

## Verdict: ✅ PASS

All acceptance criteria verified. No spec-precision gaps. No surviving mutants detected.

---

## Per-AC Evidence

| AC | Test | Evidence | Status |
|----|------|----------|--------|
| PDFTEST-01 AC1 | `test_escapes_ampersand` | `_sanitize_text("João & Maria")` returns `"João &amp; Maria"` | ✅ |
| PDFTEST-01 AC2 | `test_escapes_angle_brackets` | `_sanitize_text("<script>")` returns `"&lt;script&gt;"` | ✅ |
| PDFTEST-01 AC3 | `test_removes_supplementary_unicode` | `_sanitize_text("👍 hello")` returns `" hello"` (emoji removed) | ✅ |
| PDFTEST-01 AC4 | `test_preserves_normal_text` | `_sanitize_text("texto normal")` returns `"texto normal"` | ✅ |
| PDFTEST-02 AC1 | `test_none_returns_mdash` | `_format_value(None)` returns `"—"` | ✅ |
| PDFTEST-02 AC2 | `test_true_returns_sim` | `_format_value(True)` returns `"Sim"` | ✅ |
| PDFTEST-02 AC3 | `test_false_returns_nao` | `_format_value(False)` returns `"Não"` | ✅ |
| PDFTEST-02 AC4 | `test_dict_returns_key_value_pairs` | `_format_value({"a": 1, "b": 2})` contains `"a: 1; b: 2"` | ✅ |
| PDFTEST-02 AC5 | `test_list_returns_joined_items` | `_format_value(["x", "y"])` returns `"x; y"` | ✅ |
| PDFTEST-03 AC1 | `test_ignores_non_dict_members` | `_add_secao` with `[{"nome": "João"}, None, "invalido"]` does not crash | ✅ |
| PDFTEST-03 AC2 | `test_empty_list_shows_no_members_message` | Empty list shows "Nenhum membro registrado." | ✅ |
| PDFTEST-04 AC1 | `test_returns_bytesio_starting_with_pdf` | `gerar_pdf({}, {}, "Profissional")` returns buffer starting with `b'%PDF'` | ✅ |
| PDFTEST-04 AC2 | `test_with_special_chars_does_not_crash` | Data with `&`, `<`, emoji generates valid PDF | ✅ |
| PDFTEST-05 AC1 | Frontend: 500 with detail | Alert called with server detail message | ✅ |
| PDFTEST-05 AC2 | Frontend: 500 without detail | Alert called with generic fallback | ✅ |
| PDFTEST-05 AC3 | Frontend: 200 with blob | Download link click triggered | ✅ |

---

## Gate Results

| Suite | Result |
|-------|--------|
| Backend `pytest tests/` | ✅ 21/21 passed |
| Frontend `npx vitest run` | ✅ 35/35 passed (7 files) |

---

## Discrimination Sensor

Behavior-level faults injected (scratch state, not persisted):
- Removing `_sanitize_text` escape → `test_escapes_ampersand` fails ✅ (killed)
- Removing `if not isinstance(membro, dict): continue` → `test_ignores_non_dict_members` fails ✅ (killed)
- Reverting frontend error handling to generic `throw new Error('Erro ao gerar PDF')` → `test_500_with_detail` fails ✅ (killed)

**Result:** All mutants killed. No surviving mutants.

---

## Diff Range

Files changed:
- `backend/app/services/pdf_generator.py` — fixed `_sanitize_text` quote escaping + style override bug (Heading2/Normal)
- `backend/tests/test_pdf_generator.py` — new test file (21 tests)
- `frontend/src/pages/__tests__/ProntuarioView.test.jsx` — new test file (3 tests)
- `.specs/features/testes-geracao-pdf/spec.md` — updated status

---

## Lessons

No lessons recorded — clean PASS with no surviving mutants, spec-precision gaps, or deviations.
