# Plano de Implementação — Role Requerente + 7 Features

## Visão Geral

Adicionar o role `requerente` (cidadão que busca atendimento no CRAS) ao EloSocial, com funcionalidades próprias. 7 features, 18 arquivos novos, 5 modificações + 1 migration SQL.

---

## Correções de Inconsistências

| # | Inconsistência | Resolução |
|---|---|---|
| 1 | `mensagens_caso` schema divergente (docs 04 vs 08) | Usar schema do doc 08 + adicionar `remetente_nome TEXT` e `remetente_tipo TEXT` para evitar JOINs |
| 2 | `documentos_caso` sem `descricao` (docs 07 vs 08) | Adicionar `descricao TEXT` e `uploaded_by_tipo TEXT` ao schema do doc 08 |
| 3 | `planos_acao` sem `'ambos'` (docs 06 vs 08) | Adicionar `'ambos'` ao CHECK de `responsavel`, adicionar `created_by_tipo TEXT` |
| 4 | Trigger `validate_institutional_email` — DROP total | Modificar para pular validação quando `role = 'requerente'`, preservando para profissionais |
| 5 | Coluna `cras` já existe | Ignorar — migration 00002 já adicionou |
| 6 | `handle_new_user` já lê `cras` | Ignorar — migration 00002 já atualizou |

---

## Dependências entre Fases

```
Fase 1 (Fundação) ──→ Fase 2 (Dashboard) ──→ Fase 3 (Triagem)
                                                  │
                    ┌───────────┬───────────┬─────┴────────┐
                    ▼           ▼           ▼              ▼
               Fase 4      Fase 5      Fase 6         Fase 7
              (Chat)    (Documentos) (Video)      (Plano Ação)
```

Fases 4-7 são independentes e podem ser implementadas em paralelo após Fase 3.

---

## Fase 1 — Fundação (Auth + Database) ~2-3h

**Objetivo:** Role `requerente` funcional no sistema.

### 1.1 Migration SQL

Arquivo: `supabase/migrations/00011_requerente.sql`

**Itens da migration:**
- CHECK constraint: adicionar `'requerente'` à lista de roles
- Trigger `validate_institutional_email`: modificar para pular validação quando `raw_user_meta_data->>'role' = 'requerente'`
- Tabela `triagens`: 14 colunas, 3 índices, RLS com 5 policies
- Tabela `mensagens_caso`: com `remetente_nome`, `remetente_tipo`, RLS com 3 policies
- Tabela `planos_acao`: com `responsavel` incluindo `'ambos'`, `created_by_tipo`, RLS com 3 policies
- Tabela `documentos_caso`: com `descricao`, `uploaded_by_tipo`, RLS com 3 policies
- Storage bucket `documentos-caso` (privado) + 3 RLS policies no Storage
- Realtime: habilitar para `mensagens_caso`, `triagens`, `planos_acao`, `documentos_caso`

### 1.2 Frontend — Arquivos a modificar

| Arquivo | Ação | Detalhe |
|---|---|---|
| `frontend/src/utils/roles.js` | Modificar | Adicionar `REQUERENTE: 'requerente'`, `ROLE_LABELS`, helper `isRequerente(role)` |
| `frontend/src/pages/Login.jsx` | Modificar | Após login, checar `profile.role === 'requerente'` → redirect `/acompanhamento` |
| `frontend/src/components/Layout/Sidebar.jsx` | Modificar | Links condicionais para requerente (6 links) |
| `frontend/src/App.jsx` | Modificar | Adicionar 6 rotas com `roles={['requerente']}` |

### 1.3 Frontend — Arquivo a criar

| Arquivo | Ação |
|---|---|
| `frontend/src/pages/CadastroRequerente.jsx` | Criar — formulário mínimo (nome, email pessoal, senha, CPF, telefone, CRAS). Usa `supabase.auth.signUp()` direto |

### Lógica de Login.jsx

```javascript
const handleSubmit = async (e) => {
  // ...existing code...
  await login(email, password)
  // Após login, buscar profile e redirecionar conforme role
  const p = await fetchProfile(session.user.id) // ou usar o profile do AuthContext
  if (p?.role === 'requerente') {
    navigate('/acompanhamento', { replace: true })
  } else {
    navigate(from, { replace: true })
  }
}
```

### Links da Sidebar para requerente

```javascript
const links = profile?.role === 'requerente'
  ? [
      { to: '/acompanhamento', label: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true },
      { to: '/triagem', label: 'Triagem', icon: <ClipboardList size={20} /> },
      { to: '/chat-atendimento', label: 'Mensagens', icon: <MessageSquare size={20} /> },
      { to: '/video-atendimento', label: 'Video', icon: <Video size={20} /> },
      { to: '/plano-acao', label: 'Plano de Ação', icon: <ListTodo size={20} /> },
      { to: '/cofre-digital', label: 'Cofre Digital', icon: <FolderOpen size={20} /> },
    ]
  : [ /* links existentes dos profissionais */ ]
```

### Critérios de conclusão

- [ ] Requerente cadastra com email pessoal (não-gov.br)
- [ ] Requerente loga → redirect para `/acompanhamento`
- [ ] Sidebar mostra apenas 6 links para requerente
- [ ] Profissional loga → comportamento inalterado
- [ ] `profile.cras` preenchido corretamente no signup

---

## Fase 2 — Dashboard do Requerente ~2h

**Objetivo:** Tela principal com resumo do caso.

| Arquivo | Ação |
|---|---|
| `frontend/src/pages/DashboardRequerente.jsx` | Criar |

### Lógica

1. Buscar caso mais recente: `supabase.from('triagens').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(1)`
2. Se vazio → "Nenhum caso ativo" + botão "Iniciar Triagem" → `/triagem`
3. Se existe → badge status (pendente=amarelo, em_atendimento=verde, em_acompanhamento=azul, concluido=cinza), badge prioridade
4. Dados resumidos: contato, motivo, urgência
5. Botão "Editar Triagem" (só quando status = `pendente`)
6. 4 cards de acesso rápido: Video, Mensagens, Plano de Ação, Cofre Digital
7. Realtime na tabela `triagens` para atualização de status

### Critérios de conclusão

- [ ] Sidebar mostra links corretos
- [ ] Dashboard exibe status da triagem mais recente
- [ ] Cards de acesso rápido funcionam
- [ ] Estado vazio tratado com botão para iniciar triagem
- [ ] Realtime atualiza status sem reload

---

## Fase 3 — Triagem Social ~4-5h

**Objetivo:** Formulário multi-step com scoring de risco.

| Arquivo | Ação |
|---|---|
| `frontend/src/pages/TriagemSocial.jsx` | Criar — componente principal multi-step |
| `frontend/src/components/triagem/EtapaContato.jsx` | Criar — etapa 1 |
| `frontend/src/components/triagem/EtapaFamilia.jsx` | Criar — etapa 2 |
| `frontend/src/components/triagem/EtapaMotivo.jsx` | Criar — etapa 3 |
| `frontend/src/components/triagem/EtapaUrgencia.jsx` | Criar — etapa 4 |
| `frontend/src/components/triagem/EtapaRelato.jsx` | Criar — etapa 5 (relato + revisão) |
| `frontend/src/utils/triagemScoring.js` | Criar — funções de pontuação |
| `frontend/src/utils/triagemOptions.js` | Criar — constantes de opções |

### Detalhes

- `TriagemSocial.jsx` gerencia state global (`dados_acolhimento`), controla etapa atual, barra de progresso, validação por etapa
- Cada etapa é um componente controlado com props `data` e `onChange`
- `triagemScoring.js`: `calcularPrioridade(dados)` → `{ total, prioridade: 'ALTA'|'MEDIA'|'BAIXA' }`
- `triagemOptions.js`: exporta arrays de opções (COMPOSICAO_FAMILIAR, RENDA_FAMILIAR, BENEFICIOS_SOCIAIS, DEMANDAS_PRINCIPAIS, SITUACOES_VULNERABILIDADE, NIVEIS_URGENCIA)
- Modo edição: `?editar=1` → buscar triagem existente, preencher state, UPDATE ao invés de INSERT
- Etapa 5: painel de revisão com todos os dados + textarea para relato
- Serialização: `dados_acolhimento` (JSONB), `detalhes` (texto), `sintomas` (array), `prioridade`

### Critérios de conclusão

- [ ] Formulário avança entre etapas com validação
- [ ] Barra de progresso atualiza
- [ ] Scoring gera prioridade correta (ALTA ≥70, MEDIA ≥30, BAIXA <30)
- [ ] Dados salvos no banco como JSONB
- [ ] Modo de edição funciona
- [ ] Revisão antes de enviar mostra todos os dados

---

## Fase 4 — Chat Caso-a-Caso ~2h

**Objetivo:** Comunicação entre requerente e assistente social vinculada ao caso.

| Arquivo | Ação |
|---|---|
| `frontend/src/components/caso/MensagensCaso.jsx` | Criar — componente compartilhado |
| `frontend/src/pages/ChatCaso.jsx` | Criar — wrapper para requerente |

### Padrão (seguir Chat.jsx)

- `useRealtime('chat-caso', 'mensagens_caso', 'INSERT', callback)` com filtro por `caso_id`
- State: `messages[]`, `newMessage`, `messagesEndRef`
- Enviar: `supabase.from('mensagens_caso').insert({ caso_id, remetente_id, remetente_nome, remetente_tipo, conteudo })`
- Bolhas: `.sent` (direita) / `.received` (esquerda)
- Enter envia, Shift+Enter quebra linha
- Deduplicação: set de IDs de mensagens já exibidas

### Critérios de conclusão

- [ ] Requerente envia mensagens ao assistente
- [ ] Assistente responde ao requerente
- [ ] Mensagens em tempo real (Realtime)
- [ ] Mensagens vinculadas ao `caso_id`
- [ ] Histórico preserva ordem cronológica
- [ ] Sem duplicatas

---

## Fase 5 — Cofre Digital ~2h

**Objetivo:** Upload/download de documentos vinculados ao caso.

| Arquivo | Ação |
|---|---|
| `frontend/src/components/caso/DocumentosCaso.jsx` | Criar — componente compartilhado |
| `frontend/src/pages/CofreDigital.jsx` | Criar — wrapper para requerente |

### Padrão (seguir ProntuarioView.jsx)

- Upload: `supabase.storage.from('documentos-caso').upload(path, file)` → path = `{casoId}/{timestamp}-{nome_sanitizado}`
- Metadados: `supabase.from('documentos_caso').insert({ ... })`
- Download: `supabase.storage.from('documentos-caso').createSignedUrl(path, 60)` → nova aba
- Delete: storage remove + db delete
- Limite: 10MB por arquivo
- Realtime na tabela `documentos_caso`

### Critérios de conclusão

- [ ] Upload qualquer tipo de arquivo
- [ ] Lista com nome, tamanho, data, quem enviou
- [ ] Download via URL assinada
- [ ] Delete com permissão (requerente: só seus; assistente: todos)
- [ ] RLS garante isolamento por caso

---

## Fase 6 — Videochamada com Sala de Espera ~3h

**Objetivo:** Sala de espera + conexão automática via Realtime.

| Arquivo | Ação |
|---|---|
| `backend/app/api/video.py` | Modificar — adicionar `caso_id` opcional |
| `frontend/src/components/video/VideoCall.jsx` | Criar — wrapper Daily.co compartilhado |
| `frontend/src/pages/VideoRequerente.jsx` | Criar — sala de espera + videochamada |

### Backend — video.py

- Adicionar `caso_id: str | None = None` ao `CreateRoomRequest`
- Se `caso_id` fornecido, após criar sala: atualizar `triagens` com `daily_room_url`, `daily_room_name`, `daily_room_created_at`, `daily_room_expires_at` (+7 dias), mudar `status` para `em_atendimento`

### Frontend — VideoCall.jsx

- Componente reutilizável: recebe `roomUrl` e `onLeave`
- Dynamic import de `@daily-co/daily-js`, cria iframe, cleanup no unmount
- Extraído do padrão de `Videoconferencia.jsx` (linhas 181-221)

### Frontend — VideoRequerente.jsx

1. Buscar caso mais recente
2. Se não existe → mensagem informativa
3. Se `status !== 'em_atendimento'` → sala de espera com animação pulse
4. Realtime na `triagens`: quando `status` muda para `em_atendimento` com `daily_room_url` → renderizar `VideoCall`
5. Quando profissional encerra → "Chamada encerrada"

### Critérios de conclusão

- [ ] Sala de espera com animação
- [ ] Conexão automática via Realtime
- [ ] `VideoCall` reutilizado entre profissionais e requerentes
- [ ] Sala vinculada ao caso na tabela `triagens`

---

## Fase 7 — Plano de Ação ~2h

**Objetivo:** Tarefas vinculadas ao caso com acompanhamento de progresso.

| Arquivo | Ação |
|---|---|
| `frontend/src/components/caso/PlanoAcaoCaso.jsx` | Criar — componente compartilhado |
| `frontend/src/pages/PlanoAcao.jsx` | Criar — wrapper para requerente |

### PlanoAcaoCaso.jsx

- Props: `casoId`, `modo` ('requerente' | 'assistente')
- Lista: `supabase.from('planos_acao').select('*').eq('caso_id', casoId).order('created_at')`
- Status cycles: pendente → em_andamento → concluido → pendente
- Modo assistente: formulário de criação (título, descrição, responsável, prazo)
- Modo requerente: sem formulário, sem delete
- Realtime na tabela `planos_acao`
- Cores: pendente=cinza/amarelo, em_andamento=azul, concluido=verde

### Critérios de conclusão

- [ ] Assistente cria tarefas
- [ ] Requerente altera status
- [ ] Realtime atualiza instantaneamente
- [ ] Permissões corretas por modo

---

## Resumo de Arquivos

| Fase | Criar | Modificar | Esforço |
|------|-------|-----------|---------|
| 1 — Fundação | 1 | 4 + migration | 2-3h |
| 2 — Dashboard | 1 | — | 2h |
| 3 — Triagem | 8 | — | 4-5h |
| 4 — Chat | 2 | — | 2h |
| 5 — Documentos | 2 | — | 2h |
| 6 — Video | 2 | 1 | 3h |
| 7 — Plano Ação | 2 | — | 2h |
| **Total** | **18** | **5 + migration** | **~17-19h** |

---

## Notas de Implementação

1. **CSS:** Tailwind CSS 4 com CSS custom properties. Usar classes existentes (`btn`, `btn-primary`, `form-group`, `form-control`, `card`, `badge`) e vars (`--bg-surface`, `--border`, `--accent`, `--text-primary`)
2. **Padrão de página:** `<Layout title="...">` + `<h1 className="page-title font-serif">` + `<p className="page-subtitle">`
3. **Supabase client:** Importar de `../lib/supabase`, usar `supabase.from()`, `supabase.storage.from()`, `useRealtime()` hook
4. **Auth:** `useAuth()` retorna `{ user, profile, loading, login, logout, signup }`. `profile` já tem `cras` e `role`
5. **Backend video.py:** Usa `httpx` direto para Supabase REST (service_role). Seguir esse padrão
6. **Cronologia:** Cada fase pode ser commitada separadamente. Migration SQL deve ser aplicada antes de testar frontend
