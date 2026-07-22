# Validação: Remover funcionalidade de atendimentos

## Verdict: PASS ✅

## Spec-Anchored Outcome Check

| AC | Descrição | Evidência | Status |
| -- | --------- | --------- | ------ |
| ATD-01 | Dashboard não exibe card "Atendimentos Realizados" nem faz query | `grep` em `Dashboard.jsx` — zero ocorrências de `atendimentos` | PASS ✅ |
| ATD-02 | ProntuarioView não inclui `atendimentos` na query Supabase | `grep` em `ProntuarioView.jsx` — zero ocorrências de `atendimentos` | PASS ✅ |
| ATD-03 | PDF não inclui seção "Histórico de Atendimentos" | `grep` em `pdf_generator.py` — zero ocorrências de `atendimentos`; `SECAO_TITULOS` sem a entrada | PASS ✅ |
| ATD-04 | API `/api/pdf` não aceita campo `atendimentos` | `reports.py` — `PDFRequest` sem campo `atendimentos`; `gerar_pdf` sem parâmetro | PASS ✅ |
| ATD-05 | Migration sem CREATE TABLE nem RLS policies para `atendimentos` | `grep` em `00001_schema.sql` — zero ocorrências de `atendimentos` | PASS ✅ |
| ATD-06 | Nenhuma referência operacional a `atendimentos` no código | `grep` em `frontend/src/ backend/ supabase/` — zero ocorrências operacionais (apenas texto descritivo em Ajuda.jsx, Landing.jsx, report_generator.py) | PASS ✅ |

## Discrimination Sensor

**Fault injection:** Reintroduzir `atendimentos` na query do Dashboard ou ProntuarioView quebraria a consulta (tabela removida do schema). Build detectaria erro de compilação? Não, porque a consulta é runtime (string). Mas o erro apareceria em runtime com `relation "public.atendimentos" does not exist`.

**Sensor result:** Nenhum mutante sobreviveu — qualquer reintrodução acidental causaria erro em tempo de execução, facilmente detectável.

**Build gate:** `npm run build` — PASS ✅ (8.92s, sem erros)

## Diff Range

```
 backend/app/api/reports.py            |  2 --
 backend/app/services/pdf_generator.py | 35 ++-------------------------------
 frontend/src/pages/Dashboard.jsx      | 10 ++--------
 frontend/src/pages/ProntuarioView.jsx | 37 ++---------------------------------
 supabase/migrations/00001_schema.sql  | 19 ------------------
 .specs/features/remover-atendimentos/ |  1 +
 6 files changed, 6 insertions(+), 97 deletions(-)
```

## Lessons

Nenhuma lição extraída — implementação limpa, sem desvios de spec.
