# Plano de Implementação — Chat Requerente com Direcionamento

## Status: CONCLUÍDO

## Visão Geral

Reescrever a interface de chat do requerente (`/chat-atendimento`) para exibir uma lista de contatos (profissionais que já enviaram mensagem ao caso) com chat filtrado por profissional. Mensagens do requerente são direcionadas implicitamente ao profissional cujo chat está selecionado — não aparecem em todos os chats.

## Alteração Central

Adicionar coluna `destinatario_id` na tabela `mensagens_caso`. Quando o requerente envia uma mensagem estando no chat do Profissional A, `destinatario_id` recebe o ID do Profissional A. Mensagens de profissionais para o requerente ficam com `destinatario_id` igual a `NULL`.

**Filtro de mensagens (antes):**

```
WHERE caso_id = :id AND (remetente_id = :selected OR remetente_id = :requerente)
```

**Filtro de mensagens (depois):**

```
WHERE caso_id = :id
  AND (remetente_id = :selected
       OR (remetente_id = :requerente AND destinatario_id = :selected))
```

## Tarefas

### Tarefa 1 — Migration ✅

**Arquivo:** `supabase/migrations/00003_chat_requerente_rls.sql`
**Commit:** `b71839a`

- Adicionar coluna `destinatario_id UUID REFERENCES profiles(id) ON DELETE SET NULL` na tabela `mensagens_caso`
- Criar índice `idx_mensagens_caso_destinatario` na coluna `destinatario_id`
- Atualizar políticas RLS de `mensagens_caso`:
  - **SELECT:** permitir a qualquer profissional autenticado ler mensagens de casos (não apenas o assistente social vinculado ao caso)
  - **INSERT:** permitir a qualquer profissional autenticado inserir mensagens em casos
  - **UPDATE:** permitir a qualquer profissional autenticado atualizar mensagens de casos
- Manter as políticas existentes para o requerente (vinculado ao caso via `triagens.user_id`)

### Tarefa 2 — ChatCaso.jsx ✅

**Arquivo:** `frontend/src/pages/ChatCaso.jsx`
**Commit:** `34f169c`

Reescrever completamente o componente com layout similar ao `Chat.jsx` do profissional.

**Funcionalidades:**

- **Lista de contatos:** buscar `remetente_id` distintos de `mensagens_caso` onde `caso_id = :id` e `remetente_id != :requerente_id`, depois buscar perfis dos profissionais
- **Chat filtrado:** ao selecionar um profissional, buscar mensagens com filtro `remetente_id = :selected OR (remetente_id = :requerente AND destinatario_id = :selected)`
- **Envio de mensagens:** incluir `destinatario_id = selectedContact.id` no insert
- **Realtime:** quando nova mensagem chegar via realtime:
  - Se `msg.remetente_id == selectedId` → adicionar a `messages`
  - Se `msg.remetente_id` não está em `contacts` → buscar perfil e adicionar a `contacts`
- **UI:** seguir padrão `chat-container` / `chat-list` / `chat-window` do `Chat.jsx`
- **Mensagens recebidas:** mostrar nome e cargo do profissional (`nome · ROLE_LABELS[role]`)

### Tarefa 3 — Atualização do Spec ✅

**Arquivo:** `docs/features/06_chat_requerente_contatos/spec.md`
**Commit:** `f17f8fa`

- Atualizar D1: refletir nova lógica de filtro com `destinatario_id`
- Atualizar D2: mencionar `destinatario_id` na consulta de contatos
- Adicionar D3: explicação do direcionamento de mensagens
- Renumerar D3 → D4: Realtime
- Atualizar REQ-03: query atualizada com filtro por `destinatario_id`
- Atualizar "Arquivos Afetados" para incluir a migration

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/00003_chat_requerente_rls.sql` | Nova migration — coluna `destinatario_id` + RLS atualizada |
| `frontend/src/pages/ChatCaso.jsx` | Reescrita completa — nova interface com lista de contatos |
| `docs/features/06_chat_requerente_contatos/spec.md` | Atualização do spec |

## Fora do Escopo

- Alterações em `MensagensCaso.jsx` — componente usado pelo lado profissional (`RequerenteDetail.jsx`), que não precisa de `destinatario_id` (mensagens ficam com `NULL`)
- Alterações em `RequerenteDetail.jsx`
- Indicador de mensagem não lida
- Notificações de novas mensagens
- Busca de mensagens

## Decisões Técnicas

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Direcionamento da mensagem | Implícito pelo chat selecionado | UX mais simples, não requer seleção explícita de destinatário |
| `destinatario_id` para profissional→requerente | `NULL` | Só há um requerente por caso, não é necessário direcionar |
| `MensagensCaso.jsx` | Sem alterações | Componente usado pelo lado profissional, que não precisa de `destinatario_id` |
| RLS | Qualquer profissional autenticado | Permite que múltiplos profissionais participem do caso |
