# Feature: Chat com Requerente

## Visão Geral

Integrar funcionalidade de chat entre profissional e requerente diretamente na página de dossiê do requerente (`/requerentes/:id`), melhorar a exibição de informações do remetente na interface do requerente, e restringir o chat entre profissionais (`/chat`) para excluir requerentes da lista de contatos.

## Contexto

- **Chat profissional-profissional** (`/chat`): Usa tabela `messages`, lista TODOS os perfis como contatos (incluindo requerentes).
- **Chat caso** (`/chat-atendimento`): Usa tabela `mensagens_caso`, já funciona para requerentes mas não exibe a função/cargo de quem enviou a mensagem.
- **Dossiê do requerente** (`/requerentes/:id`): Página do profissional com dados, prontuários e ferramentas de IA, mas SEM chat direto com o requerente.

## Requisitos

### REQ-01: Requerentes não devem aparecer no chat entre profissionais
- **Critério**: A lista de contatos em `/chat` deve excluir usuários com `role = 'requerente'`
- **Arquivo**: `frontend/src/pages/Chat.jsx`
- **Atual**: Query carrega todos os perfis (`supabase.from('profiles').select('*').neq('id', profile?.id)`)
- **Necessário**: Adicionar filtro `.neq('role', 'requerente')`

### REQ-02: Chat com requerente na página do dossiê
- **Critério**: O profissional deve conseguir enviar e receber mensagens do requerente diretamente na página `/requerentes/:id`
- **Arquivo**: `frontend/src/pages/RequerenteDetail.jsx`
- **Componente**: Reutilizar `MensagensCaso` com `modo="assistente"`
- **Dados necessários**: Buscar o `triagens` (caso) vinculado ao requerente (`applicant_id = :id`) para obter o `caso_id`
- **Interface**: Adicionar seção de chat abaixo dos prontuários, dentro de um card similar aos existentes

### REQ-03: Exibir função/cargo de quem enviou mensagem no chat do requerente
- **Critério**: Na interface do requerente (`/chat-atendimento`), as mensagens recebidas devem mostrar o nome E a função do profissional que enviou
- **Arquivo**: `frontend/src/components/caso/MensagensCaso.jsx`
- **Atual**: Mostra apenas `remetente_nome` (linha 111)
- **Necessário**: Mostrar `remetente_tipo` com label amigável (ex: "Assistente Social", "Psicólogo", etc.)
- **Problema**: O campo `remetente_tipo` armazena `'assistente'` ou `'requerente'`, não o role específico. Para mostrar a função real, precisa fazer JOIN com `profiles` ou armazenar o role no momento do envio.

## Decisões de Design

### D1: Como obter o role do profissional no chat do requerente?

**Opção A (Recomendada)**: JOIN com `profiles` na query de mensagens
- Na query `loadMessages()` de `MensagensCaso.jsx`, fazer join: `mensagens_caso(*, profiles!mensagens_caso_remetente_id_fkey(role, nome))`
- Vantagem: Não requer alteração no schema, usa dados já existentes
- Desvantagem: query mais pesada, mas aceitável para mensagens de caso

**Opção B**: Adicionar coluna `remetente_role` na tabela `mensagens_caso`
- Migration para adicionar coluna + trigger para preencher automaticamente
- Vantagem: Dados denormalizados, query mais rápida
- Desvantagem: Requer migration, dados históricos ficam sem role

**Decisão**: Opção A (JOIN com profiles) - mais simples, sem migration.

### D2: Como buscar o caso do requerente no dossiê?

O profissional precisa do `triagens.id` (caso_id) para usar `MensagensCaso`. Buscar:
```sql
SELECT * FROM triagens WHERE applicant_id = :requerenteId ORDER BY created_at DESC LIMIT 1
```

Se não existir caso, exibir mensagem orientando o profissional a criar um.

### D3: Layout do chat no dossiê

Adicionar um card "Mensagens" entre os prontuários e o chat flutuante de IA, usando o componente `MensagensCaso` com altura fixa similar ao `ChatCaso.jsx`.

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `frontend/src/pages/Chat.jsx` | Filtrar requerentes da lista de contatos |
| `frontend/src/pages/RequerenteDetail.jsx` | Adicionar seção de chat com `MensagensCaso` |
| `frontend/src/components/caso/MensagensCaso.jsx` | Exibir role do remetente via JOIN com profiles |

## Fora do Escopo

- Alterações no schema do banco (nenhuma migration necessária)
- Chat em tempo real entre múltiplos profissionais e o mesmo requerente
- Notificações de novas mensagens
- Indicador de mensagem não lida (`lida` campo existe mas nunca é atualizado)
