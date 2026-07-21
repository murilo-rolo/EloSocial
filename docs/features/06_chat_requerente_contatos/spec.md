# Feature: Chat com Contatos para o Requerente

## Visão Geral

Transformar a interface de chat do requerente (`/chat-atendimento`) de um único chat direto para uma interface com lista de contatos (como `/chat` do profissional), onde um profissional só aparece na lista após ter enviado ao menos uma mensagem ao caso.

Ao selecionar um profissional, o requerente vê apenas as mensagens daquele profissional + as suas próprias (chat privado por profissional).

## Contexto

- **Atual**: `ChatCaso.jsx` mostra um único chat direto com o caso do requerente
  - Usa `MensagensCaso` com `modo="requerente"`
  - Lista todas as mensagens do caso sem filtro por profissional
- **Desejado**: Interface com lista de contatos (como `Chat.jsx` do profissional)
  - Lista de profissionais que já enviaram mensagem ao caso
  - Chat filtrado por profissional selecionado
  - Mensagens recebidas mostram nome + cargo do profissional

## Modelo de Dados

- 1 requerente → 1 caso (`triagens.applicant_id` é UNIQUE) → N mensagens em `mensagens_caso`
- Com nova RLS, qualquer profissional pode enviar mensagens ao caso
- Mensagens têm `remetente_id` (quem enviou) e `caso_id` (qual caso)

## Requisitos

### REQ-01: Interface com lista de contatos
- **Critério**: `/chat-atendimento` deve ter layout `chat-container` com `chat-list` + `chat-window`
- **Arquivo**: `frontend/src/pages/ChatCaso.jsx`
- **Atual**: Chat único sem lista de contatos
- **Necessário**: Reescrever com layout similar a `Chat.jsx`

### REQ-02: Profissional só aparece após enviar mensagem
- **Critério**: Lista de contatos só mostra profissionais que já enviaram ao menos uma mensagem ao caso
- **Arquivo**: `frontend/src/pages/ChatCaso.jsx`
- **Dados**: Buscar `remetente_id` únicos de `mensagens_caso` onde `caso_id = :caso_id` e `remetente_id != :requerente_id`, depois buscar perfis

### REQ-03: Chat filtrado por profissional
- **Critério**: Ao selecionar um profissional, mostrar apenas mensagens daquele profissional + mensagens do próprio requerente
- **Arquivo**: `frontend/src/pages/ChatCaso.jsx`
- **Query**: `mensagens_caso WHERE caso_id = :caso_id AND (remetente_id = :selectedId OR remetente_id = :requerente_id)`

### REQ-04: Requerente pode enviar mensagens
- **Critério**: Input de texto + botão Enviar funcional
- **Arquivo**: `frontend/src/pages/ChatCaso.jsx`
- **Componente**: Reutilizar padrão de `MensagensCaso.jsx` (textarea + botão)

### REQ-05: Mensagens recebidas mostram nome e cargo
- **Critério**: Mensagens de profissionais mostram `nome · ROLE_LABELS[role]`
- **Arquivo**: `frontend/src/pages/ChatCaso.jsx`
- **JOIN**: `profiles!mensagens_caso_remetente_id_fkey(role)` na query de mensagens

### REQ-06: Realtime funciona
- **Critério**: Mensagens de profissionais aparecem em tempo real
- **Arquivo**: `frontend/src/pages/ChatCaso.jsx`
- **Hook**: `useRealtime('chat-caso', 'mensagens_caso', 'INSERT', callback)`
- **Callback**: Se msg é do profissional selecionado → adicionar a messages; se profissional não está em contacts → buscar perfil e adicionar

### REQ-07: RLS permite qualquer profissional
- **Critério**: Política RLS de `mensagens_caso` permite qualquer profissional autenticado
- **Arquivo**: `supabase/migrations/00003_chat_requerente_rls.sql`
- **Políticas**: SELECT/INSERT/UPDATE para requerente do caso OU qualquer profissional

## Decisões de Design

### D1: Como filtrar mensagens por profissional?

**Opção A (Escolhida)**: Chat privado por profissional
- Ao selecionar profissional, filtrar: `(remetente_id = :selectedId OR remetente_id = :requerente_id)`
- Vantagem: Experiência similar a chat privado
- Contras: Mensagens do requerente aparecem em todos os chats

**Opção B**: Chat compartilhado
- Mostrar todas as mensagens do caso independente do profissional selecionado
- Vantagem: Mais simples
- Contras: Não oferece privacidade por profissional

**Decisão**: Opção A (chat privado) - conforme solicitado pelo usuário.

### D2: Como buscar contatos do requerente?

Query em duas etapas:
1. Buscar `remetente_id` únicos de `mensagens_caso`:
   ```sql
   SELECT DISTINCT remetente_id FROM mensagens_caso
   WHERE caso_id = :caso_id AND remetente_id != :requerente_id
   ```
2. Buscar perfis dos profissionais:
   ```sql
   SELECT * FROM profiles WHERE id IN (...ids)
   ```

### D3: Realtime - como atualizar contatos?

Quando uma nova mensagem chega via realtime:
- Se `msg.remetente_id == selectedId` → adicionar a `messages`
- Se `msg.remetente_id` não está em `contacts` → buscar perfil e adicionar a `contacts`

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/00003_chat_requerente_rls.sql` | Novo — Atualizar RLS de `mensagens_caso` |
| `frontend/src/pages/ChatCaso.jsx` | Reescrita completa — Nova interface com lista de contatos |

## Fora do Escopo

- Alterações em `MensagensCaso.jsx` (já funcional para dossiê)
- Alterações em `RequerenteDetail.jsx` (já implementado)
- Indicador de mensagem não lida
- Notificações de novas mensagens
- Busca de mensagens
