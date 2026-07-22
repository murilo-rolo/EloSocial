# Triagem Status Update Specification

## Problem Statement

Assistente social vê o status da triagem em tempo real, mas não tem UI para alterá-lo. O RLS já permite, mas falta a interface.

## Goals

- [x] Permitir que profissional altere status da triagem via detail page
- [x] Permitir que profissional altere prioridade via detail page
- [x] Ocultar controles de edição para requerentes
- [x] Permitir alteração rápida de status na lista de requerentes

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Página de listagem de triagens pendentes | Feature separada |
| Histórico de mudanças de status | Sem suporte no schema |
| Notificações ao requerente | Sem infraestrutura |
| Transições proibidas entre status | Pode ser v2 |

---

## Acceptance Criteria

### TS-01: Profissional altera status pelo detail page
WHEN profissional está em `/requerentes/:id` e caso existe THEN sistema SHALL exibir ✏️ ao lado do badge de status
WHEN profissional clica no ✏️ THEN sistema SHALL exibir dropdown com status válidos
WHEN profissional seleciona "Concluído" ou "Cancelado" THEN sistema SHALL exibir confirmação antes de persistir

### TS-02: Profissional altera prioridade pelo detail page
WHEN profissional está em `/requerentes/:id` THEN sistema SHALL exibir ✏️ ao lado do badge de prioridade
WHEN profissional seleciona nova prioridade THEN sistema SHALL persistir sem confirmação

### TS-03: Requerente não vê controles
WHEN perfil logado é `requerente` THEN sistema SHALL ocultar ícones de edição

### TS-04: Profissional altera status pela lista
WHEN profissional está em `/requerentes` THEN cada linha com caso deve ter dropdown de status rápido

---

## Requirement Traceability

| ID | Description | Status |
| -- | ----------- | ------ |
| TS-01 | Editar status no detail page | Verified |
| TS-02 | Editar prioridade no detail page | Verified |
| TS-03 | Ocultar para requerente | Verified |
| TS-04 | Editar status na lista | Verified |
