# Validation Report — rag-quota-handling

**Date:** 2026-07-22
**Verifier:** Standalone (fresh-eyes after commit)
**Commit:** `bedac3b`

## Spec-Anchored Outcome Check

| AC | Test evidence | Asserted outcome | Spec-defined outcome | Status |
|---|---|---|---|---|
| AC-01 | `tests/test_rag.py:22` — `mock_embed.assert_called_once_with(content=["texto"])` | Single call with list | 1 call with N texts | ✅ |
| AC-02 | `tests/test_rag.py:28` — `assert len(result) == 3` | len == 3 | Returns list[list[float]] with len == N | ✅ |
| AC-03 | `tests/test_rag.py:37` — `assert result == []` | `[]` | `[]` + no API call | ✅ |
| AC-04 | `tests/test_rag.py:47` — `assert result == [0.1, 0.2, 0.3]` | Returns embedding | Returns embedding immediately | ✅ |
| AC-05 | `tests/test_rag.py:61-63` — `assert result == [0.42]`, `mock_embed.call_count == 3`, `mock_sleep.call_count == 2` | Succeeds on retry | 3 calls, 2 sleeps | ✅ |
| AC-06 | `tests/test_rag.py:72` — `assert exc_info.value.status_code == 429` | status=429 | HTTP 429 with "Gemini" | ✅ |
| AC-07 | `tests/test_rag.py:83` — `assert "Retry-After" in e.headers` | Header present | `Retry-After` header | ✅ |

**Spec-precision gaps:** None.

## Gate Check

**Command:** `.venv/Scripts/python.exe -m pytest tests/ -v`
**Result:** 28 passed, 0 failed (21 existing + 7 new)
**Exit code:** 0

## Discrimination Sensor

| Mutant | Fault injected | Verdict | Killing tests |
|---|---|---|---|
| 1 — Disable batch | Loops per chunk instead of single call | **KILLED** | `test_embeds_single_text`, `test_embeds_multiple_texts_in_one_call` |
| 2 — Remove retry | No try/except in `_embed_with_retry` | **KILLED** | `test_retries_on_resource_exhausted_then_succeeds`, `test_raises_429_when_all_retries_exhausted`, `test_includes_retry_after_header_on_exhaustion` |
| 3 — Replace 429 with 200 | `HTTPException(200)` instead of 429 | **KILLED** | `test_raises_429_when_all_retries_exhausted` |

**Surviving mutants:** None.

## Diff Range

```
bedac3b fix(rag): batch embedding and retry on Gemini quota exhaustion
  backend/app/api/rag.py   | +54 -26
  backend/tests/test_rag.py | +75 -0
```

## Verdict

**PASS** ✅ — All acceptance criteria covered with spec-anchored assertions. All 3 mutants killed. No discrimination gaps.
