# Expandir Prontuário SUAS

## Problem Statement

O formulário de prontuário SUAS atual armazena a maioria das seções como campos de texto livre genéricos, enquanto o PDF oficial do Prontuário SUAS define dezenas de campos estruturados com opções selecionáveis, tabelas dinâmicas e códigos padronizados. Isso força o profissional a digitar texto livre onde deveria selecionar opções, reduz a consistência dos dados e impede análise quantitativa.

## Goals

- [ ] Expandir schema do `dados_json` para cobrir 100% dos campos do PDF oficial
- [ ] Substituir campos de texto livre por controles apropriados (select, radio, checkbox, tabelas dinâmicas)
- [ ] Migrar prontuários existentes ao serem reabertos (schema antigo → novo)
- [ ] Atualizar visualização e exportação PDF para refletir os novos campos

## Out of Scope

| Item | Reason |
|------|--------|
| Novas tabelas no banco (relacionais) | `dados_json` JSONB já cumpre o papel; sem migrations de schema |
| Histórico de versões de schema | Versão atual já rastreia `versao`; migração única no frontend |
| Tradução/i18n | Sistema é mono-idioma (PT-BR) |
| OCR/scanner de prontuário físico | Escopo separado |

## Assumptions & Open Questions

| Assumption | Chosen default | Rationale | Confirmed? |
|-----------|---------------|-----------|------------|
| Schema antigo vs novo | Migrar ao salvar | Prontuários antigos mantêm schema antigo até reabertura | y |
| Campos calculados | Armazenar no JSON | perfil_etário, pessoas/dormitório calculados e salvos | y |
| Códigos vs texto nas opções | Armazenar texto | Consistente com formato atual (ex: "Pessoa de Referência") | y |
| Forma de ingresso | Texto legível (não código) | Consistente com decisão de armazenar texto | y |

## User Stories

### P1: Schema expandido cobre seções existentes

**User Story**: Como profissional do CRAS, quero preencher as condições habitacionais, educacionais, trabalho/renda e saúde com campos estruturados (selects, radios, checkboxes) para registrar dados consistentes.

**Acceptance Criteria**:

1. PRONT-01 WHEN profissional abre seção "Condições Habitacionais" THEN sistema SHALL exibir campos estruturados (tipo_residencia, material_paredes, energia_eletrica, agua_canalizada, abastecimento_agua, escoamento_sanitario, coleta_lixo, total_comodos, dormitorios, area_risco, acesso_dificil, conflito_violencia) com opções do PDF oficial
2. PRONT-02 WHEN profissional abre seção "Condições Educacionais" THEN sistema SHALL exibir tabelas de vulnerabilidade por faixa etária + tabela por membro (sabe_ler, frequenta_escola, escolaridade com 16 códigos)
3. PRONT-03 WHEN profissional abre seção "Trabalho e Rendimento" THEN sistema SHALL exibir campos de renda (total e per capita, com/ssem programas sociais) + tabela por membro (CTPS, condição ocupação, qualificação)
4. PRONT-04 WHEN profissional abre seção "Condições de Saúde" THEN sistema SHALL exibir tabela de deficiências, insegurança alimentar, doenças graves, gestantes, uso de álcool/drogas
5. PRONT-05 WHEN profissional preenche composição familiar THEN sistema SHALL calcular e exibir perfil etário automaticamente

### P1: Identificação e ingresso expandidos

**Acceptance Criteria**:

6. PRONT-06 WHEN profissional abre "Identificação" THEN sistema SHALL exibir campo apelido, localização domicílio (Urbano/Rural), tipo unidade (CRAS/CREAS)
7. PRONT-07 WHEN profissional abre "Forma de Ingresso" THEN sistema SHALL exibir 10 opções de acesso (demanda espontânea, busca ativa, encaminhamentos PSB/PSE/Saúde/Educação/Conselho Tutelar/Judiciário/SGD/Outros) como radio buttons
8. PRONT-08 WHEN profissional registra programas sociais THEN sistema SHALL exibir checkboxes para Bolsa Família, BPC, PETI, Outros com campo de valor

### P1: Benefícios, convivência e violência expandidos

**Acceptance Criteria**:

9. PRONT-09 WHEN profissional abre "Benefícios Eventuais" THEN sistema SHALL exibir tabela de registro com data, tipo (Natalidade/Funeral), observação
10. PRONT-10 WHEN profissional abre "Convivência Familiar" THEN sistema SHALL exibir perguntas estruturadas (dependentes, discriminação, tempo residência, rede apoio, relações intrafamiliares) com opções Sim/Não e avaliações de conflito
11. PRONT-11 WHEN profissional abre "Violência e Violação de Direitos" THEN sistema SHALL exibir QUADRO 1 (10 tipos + persiste? + data), QUADRO 2 (CREAS) e QUADRO 3 (Indício/Confirmada)

### P1: Encaminhamentos expandidos

12. PRONT-12 WHEN profissional adiciona encaminhamento THEN sistema SHALL exibir campo área (7 opções: Outra Unidade/Saúde/Educação/INSS/Habitação/Defensoria/Outra) como select + órgão destino + motivo + data + contra-referência

### P2: Novas seções

13. PRONT-13 WHEN profissional acessa "Medidas Socioeducativas" THEN sistema SHALL exibir tabela com tipo (6 códigos), processo, datas, acompanhamento CREAS
14. PRONT-14 WHEN profissional acessa "Acolhimento Institucional" THEN sistema SHALL exibir tabela por membro (período, motivo) + guarda + prisão + internação
15. PRONT-15 WHEN profissional acessa "Planejamento e Evolução" THEN sistema SHALL exibir registro de inclusão/desligamento PAIF/PAEFI + planejamento inicial + evolução

### P2: Migração automática

16. PRONT-16 WHEN profissional abre prontuário existente (schema antigo) THEN sistema SHALL migrar campos automaticamente para o novo schema antes de exibir

### P2: Visualização e PDF

17. PRONT-17 WHEN profissional visualiza prontuário THEN sistema SHALL exibir todos os novos campos estruturados
18. PRONT-18 WHEN profissional exporta PDF THEN sistema SHALL incluir todos os novos campos no layout oficial

## Edge Cases

- WHEN prontuário antigo sem alguns campos THEN migração SHALL preencher vazios com defaults
- WHEN composição familiar vazia THEN perfil etário SHALL exibir todos zeros
- WHEN nenhuma opção selecionada em radio/checkbox THEN SHALL salvar como vazio/null
- WHEN tabela dinâmica vazia THEN SHALL exibir "Nenhum registro"

## Requirement Traceability

| ID | Story | Phase | Status |
|----|-------|-------|--------|
| PRONT-01 | P1: Schema expandido | Fase 1 | Pending |
| PRONT-02 | P1: Schema expandido | Fase 1 | Pending |
| PRONT-03 | P1: Schema expandido | Fase 1 | Pending |
| PRONT-04 | P1: Schema expandido | Fase 1 | Pending |
| PRONT-05 | P1: Schema expandido | Fase 1 | Pending |
| PRONT-06 | P1: Identificação | Fase 1 | Pending |
| PRONT-07 | P1: Identificação | Fase 1 | Pending |
| PRONT-08 | P1: Identificação | Fase 1 | Pending |
| PRONT-09 | P1: Benefícios/Convivência | Fase 1 | Pending |
| PRONT-10 | P1: Benefícios/Convivência | Fase 1 | Pending |
| PRONT-11 | P1: Benefícios/Convivência | Fase 1 | Pending |
| PRONT-12 | P1: Encaminhamentos | Fase 1 | Pending |
| PRONT-13 | P2: Novas seções | Fase 2 | Pending |
| PRONT-14 | P2: Novas seções | Fase 2 | Pending |
| PRONT-15 | P2: Novas seções | Fase 2 | Pending |
| PRONT-16 | P2: Migração | Fase 2 | Pending |
| PRONT-17 | P2: Visualização | Fase 2 | Pending |
| PRONT-18 | P2: PDF | Fase 3 | Pending |

## Success Criteria

- [ ] Profissional consegue preencher todos os campos do PDF oficial sem digitar texto livre
- [ ] Dados estruturados permitem análise quantitativa futura
- [ ] Prontuários antigos migram sem perda ao serem reabertos
- [ ] PDF exportado reflete fielmente o layout oficial
