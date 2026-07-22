# Testes de Geração de PDF — Specification

## Problem Statement

As correções na geração de PDF (XML escaping, sanitização de emojis, proteção `composicao_familiar`, e error handling no frontend) foram implementadas mas não possuem cobertura de testes. Sem testes, regressões podem reintroduzir o erro 500 `POST /api/pdf`.

## Goals

- [x] Backend: testes unitários em `pdf_generator.py` cobrindo `_sanitize_text`, `_format_value`, guarda de `composicao_familiar`, e `gerar_pdf` retorna PDF válido
- [x] Frontend: testes em `ProntuarioView.jsx` cobrindo o error handling melhorado em `exportPDF`
- [x] Ambos os suites passam no gate

## Out of Scope

| Item | Motivo |
|------|--------|
| Testes de integração (rota `/api/pdf` com FastAPI TestClient) | Exigem app FastAPI completo rodando; fogem do escopo unitário |
| Testes E2E | Exigem stack completa (frontend + backend + Supabase) |

---

## Assumptions & Open Questions

| Assumption | Default | Rationale | Confirmed? |
|------------|---------|-----------|------------|
| pytest disponível para backend | Adicionaremos `pytest` como dev dependency | Necessário para rodar testes Python | y |
| Vitest já configurado no frontend | Sim, `vite.config.js` tem bloco `test` | Já usado por 6 testes existentes | y |
| `npx vitest run` executa todos os testes frontend | Sim, basta rodar o comando | Consistente com `vitest` configurado | y |
| ReportLab não instalado no CI de testes | `gerar_pdf` test será marcado `@pytest.mark.skipif` se import falhar | Evita falso negativo por dependência ausente | y |

**Open questions:** none.

---

## User Stories

### P1: PDFTEST-01 — `_sanitize_text` escapa XML e remove emojis ⭐ MVP

**User Story**: Como desenvolvedor, quero que `_sanitize_text()` escape `&`, `<`, `>`, `"` para XML e remova caracteres Unicode suplementares (ex: emojis) para que o `Paragraph` do ReportLab não lance exceção.

**Acceptance Criteria**:
1. WHEN `_sanitize_text('João & Maria')` THEN SHALL retornar `'João &amp; Maria'`
2. WHEN `_sanitize_text('<script>')` THEN SHALL retornar `'&lt;script&gt;'`
3. WHEN `_sanitize_text('👍 hello')` (emoji U+1F44D) THEN SHALL retornar `' hello'` (emoji removido)
4. WHEN `_sanitize_text('texto normal')` THEN SHALL retornar `'texto normal'` (inalterado)

---

### P1: PDFTEST-02 — `_format_value` cobre todos os tipos ⭐ MVP

**User Story**: Como desenvolvedor, quero que `_format_value()` trate corretamente None, bool, dict, list e string para que o PDF renderize cada tipo adequadamente.

**Acceptance Criteria**:
1. WHEN `_format_value(None)` THEN SHALL retornar `'—'`
2. WHEN `_format_value(True)` THEN SHALL retornar `'Sim'`
3. WHEN `_format_value(False)` THEN SHALL retornar `'Não'`
4. WHEN `_format_value({'a': 1, 'b': 2})` THEN SHALL retornar string contendo `'a: 1; b: 2'`
5. WHEN `_format_value(['x', 'y'])` THEN SHALL retornar `'x; y'`

---

### P1: PDFTEST-03 — `composicao_familiar` ignora membros não-dict sem crash ⭐ MVP

**User Story**: Como desenvolvedor, quero que `_add_secao` com `composicao_familiar` ignore membros que não são dict (ex: `None` ou string) para que dados corrompidos não derrubem o PDF.

**Acceptance Criteria**:
1. WHEN `_add_secao` recebe `composicao_familiar` com `[{"nome": "João"}, None, "invalido"]` THEN SHALL renderizar apenas o membro válido sem lançar exceção
2. WHEN `_add_secao` recebe `composicao_familiar` como lista vazia `[]` THEN SHALL exibir "Nenhum membro registrado."

---

### P1: PDFTEST-04 — `gerar_pdf` retorna buffer PDF válido ⭐ MVP

**User Story**: Como desenvolvedor, quero que `gerar_pdf()` com dados mínimos retorne um `BytesIO` cujo conteúdo comece com `%PDF` para confirmar que o pipeline de geração não quebra.

**Acceptance Criteria**:
1. WHEN `gerar_pdf({}, {}, "Profissional")` THEN SHALL retornar `BytesIO` cujo `read()` começa com `b'%PDF'`
2. WHEN `gerar_pdf` recebe dados com caracteres especiais THEN SHALL retornar PDF válido sem exceção

---

### P2: PDFTEST-05 — Frontend `exportPDF` exibe erro detail do servidor

**User Story**: Como usuário, quero ver a mensagem de erro real do servidor quando o PDF falha, para que eu possa reportar o problema com precisão.

**Acceptance Criteria**:
1. WHEN fetch retorna 500 com `{"detail": "ReportLab error"}` THEN `alert` SHALL ser chamado com `'Erro ao gerar PDF: ReportLab error'`
2. WHEN fetch retorna 500 sem `detail` THEN `alert` SHALL ser chamado com `'Erro ao gerar PDF: Erro ao gerar PDF'`
3. WHEN fetch retorna 200 com blob THEN SHALL criar um link de download

---

## Requirement Traceability

| ID | Story | Phase | Status |
|----|-------|-------|--------|
| PDFTEST-01 | P1: `_sanitize_text` | Execute | ✅ Verified |
| PDFTEST-02 | P1: `_format_value` | Execute | ✅ Verified |
| PDFTEST-03 | P1: `composicao_familiar` guard | Execute | ✅ Verified |
| PDFTEST-04 | P1: `gerar_pdf` output | Execute | ✅ Verified |
| PDFTEST-05 | P2: Frontend error handling | Execute | ✅ Verified |

**Coverage:** 5 total, 5 mapped, 0 unmapped

---

## Success Criteria

- [x] `pytest tests/` passes with 0 failures (21/21)
- [x] `npx vitest run` passes with 0 failures (35/35, 7 files)
