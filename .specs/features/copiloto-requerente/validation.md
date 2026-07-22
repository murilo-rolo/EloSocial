# Validation Report: Copiloto SUAS em Requerentes/:id

**Verdict: PASS** (with 1 minor display defect, 0 spec gaps)

**Diff range verified:** `10f6e19 → 4fc6d07`
- `10f6e19` — COP-01: `config.py` centralization
- `61770b1` — COP-02 + COP-03: RAG tool calling on triagem + resumo
- `0b052f0` — COP-04 + COP-05: Frontend Triagem + Resumo buttons
- `13fad38` — COP-06: ChatLLM RAG pre-fetch
- `4fc6d07` — Docs only (not verified against spec)

---

## 1. Spec-anchored coverage

| AC | File:Line | Evidence assertion | Spec-defined outcome | Covered? |
|---|---|---|---|---|
| **COP-01** | `config.py:14-17` | `GEMINI_API_KEY = os.getenv(...)` + `genai.configure(api_key=...)` | Key centralized in config.py | YES |
| COP-01 | `ai.py:8` | `from app.config import ..., GEMINI_API_KEY` | ai.py imports from config | YES |
| COP-01 | `rag.py:8` | `from app.config import ..., GEMINI_API_KEY` | rag.py imports from config | YES |
| COP-01 | `report_generator.py:7` | `from app.config import GEMINI_API_KEY` | report_generator imports from config | YES |
| COP-01 | `ocr.py:4` | `from app.config import GEMINI_API_KEY` | ocr.py imports from config | YES |
| **COP-02** | `ai.py:177` | `tools=[consultar_base_conhecimento]` on triagem model | Model has RAG tool | YES |
| COP-02 | `ai.py:180-181` | `start_chat(enable_automatic_function_calling=True)` | Auto-calling enabled | YES |
| **COP-03** | `ai.py:223` | `tools=[consultar_base_conhecimento]` on resumo model | Model has RAG tool | YES |
| COP-03 | `ai.py:226-227` | `start_chat(enable_automatic_function_calling=True)` | Auto-calling enabled | YES |
| **COP-04** | `RequerenteDetail.jsx:227-229` | `<button onClick={handleTriagemIA}>Triagem IA</button>` | Button exists | YES |
| COP-04 | `RequerenteDetail.jsx:82-86` | `fetch(\`\${apiUrl}/api/triagem\`, {body: JSON.stringify({prontuario_context: {...}})})` | Calls /api/triagem | YES |
| COP-04 | `RequerenteDetail.jsx:92-100` | `supabase.from('applicants').update({vulnerabilidade_score, vulnerabilidade_cor, vulnerabilidade_motivo})` | Saves to applicants.* | YES |
| COP-04 | `RequerenteDetail.jsx:234-239` | `<div style={{ borderLeft: \`4px solid \${...}\` }}> ... vulnerabilidade_motivo ... </div>` | Exibe na box | YES |
| **COP-05** | `RequerenteDetail.jsx:230-232` | `<button onClick={handleResumoIA}>Resumo IA</button>` | Button exists | YES |
| COP-05 | `RequerenteDetail.jsx:118-122` | `fetch(\`\${apiUrl}/api/resumo\`, ...)` | Calls /api/resumo | YES |
| COP-05 | `RequerenteDetail.jsx:480-507` | Modal with overlay: maxWidth 700, scroll, close button | Modal displayed | YES |
| COP-05 | `RequerenteDetail.jsx:498` | `navigator.clipboard.writeText(resumoResult); alert('Copiado!')` | Copy button works | YES |
| **COP-06** | `ChatLLM.jsx:15-35` | `useEffect` on `isOpen` → `fetch(\`\${apiUrl}/api/rag/query\`, ...)` | RAG pre-fetch on open | YES |
| COP-06 | `ChatLLM.jsx:32` | `setRagChunks(data.matches)` | Stores result state | YES |
| COP-06 | `ChatLLM.jsx:70-75` | `finalContext.base_conhecimento = ragChunks.map(...)` | Injects into prontuario_context | YES |
| COP-06 | `ai.py:97-111` | `base_conhecimento = req.prontuario_context.pop("base_conhecimento", None)` → `rag_section` | Backend reads injected context | YES |

All 6 ACs have **direct, traceable evidence** in code. No AC is missing.

---

## 2. Discrimination sensor (mutant simulation)

All mutants **survive** — there are zero tests exercising these endpoints (`backend/tests/` only has `test_pdf_generator.py`).

| Module | Mutant | Behavior if removed | Detection |
|---|---|---|---|
| `config.py` | Remove `genai.configure(api_key=GEMINI_API_KEY)` | All Gemini calls fail at runtime with auth error | **Surviving** — no test asserts genai is configured |
| `ai.py` triagem | Remove `tools=[consultar_base_conhecimento]` from line 177 | Triagem returns score without RAG context, silently underpowered | **Surviving** — still returns valid JSON |
| `ai.py` resumo | Remove `tools=[consultar_base_conhecimento]` from line 223 | Resumo returns summary without RAG context | **Surviving** — still returns markdown |
| `RequerenteDetail.jsx` triagem | Remove `supabase.from('applicants').update(...)` lines 92-100 | Score displayed in-memory but never persists; lost on refresh | **Surviving** — no test asserts DB state |
| `ChatLLM.jsx` | Remove `ragChunks` injection lines 70-75 | RAG pre-fetch fires but data never reaches backend; AI works without RAG | **Surviving** — chat still works, just without context |

**Result: 5/5 surviving mutants.** Risk accepted given no test suite for AI endpoints.

---

## 3. Observed defect (not in spec, but real)

**`ChatLLM.jsx:158`**: `prontuarioContext?.applicants?.nome` uses plural `applicants`, but the component is called at `RequerenteDetail.jsx:509` with `{{ applicant: requerente, ... }}` (singular). The condition never matches, so the context name is never displayed in the ChatLLM header. The functional RAG pre-fetch and context injection paths (lines 17, 69-75) correctly use `prontuarioContext.applicant`, so this is a **display-only bug** — no spec AC affected.

---

## 4. Summary

- **PASS** — all 6 ACs satisfied with direct evidence
- **5/5 surviving mutants** — no test coverage for AI endpoint behavior
- **1 display defect** in ChatLLM.jsx:158 (`applicants` → `applicant`)
