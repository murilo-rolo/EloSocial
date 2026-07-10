# 04 — Chat Caso-a-Caso

## Contexto

O EloSocial já possui `Chat.jsx` para mensagens 1:1 entre profissionais, usando a tabela `messages`. O chat caso-a-caso é uma extensão que vincula as mensagens a um caso específico de atendimento, permitindo comunicação entre requerente e assistente social.

**Referência EloSocial**: `Chat.jsx` (tabela `messages`, Realtime via `useRealtime`)

---

## RF — Requisitos Funcionais

### RF-01: Tabela separada para mensagens do caso

As mensagens caso-a-caso devem usar a nova tabela `mensagens_caso`, não a tabela `messages` existente. Isso garante isolamento entre chat de equipe e chat de atendimento.

Colunas: `id`, `caso_id` (FK triagens), `remetente_id`, `remetente_nome`, `remetente_tipo` (requerente/assistente), `texto`, `created_at`.

### RF-02: Componente compartilhado

Criar componente `MensagensCaso` que receba `casoId` e `modo` ('requerente' ou 'assistente'). Ambos os lados (requerente e profissional) usam o mesmo componente.

### RF-03: Carregamento de mensagens

Ao selecionar um caso, carregar todas as mensagens filtrando por `caso_id`, ordenadas por `created_at` ascendente.

### RF-04: Envio de mensagens

Inserir nova mensagem em `mensagens_caso` com:
- `caso_id`: ID do caso
- `remetente_id`: ID do usuário logado
- `remetente_nome`: nome do perfil
- `remetente_tipo`: 'requerente' ou 'assistente'
- `texto`: conteúdo da mensagem

### RF-05: Mensagens em tempo real

Assinar Realtime na tabela `mensagens_caso` filtrado por `caso_id` para receber mensagens novas instantaneamente.

### RF-06: Deduplicação

O componente deve evitar duplicidade de mensagens (acontece quando o INSERT retorna a mensagem e o Realtime também a entrega).

### RF-07: Página do requerente

Criar `ChatRequerente.jsx` que:
1. Busca o caso mais recente do requerente
2. Se não existe caso → exibe mensagem informativa
3. Se existe → renderiza `MensagensCaso` com modo `requerente`

### RF-08: Acesso do profissional

O profissional deve conseguir abrir o chat de um caso específico a partir do dashboard ou do detalhe do requerente, usando o mesmo componente `MensagensCaso` com modo `assistente`.

### RF-09: Atalhos de teclado

- Enter: enviar mensagem
- Shift+Enter: quebra de linha

### RF-10: Interface com identificação

Mensagens do próprio usuário alinhadas à direita (cor de destaque). Mensagens do outro à esquerda (cor neutra). Label com nome do remetente nas mensagens recebidas.

---

## RNF — Requisitos Não-Funcionais

### RNF-01: Reaproveitamento de UI

O padrão visual de bolhas de mensagem, input e auto-scroll deve ser consistente com o `Chat.jsx` existente, evitando divergência de experiência.

### RNF-02: Scroll automático

Ao receber ou enviar mensagem, a lista deve rolar automaticamente para a mensagem mais recente.

### RNF-03: Performance

A subscription Realtime deve ser limpa ao desmontar o componente ou mudar de caso, evitando memory leaks.

### RNF-04: Acessibilidade

O input de mensagem deve suportar navegação por teclado e ter labels acessíveis.
