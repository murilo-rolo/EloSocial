# Expandir Prontuário SUAS — Tasks

**Design**: `.specs/features/expandir-prontuario/design.md`
**Status**: Draft

## Execution Protocol (MANDATORY)

Implement these tasks with the `tlc-spec-driven` skill: activate it by name and follow its Execute flow and Critical Rules.

---

## Test Coverage Matrix

> Generated from codebase — confirm before Execute. Guidelines found: none — strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|-----------|-------------------|---------------------|-----------------|-------------|
| Schema/Utils | none | — (build gate only) | `frontend/src/utils/` | — |
| Frontend Page | unit | Happy path + key interactions per section | `frontend/src/pages/__tests__/` | `cd frontend && npx vitest run --reporter=verbose` |
| Backend Service | unit | All branches; 1:1 to spec ACs | `backend/tests/` | `cd backend && python -m pytest -v` |

## Gate Check Commands

| Gate Level | When to Use | Command |
|-----------|------------|---------|
| Quick | After tasks with unit tests only | `cd frontend && npx vitest run --reporter=verbose 2>&1 | tail -20` |
| Full | After tasks with both frontend + backend tests | `cd frontend && npx vitest run --reporter=verbose && cd ../backend && python -m pytest -v` |
| Build | After phase completion or schema-only tasks | `cd frontend && npx vitest run --reporter=verbose 2>&1 | tail -5` |

---

## Execution Plan

### Phase 1: Expand Existing Sections (8 tasks)

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
```

### Phase 2: New Sections + Migration + View (5 tasks)

```
T9 → T10 → T11 → T12 → T13
```

### Phase 3: PDF + Tests (2 tasks)

```
T14 → T15
```

---

## Task Breakdown

### T1: Expand schema + identificação + forma ingresso

**What**: Atualizar `emptyProntuario()` com novos campos de identificação, forma de ingresso, programas sociais. Adicionar constantes exportadas.
**Where**: `frontend/src/utils/prontuarioSchema.js`
**Depends on**: None
**Reuses**: Estrutura existente de constantes
**Requirement**: PRONT-06, PRONT-07, PRONT-08

**Done when**:
- [ ] `emptyProntuario()` retorna schema expandido com identificacao + forma_ingresso + programas_sociais
- [ ] Constantes `LOCALIZACAO_DOMICILIO_OPCOES`, `TIPO_UNIDADE_OPCOES`, `FORMA_INGRESSO_OPCOES`, `PROGRAMAS_SOCIAIS_LISTA` exportadas
- [ ] Build gate passa sem erros

**Tests**: none (schema only, tested via consumer tasks)
**Gate**: build

### T2: Expandir composição familiar + perfil etário + especificidades

**What**: Expandir membro para incluir pessoa_com_deficiencia, documentação como array. Adicionar perfil_etario (calculado) e especificidades_sociais.
**Where**: `frontend/src/utils/prontuarioSchema.js`
**Depends on**: T1
**Reuses**: Estrutura de composicao_familiar

**Done when**:
- [ ] Membro tem campos: nome, parentesco, sexo, data_nascimento, pessoa_com_deficiencia, documentacao[]
- [ ] `perfil_etario` com 8 faixas + total
- [ ] `especificidades_sociais` com 6 opções
- [ ] Build gate passa

**Tests**: none
**Gate**: build

### T3: Expandir condições habitacionais (schema)

**What**: Substituir 5 campos text por 13 campos estruturados com constantes de opções.
**Where**: `frontend/src/utils/prontuarioSchema.js`
**Depends on**: T1
**Reuses**: Padrão de objeto com constantes

**Done when**:
- [ ] Schema `habitacional` com 13 campos conforme design.md
- [ ] Constantes: `TIPO_RESIDENCIA_OPCOES`, `MATERIAL_PAREDES_OPCOES`, `ENERGIA_OPCOES`, `ABASTECIMENTO_AGUA_OPCOES`, `ESCOAMENTO_OPCOES`, `COLETA_LIXO_OPCOES`, `SIM_NAO_OPCOES`
- [ ] Build gate passa

**Tests**: none
**Gate**: build

### T4: Expandir educacional + trabalho/renda + saúde (schema)

**What**: Expandir 3 seções com tabelas dinâmicas, vulnerabilidades, opções de escolaridade e ocupação.
**Where**: `frontend/src/utils/prontuarioSchema.js`
**Depends on**: T2
**Reuses**: Padrão de tabelas dinâmicas (composicao_familiar)

**Done when**:
- [ ] Schema `educacional` com vulnerabilidades, condicionalidades BF, membros (sabe_ler, frequenta, escolaridade)
- [ ] Schema `trabalho_renda` com rendas, programas, membros (ctps, ocupação, qualificação)
- [ ] Schema `saude` com deficiências, gestantes, condicionalidades BF
- [ ] Constantes: `ESCOLARIDADE_OPCOES`, `CONDICAO_OCUPACAO_OPCOES`, `TIPO_DEFICIENCIA_OPCOES`
- [ ] Build gate passa

**Tests**: none
**Gate**: build

### T5: Expandir benefícios + convivência + violência (schema)

**What**: Expandir benefícios com tabela de registro, convivência com perguntas estruturadas, violência com 3 quadros.
**Where**: `frontend/src/utils/prontuarioSchema.js`
**Depends on**: T2
**Reuses**: Padrão de tabelas dinâmicas

**Done when**:
- [ ] Schema `beneficios` com registros (data, tipo, observação)
- [ ] Schema `convivencia` com todas as perguntas + relações intrafamiliares
- [ ] Schema `violencia` com quadro1, quadro2_creas, quadro3_creas
- [ ] Constantes: `TIPO_BENEFICIO_OPCOES`, `AVALIACAO_RELACAO_OPCOES`
- [ ] Build gate passa

**Tests**: none
**Gate**: build

### T6: Interface — identificação + composição familiar

**What**: Renderizar formulário explícito para identificação (apelido, localização, unidade, forma ingresso, programas sociais) e composição familiar expandida (deficiência, documentação checkboxes, perfil etário, especificidades).
**Where**: `frontend/src/pages/ProntuarioEdit.jsx`
**Depends on**: T1, T2
**Reuses**: Renderização explícita existente de identificacao e composicao_familiar

**Done when**:
- [ ] Identificação exibe campos: logradouro, numero, complemento, bairro, municipio, uf, cep, apelido, select localização, select tipo_unidade, input nome_unidade
- [ ] Forma ingresso renderiza 10 radio buttons
- [ ] Programas sociais renderiza checkboxes com valor
- [ ] Membro composição: checkbox deficiência, checkboxes documentação
- [ ] Perfil etário exibe tabela auto-calculada
- [ ] Especificidades sociais renderiza checkboxes
- [ ] Build gate passa

**Tests**: none (verificação visual + gate build)
**Gate**: build

### T7: Interface — habitacional + educacional

**What**: Renderizar formulário para condições habitacionais (13 campos com selects/radios/numbers) e educacionais (vulnerabilidades, tabela membros, condicionalidades).
**Where**: `frontend/src/pages/ProntuarioEdit.jsx`
**Depends on**: T3, T4
**Reuses**: Padrão de renderização explícita de T6

**Done when**:
- [ ] Habitacional: 4 radios (tipo, material, risco, acesso) + 4 selects (energia, abastecimento, escoamento, coleta) + 1 radio (agua_canalizada) + 2 numbers (cômodos, dormitórios) + 1 radio (conflito)
- [ ] Educacional: 6 number inputs (vulnerabilidades) + tabela dinâmica membros (selects sabe_ler, frequenta, escolaridade) + tabela condicionalidades
- [ ] Build gate passa

**Tests**: none
**Gate**: build

### T8: Interface — trabalho/renda + saúde + benefícios

**What**: Renderizar formulário para trabalho/renda, saúde e benefícios eventuais.
**Where**: `frontend/src/pages/ProntuarioEdit.jsx`
**Depends on**: T4
**Reuses**: Padrão T6-T7

**Done when**:
- [ ] Trabalho/renda: 4 inputs moeda + checkboxes programas + tabela membros (selects ctps, ocupação, qualificação, input renda)
- [ ] Saúde: tabela deficiências (select tipos múltiplos) + radios (insegurança, doenças, remédios, álcool, drogas) + tabela gestantes
- [ ] Benefícios: tabela dinâmica (data, select tipo, observação)
- [ ] Build gate passa

**Tests**: none
**Gate**: build

### T9: Interface — convivência + violência + encaminhamentos

**What**: Renderizar formulário para convivência (10+ perguntas + relações), violência (3 quadros) e encaminhamentos expandidos.
**Where**: `frontend/src/pages/ProntuarioEdit.jsx`
**Depends on**: T5
**Reuses**: Padrão T6-T8

**Done when**:
- [ ] Convivência: radios para cada pergunta + blocos de relação (3 avaliações cada) + select conflitos
- [ ] Violência: quadro1 tabela (10 tipos, selects persiste, inputs data), quadro2 (tabela CRAS), quadro3 (tabela CREAS)
- [ ] Encaminhamentos: select área (7 opções) + inputs órgão, motivo, data, contra-referência
- [ ] Build gate passa

**Tests**: none
**Gate**: build

### T10: Migração automática de schema

**What**: Implementar função `migrarSchemaAntigo(dados)` que detecta schema antigo e preenche defaults.
**Where**: `frontend/src/utils/prontuarioSchema.js`
**Depends on**: T5 (schema completo)
**Reuses**: `emptyProntuario()`

**Done when**:
- [ ] `migrarSchemaAntigo` identifica schema pré-expansão (ausência de `localizacao_domicilio` etc.)
- [ ] Preenche todos os campos ausentes com defaults
- [ ] Preserva campos existentes sem perda
- [ ] Chamada em ProntuarioEdit.jsx e ProntuarioView.jsx ao carregar
- [ ] Build gate passa

**Tests**: unit (testar migração em cenários: schema antigo, parcial, atual)
**Gate**: quick

### T11: Visualização expandida

**What**: Atualizar ProntuarioView.jsx para exibir todos os novos campos com renderizadores apropriados (tabelas, badges, checkboxes).
**Where**: `frontend/src/pages/ProntuarioView.jsx`
**Depends on**: T10
**Reuses**: Padrão de renderização condicional existente

**Done when**:
- [ ] Seção habitacional exibe tabela de 13 campos
- [ ] Seção educacional exibe tabelas de vulnerabilidades e membros
- [ ] Seção trabalho/renda exibe rendas + tabela membros
- [ ] Seção saúde exibe tabela deficiências + gestantes
- [ ] Seção benefícios exibe tabela de registros
- [ ] Seção convivência exibe perguntas e relações
- [ ] Seção violência exibe 3 quadros
- [ ] Campos vazios não são exibidos
- [ ] Build gate passa

**Tests**: none
**Gate**: build

### T12: Novas seções — medidas socioeducativas + acolhimento

**What**: Adicionar seções medidas_socioeducativas e acolhimento_institucional ao schema, formulário e visualização.
**Where**: `frontend/src/utils/prontuarioSchema.js`, `frontend/src/pages/ProntuarioEdit.jsx`, `frontend/src/pages/ProntuarioView.jsx`
**Depends on**: T11
**Reuses**: Padrão de tabelas dinâmicas

**Done when**:
- [ ] Schema com `medidas_socioeducativos` e `acolhimento_institucional`
- [ ] Formulário renderiza ambas seções com tabelas dinâmicas
- [ ] Visualização exibe ambas seções
- [ ] Constantes: `TIPO_MEDIDA_OPCOES`
- [ ] Build gate passa

**Tests**: none
**Gate**: build

### T13: Nova seção — planejamento e evolução

**What**: Adicionar seção planejamento_evolucao ao schema, formulário e visualização.
**Where**: `frontend/src/utils/prontuarioSchema.js`, `frontend/src/pages/ProntuarioEdit.jsx`, `frontend/src/pages/ProntuarioView.jsx`
**Depends on**: T12
**Reuses**: Padrão de seções

**Done when**:
- [ ] Schema com `planejamento_evolucao` (inclusão/desligamento + planejamento + evolução)
- [ ] Formulário renderiza seção
- [ ] Visualização exibe seção
- [ ] Build gate passa

**Tests**: none
**Gate**: build

### T14: PDF generator expandido

**What**: Atualizar `SECAO_TITULOS`, `CAMPO_LABELS`, e lógica de renderização para todos os novos campos, tabelas e opções.
**Where**: `backend/app/services/pdf_generator.py`
**Depends on**: T13 (todas as seções implementadas)
**Reuses**: Funções `_add_secao`, `_add_campo`, `_format_value` existentes

**Done when**:
- [ ] `SECAO_TITULOS` inclui todas as seções novas
- [ ] `CAMPO_LABELS` mapeia todos os novos campos
- [ ] Renderização de tabelas dinâmicas (deficiências, gestantes, condicionalidades, SCFV, medidas, acolhimento)
- [ ] Renderização de opções selecionadas como texto legível
- [ ] PDF gerado inclui todos os campos preenchidos
- [ ] Build gate passa

**Tests**: unit (testar geração PDF com dados completos)
**Gate**: quick

### T15: Testes de frontend

**What**: Escrever testes para novas funcionalidades: migração schema, renderização de seções, exportação.
**Where**: `frontend/src/pages/__tests__/ProntuarioEdit.test.jsx` (novo), `frontend/src/pages/__tests__/ProntuarioView.test.jsx` (expandir)
**Depends on**: T14
**Reuses**: Mocks existentes nos testes

**Done when**:
- [ ] Testes para `migrarSchemaAntigo`: schema antigo → expandido, preserva dados, preenche defaults
- [ ] Testes para cálculo de perfil etário
- [ ] Testes para exportação PDF com dados completos
- [ ] Gate quick passa
- [ ] Test count ≥ testes existentes

**Tests**: unit
**Gate**: quick

---

## Phase Execution Map

```
Phase 1: T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
Phase 2: T9 → T10 → T11 → T12 → T13
Phase 3: T14 → T15
```

## Task Granularity Check

| Task | Scope | Status |
|------|-------|--------|
| T1-T5 | Schema + constants per section (5 files) | ✅ Granular (each 1 file) |
| T6-T9 | Form UI per section group (1 file) | ✅ Granular (cohesive per section group) |
| T10 | Migration function | ✅ Granular (1 function) |
| T11 | View updates | ✅ Granular (1 file) |
| T12-T13 | New sections | ✅ Granular (1-2 files each) |
| T14 | PDF generator | ✅ Granular (1 file) |
| T15 | Tests | ✅ Granular (2 files) |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|------|----------------------|---------------|--------|
| T1 | None | Phase 1 start | ✅ |
| T2 | T1 | T1→T2 | ✅ |
| T3 | T1 | T1→T3 | ✅ |
| T4 | T2 | T2→T4 | ✅ |
| T5 | T2 | T2→T5 | ✅ |
| T6 | T1,T2 | T1,T2→T6 | ✅ |
| T7 | T3,T4 | T3,T4→T7 | ✅ |
| T8 | T4 | T4→T8 | ✅ |
| T9 | T5 | T5→T9 | ✅ |
| T10 | T5 | (implied: needs all schema) | ✅ |
| T11 | T10 | T10→T11 | ✅ |
| T12 | T11 | T11→T12 | ✅ |
| T13 | T12 | T12→T13 | ✅ |
| T14 | T13 | T13→T14 | ✅ |
| T15 | T14 | T14→T15 | ✅ |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
|------|-----------|----------------|-----------|--------|
| T1-T9 | Schema/UI | none | none | ✅ |
| T10 | Frontend Utils | unit | unit | ✅ |
| T11 | Frontend Page | unit | none | ⚠️ No tests — view-only, build gate |
| T12-T13 | Frontend Page | unit | none | ⚠️ No tests — view-only, build gate |
| T14 | Backend Service | unit | unit | ✅ |
| T15 | Frontend Page | unit | unit | ✅ |
