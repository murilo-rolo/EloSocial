# Triagem Status Realtime Specification

## Problem Statement

Na página `/requerentes/:id`, o status da triagem (`triagens.status`) não é exibido e, mesmo que fosse, nunca atualizaria porque os dados são carregados uma única vez no mount do componente. O assistente social precisa ver o status atual do caso e vê-lo mudar em tempo real quando outro profissional ou o sistema atualiza.

## Goals

- [x] Exibir o status atual da triagem (com badge colorido) e prioridade na página de detalhe do requerente
- [x] Atualizar automaticamente o status das triagens em tempo real nas páginas onde aparece
- [x] Atualizar automaticamente os campos de vulnerabilidade (parecer IA) em tempo real

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Criar UI para assistente alterar status | Feature separada — aqui só exibição e reatividade |
| Histórico de mudanças de status | Sem suporte no schema atual |
| Notificações push | Sem infraestrutura |
| Botão de refresh manual | User opted for real-time only |
| Popular parecer IA via /api/triagem | User opted to keep scope limited to status display |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Posição do status | Dentro do card "Dados do Requerente", após parecer IA | User confirmed "continue nos lugares onde aparece" | y |
| Formato de exibição | Badge colorido (padrão do sistema como DashboardRequerente) | User confirmed | y |
| Refresh manual | Não — apenas real-time | User confirmed "só real-time, sem botão" | y |
| Popular parecer IA | Não incluso | User confirmed "não, só o status" | y |

---

## Acceptance Criteria

### TS-01: Exibir status da triagem em RequerenteDetail

WHEN um requerente possui um caso (triagem) THEN o sistema SHALL exibir um badge colorido com o label do status (ex: "Pendente", "Em Atendimento") dentro do card "Dados do Requerente".

WHEN o caso possui prioridade THEN o sistema SHALL exibir um badge "Prioridade ALTA/MEDIA/BAIXA" ao lado do badge de status.

WHEN o caso é nulo THEN o sistema SHALL não exibir os badges de status nem prioridade.

### TS-02: Real-time para triagens em RequerenteDetail

WHEN o status ou prioridade de uma triagem é alterado no banco THEN o sistema SHALL atualizar os badges exibidos sem refresh manual da página.

### TS-03: Real-time para applicants em RequerenteDetail e Requerentes

WHEN os campos `vulnerabilidade_score`, `vulnerabilidade_cor` ou `vulnerabilidade_motivo` são alterados no banco THEN o sistema SHALL atualizar a exibição correspondente sem refresh manual.

---

## Requirement Traceability

| ID | Description | Status |
| -- | ----------- | ------ |
| TS-01 | Exibir status + prioridade em RequerenteDetail | Verified |
| TS-02 | Real-time triagens em RequerenteDetail | Verified |
| TS-03 | Real-time applicants em RequerenteDetail + Requerentes | Verified |

---

## Success Criteria

- [x] Badges de status e prioridade aparecem no card "Dados do Requerente"
- [x] Mudanças no banco refletem na UI sem refresh manual
- [x] Build passa sem erros
