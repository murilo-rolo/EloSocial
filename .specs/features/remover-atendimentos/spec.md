# Remover Funcionalidade de Atendimentos

## Problem Statement

A tabela `atendimentos` foi criada no schema inicial mas nunca teve UI de cadastro implementada. Ela só é lida em três lugares: Dashboard (card de contagem), ProntuarioView (exibição vazia) e exportação PDF (seção sempre vazia). O código morto gera ruído e consultas desnecessárias ao banco.

## Goals

- [ ] Remover todas as referências à tabela `atendimentos` no código frontend e backend
- [ ] Remover a tabela `atendimentos` e suas RLS policies do schema SQL
- [ ] Zero consultas ao banco para a tabela `atendimentos`

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Recriação futura da funcionalidade | Será tratada como nova feature quando necessário |
| Migração de dados | Tabela está vazia (nunca teve INSERT implementado) |

## Assumptions & Open Questions

| Decision | Chosen default | Rationale | Confirmed? |
| -------- | -------------- | --------- | ---------- |
| Tabela no banco | Remover (DROP) | Sem dados e sem código de escrita | y |
| Seção no PDF | Remover | Não faz sentido manter seção sempre vazia | y |

## User Stories

### P1: Remover atendimentos do sistema ⭐ MVP

**User Story**: Como desenvolvedor, quero remover toda referência à tabela `atendimentos` para eliminar código morto.

**Acceptance Criteria**:

1. WHEN Dashboard carrega THEN sistema SHALL não exibir card "Atendimentos Realizados" nem fazer query na tabela `atendimentos`
2. WHEN ProntuarioView carrega THEN sistema SHALL não incluir `atendimentos` na query Supabase
3. WHEN usuário exporta PDF THEN sistema SHALL não incluir seção "Histórico de Atendimentos" no PDF
4. WHEN API `/api/pdf` é chamada THEN sistema SHALL não aceitar campo `atendimentos`
5. WHEN migration é executada THEN sistema SHALL não conter CREATE TABLE nem RLS policies para `atendimentos`
6. WHEN busca por `atendimentos` no código THEN sistema SHALL não conter referências operacionais (exceto documentação)

## Requirement Traceability

| ID | Story | Phase | Status |
| -- | ----- | ----- | ------ |
| ATD-01 | P1: Dashboard | Execute | Pending |
| ATD-02 | P1: ProntuarioView query | Execute | Pending |
| ATD-03 | P1: ProntuarioView exports | Execute | Pending |
| ATD-04 | P1: ProntuarioView display | Execute | Pending |
| ATD-05 | P1: pdf_generator | Execute | Pending |
| ATD-06 | P1: reports.py | Execute | Pending |
| ATD-07 | P1: schema SQL | Execute | Pending |
