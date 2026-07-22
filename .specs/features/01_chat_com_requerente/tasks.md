# Tasks: Chat com Requerente

## Visão Geral

3 tarefas atômicas, sequenciais (cada uma pode ser commitada independentemente).

---

## Task 1: Filtrar requerentes do chat entre profissionais

**Arquivo**: `frontend/src/pages/Chat.jsx`
**Requisito**: REQ-01
**Complexidade**: Small

### Passos
1. Adicionar `.neq('role', 'requerente')` na query de `loadContacts()` (linha 20-24)

### Verificação
- [x] Usuários com `role = 'requerente'` não aparecem na lista de contatos em `/chat`
- [x] Profissionais continuam aparecendo normalmente
- [x] A query não quebra (sem erros de console)

### Critério de Aceite
```javascript
// A query deve ser:
const { data } = await supabase
  .from('profiles')
  .select('*')
  .neq('id', profile?.id)
  .neq('role', 'requerente')  // NOVO
  .order('nome')
```

---

## Task 2: Exibir cargo do remetente no chat do requerente

**Arquivo**: `frontend/src/components/caso/MensagensCaso.jsx`
**Requisito**: REQ-03
**Complexidade**: Small

### Passos
1. Modificar a query em `loadMessages()` para fazer JOIN com `profiles`:
   ```javascript
   .select('*, profiles!mensagens_caso_remetente_id_fkey(role)')
   ```
2. Importar `ROLE_LABELS` de `../../utils/roles`
3. Atualizar a renderização do nome do remetente (linha 110-114) para incluir o cargo:
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

### Verificação
- [ ] Mensagens recebidas mostram nome + cargo (ex: "Maria Silva · Assistente Social")
- [ ] Mensagens enviadas (isOwn) não mostram nome/cargo (comportamento atual preservado)
- [ ] Mensagens sem `profiles.role` (fallback) mostram apenas o nome

### Critério de Aceite
- Na interface do requerente (`/chat-atendimento`), mensagens de profissionais mostram: `nome · Função`
- Na interface do profissional (`/requerentes/:id`), mensagens do requerente mostram apenas o nome

---

## Task 3: Adicionar chat na página do dossiê do requerente

**Arquivo**: `frontend/src/pages/RequerenteDetail.jsx`
**Requisito**: REQ-02
**Complexidade**: Medium

### Passos
1. Importar `MensagensCaso` de `../components/caso/MensagensCaso`
2. Importar `MessageSquare` de `lucide-react`
3. Adicionar estado `caso`:
   ```javascript
   const [caso, setCaso] = useState(null)
   ```
4. Na função `load()`, buscar o caso vinculado ao requerente:
   ```javascript
   const { data: casoData } = await supabase
     .from('triagens')
     .select('*')
     .eq('applicant_id', id)
     .order('created_at', { ascending: false })
     .limit(1)
     .maybeSingle()
   setCaso(casoData)
   ```
5. Adicionar card de chat após o card de "Linha do Tempo (Prontuários)" e antes do `SlideOver`:
   ```jsx
   <div className="card">
     <div className="card-header">
       <h3><MessageSquare size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Mensagens</h3>
     </div>
     {caso ? (
       <div style={{ padding: 0, height: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
         <MensagensCaso casoId={caso.id} modo="assistente" />
       </div>
     ) : (
       <div className="empty-state">
         <p>Nenhum caso vinculado a este requerente.</p>
         <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
           Crie um caso na triagem para iniciar o chat.
         </p>
       </div>
     )}
   </div>
   ```

### Verificação
- [ ] Se existe caso: chat é renderizado e funcional (enviar/receber mensagens)
- [ ] Se não existe caso: mensagem orientativa é exibida
- [ ] O chat mostra o nome + cargo do profissional (via Task 2)
- [ ] O chat mostra apenas o nome do requerente quando ele envia mensagem
- [ ] Realtime funciona (mensagens aparecem em tempo real)

### Critério de Aceite
- Profissional acessa `/requerentes/:id` → vê card "Mensagens" com chat funcional
- Mensagens enviadas pelo profissional têm `remetente_tipo = 'assistente'`
- Mensagens recebidas do requerente mostram apenas o nome (sem cargo, já que é requerente)
- O chat está integrado visualmente com o resto da página (mesmo estilo dos outros cards)

---

## Ordem de Execução

```
Task 1 → Task 2 → Task 3
  │         │         │
  └─────────┴─────────┘
  Cada task é um commit atômico
```

## Dependências

- Task 2 e Task 3 podem ser feitas em paralelo (dependem de arquivos diferentes)
- Task 1 é independente
- Recomendado: executar em ordem para facilitar review

## Validação Final

Após todas as tarefas:
1. Testar fluxo completo: profissional envia → requerente vê nome + cargo
2. Testar fluxo completo: requerente envia → profissional vê no dossiê
3. Verificar que requerentes não aparecem em `/chat`
4. Verificar que o chat no dossiê funciona com realtime
