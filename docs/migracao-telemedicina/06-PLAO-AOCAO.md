# 06 — Plano de Ação

## Contexto

O plano de ação permite ao assistente social criar tarefas vinculadas ao caso e ao requerente acompanhar e atualizar o progresso. Não existe equivalente no EloSocial atual.

---

## RF — Requisitos Funcionais

### RF-01: Tabela de itens

Cada item do plano de ação possui: `id`, `caso_id` (FK triagens), `titulo`, `descricao` (opcional), `responsavel` (requerente/assistente/ambos), `prazo` (opcional), `criado_por_id`, `criado_por_tipo`, `status` (pendente/em_andamento/concluido), `created_at`, `updated_at`.

### RF-02: Componente compartilhado

Criar componente `PlanoAcaoCaso` que receba `casoId` e `modo` ('requerente' ou 'assistente').

### RF-03: Lista de tarefas

Exibir todos os itens do caso ordenados por data de criação. Cada item mostra:
- Título
- Descrição (se houver)
- Responsável (label legível)
- Prazo (se houver)
- Status com ícone visual (pendente ⏳, em_andamento 🔄, concluido ✅)

### RF-04: Atualização de status

O requerente pode clicar no indicador de status para alternar o ciclo: pendente → em_andamento → concluido → pendente.

### RF-05: Criação de tarefas (apenas assistente)

Apenas profissionais (modo `assistente`) podem criar novos itens. O formulário de criação inclui:
- Título (obrigatório)
- Descrição (opcional)
- Responsável (select: requerente/assistente/ambos)
- Prazo (date picker, opcional)

### RF-06: Página do requerente

Criar `PlanoAcaoRequerente.jsx` que:
1. Busca o caso mais recente do requerente
2. Se não existe caso → mensagem informativa
3. Se existe → renderiza `PlanoAcaoCaso` com modo `requerente` (sem formulário de criação)

### RF-07: Acesso do profissional

O profissional deve acessar o plano de ação a partir do detalhe do caso ou da videoconferência, usando o mesmo componente com modo `assistente`.

### RF-08: Atualização em tempo real

Assinar Realtime na tabela `plano_acao_itens` filtrado por `caso_id` para refletir inserções, atualizações e exclusões instantaneamente.

### RF-09: Sem exclusão para requerente

O requerente não pode excluir itens do plano. Apenas profissionais podem excluir.

---

## RNF — Requisitos Não-Funcionais

### RNF-01: Feedback visual de status

Cada status deve ter uma cor e ícone distintos para fácil identificação visual:
- Pendente: cinza/amarelo
- Em andamento: azul
- Concluído: verde (com opacidade reduzida no item inteiro)

### RNF-02: Responsividade

A lista de tarefas deve ser usável em mobile, com informações empilhadas verticalmente.

### RNF-03: Consistência

O componente deve seguir o padrão visual de cards já existente no EloSocial (`var(--bg)`, `var(--border)`, `border-radius: 12px`).
