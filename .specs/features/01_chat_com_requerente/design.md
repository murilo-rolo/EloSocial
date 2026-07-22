# Design: Chat com Requerente

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Supabase                              │
│                                                          │
│  profiles (todos os usuários)                            │
│  ├── id, nome, role, email, ...                         │
│                                                          │
│  triagens (casos)                                        │
│  ├── id (caso_id)                                       │
│  ├── user_id (requerente) → profiles.id                 │
│  ├── assistente_social_id (profissional) → profiles.id  │
│  └── applicant_id → applicants.id                       │
│                                                          │
│  mensagens_caso (chat caso)                              │
│  ├── caso_id → triagens.id                              │
│  ├── remetente_id → profiles.id                         │
│  ├── remetente_nome (denormalizado)                     │
│  ├── remetente_tipo ('requerente' | 'assistente')       │
│  └── conteudo, created_at, lida                         │
│                                                          │
│  messages (chat profissional-profissional)               │
│  ├── remetente_id, destinatario_id → profiles.id        │
│  └── conteudo, created_at, lida                         │
│                                                          │
│  Realtime habilitado em ambas as tabelas de mensagem     │
└─────────────────────────────────────────────────────────┘
```

## Fluxo: Profissional envia mensagem para requerente

```
1. Profissional acessa /requerentes/:id
2. RequerenteDetail.jsx busca triagens WHERE applicant_id = :id
3. Se caso existe → renderiza MensagensCaso(casoId, modo="assistente")
4. MensagensCaso carrega mensagens com JOIN em profiles para obter role
5. Profissional digita → insert em mensagens_caso com remetente_tipo="assistente"
6. Realtime entrega a mensagem para o requerente em /chat-atendimento
```

## Fluxo: Requerente vê remetente com cargo

```
1. Requerente acessa /chat-atendimento
2. ChatCaso.jsx busca caso do requerente (triagens WHERE user_id = :id)
3. MensagensCaso carrega mensagens com JOIN em profiles
4. Para cada mensagem recebida (isOwn = false):
   - Mostra remetente_nome + ROLE_LABELS[profiles.role]
   - Ex: "Maria Silva - Assistente Social"
```

## Mudanças por Arquivo

### 1. `frontend/src/pages/Chat.jsx`

**Mudança**: Filtrar requerentes da lista de contatos.

```javascript
// ANTES (linha 20-24):
const { data } = await supabase
  .from('profiles')
  .select('*')
  .neq('id', profile?.id)
  .order('nome')

// DEPOIS:
const { data } = await supabase
  .from('profiles')
  .select('*')
  .neq('id', profile?.id)
  .neq('role', 'requerente')
  .order('nome')
```

### 2. `frontend/src/pages/RequerenteDetail.jsx`

**Mudança**: Adicionar seção de chat abaixo dos prontuários.

- Buscar caso: `triagens.select('*').eq('applicant_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle()`
- Se caso existe: renderizar card com `MensagensCaso casoId={caso.id} modo="assistente"`
- Se não existe: exibir mensagem "Nenhum caso vinculado. Crie um caso para iniciar o chat."
- Estado adicional: `caso` (null | objeto triagens)
- Importar `MensagensCaso` e `MessageSquare` do lucide-react

### 3. `frontend/src/components/caso/MensagensCaso.jsx`

**Mudança**: Exibir cargo/função do remetente nas mensagens recebidas.

**Query atual** (linha 22-26):
```javascript
const { data } = await supabase
  .from('mensagens_caso')
  .select('*')
  .eq('caso_id', casoId)
  .order('created_at', { ascending: true })
```

**Query com JOIN**:
```javascript
const { data } = await supabase
  .from('mensagens_caso')
  .select('*, profiles!mensagens_caso_remetente_id_fkey(role)')
  .eq('caso_id', casoId)
  .order('created_at', { ascending: true })
```

**Renderização atual** (linha 110-114):
```jsx
{!isOwn && msg.remetente_nome && (
  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 2 }}>
    {msg.remetente_nome}
  </div>
)}
```

**Renderização com cargo**:
```jsx
{!isOwn && msg.remetente_nome && (
  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 2 }}>
    {msg.remetente_nome}
    {msg.profiles?.role && (
      <span style={{ fontWeight: 400, marginLeft: 6, opacity: 0.7 }}>
        · {ROLE_LABELS[msg.profiles.role] || msg.profiles.role}
      </span>
    )}
  </div>
)}
```

## Segurança

- **RLS já protege**: As políticas de `mensagens_caso` garantem que apenas o requerente do caso e o assistente social atribuído podem ler/escrever mensagens
- **Frontend route guard**: `/chat` não tem restrição de role (problema atual) - a mudança no Chat.jsx filtra na query, mas o acesso à rota continua aberto. Se necessário, adicionar `roles` ao ProtectedRoute da rota `/chat`

## Dependências

- Nenhuma migration necessária (schema já suporta tudo)
- Nenhuma dependência nova (usa componentes e hooks existentes)
- `ROLE_LABELS` já importado em `RequerenteDetail.jsx`

## Riscos

1. **Performance do JOIN**: O join `mensagens_caso -> profiles` pode ser lento se houver muitas mensagens. Mitigação:非性 crítico para uso em caso individual.
2. **Dados históricos**: Mensagens antigas sem JOIN podem não ter `profiles.role`. Mitigação: fallback para `remetente_tipo` quando `profiles.role` não disponível.
3. **Caso não existe**: Se o profissional nunca criou um triagem para o requerente, não há chat. Mitigação: mensagem orientativa.
