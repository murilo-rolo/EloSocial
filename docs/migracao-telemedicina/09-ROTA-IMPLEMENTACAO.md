# 09 — Rota de Implementação

## Visão Geral

Ordem de implementação das funcionalidades, com dependências, arquivos a criar/modificar e estimativas. Cada fase deve ser concluída antes de avançar para a seguinte.

---

## Fase 1 — Fundação (Auth + Database)

**Objetivo:** Suporte ao role `requerente` no sistema de autenticação e banco de dados.

**Pré-requisitos:** Nenhum.

**Arquivos a modificar:**
- `supabase/migrations/00011_requerente.sql` — migration com todas as mudanças SQL (ver `08-MIGRACAO-DATABASE.md`)
- `frontend/src/utils/roles.js` — adicionar `REQUERENTE: 'requerente'` e `ROLE_LABELS`
- `frontend/src/hooks/useAuth.js` — garantir que `profile.cras` é retornado
- `backend/app/auth.py` — desabilitar validação de email `gov.br` para `requerente` (ou usar `supabase.auth.signUp` direto no frontend)

**Arquivos a criar:**
- `frontend/src/pages/CadastroRequerente.jsx` — formulário de cadastro mínimo (email, senha, nome, CPF, telefone, CRAS)
- `frontend/src/pages/Login.jsx` — modificar lógica de redirect para requerente ir para `/acompanhamento`

**Critérios de conclusão:**
- [ ] Requerente consegue se cadastrar com email pessoal
- [ ] Requerente consegue logar e ver sidebar simplificada
- [ ] `profile.cras` é preenchido corretamente
- [ ] Trigger `handle_new_user` cria profile com `cras`

---

## Fase 2 — Dashboard do Requerente

**Objetivo:** Tela principal do requerente com resumo do caso e status.

**Pré-requisitos:** Fase 1 concluída.

**Arquivos a modificar:**
- `frontend/src/App.jsx` — adicionar rotas `/acompanhamento`, `/triagem`, `/chat-caso/:id`, `/video-requerente/:id`, `/documentos-caso/:id`, `/plano-acao/:id`
- `frontend/src/components/Layout/Sidebar.jsx` — lógica condicional para mostrar links diferentes para `requerente`

**Arquivos a criar:**
- `frontend/src/pages/DashboardRequerente.jsx` — resumo do caso, dados da triagem, acesso rápido

**Critérios de conclusão:**
- [ ] Sidebar mostra apenas links relevantes para requerente
- [ ] Dashboard exibe status da triagem mais recente
- [ ] Cards de acesso rápido funcionam (links para chat, documentos, etc.)
- [ ] Tratamento de "nenhum caso ativo"

---

## Fase 3 — Triagem Social

**Objetivo:** Formulário multi-step para coleta de dados e criação do caso.

**Pré-requisitos:** Fase 1 concluída.

**Arquivos a criar:**
- `frontend/src/pages/TriagemSocial.jsx` — componente principal multi-step
- `frontend/src/components/triagem/EtapaContato.jsx` — etapa 1
- `frontend/src/components/triagem/EtapaFamilia.jsx` — etapa 2
- `frontend/src/components/triagem/EtapaMotivo.jsx` — etapa 3
- `frontend/src/components/triagem/EtapaUrgencia.jsx` — etapa 4
- `frontend/src/components/triagem/EtapaRelato.jsx` — etapa 5 (relato + revisão)
- `frontend/src/utils/triagemScoring.js` — funções de cálculo de pontuação
- `frontend/src/utils/triagemOptions.js` — constantes de opções (categorias, situações, etc.)

**Fluxo:**
1. Cadastro (Fase 1) → redirect automático para `/triagem`
2. Preenchimento → cálculo de prioridade → INSERT em `triagens` → redirect para `/acompanhamento`
3. Edição: `/triagem?editar=1` → busca triagem existente → UPDATE

**Critérios de conclusão:**
- [ ] Formulário avança entre etapas com validação
- [ ] Barra de progresso atualiza
- [ ] Cálculo de pontuação gera prioridade correta (ALTA/MÉDIA/BAIXA)
- [ ] Dados salvos no banco como JSONB (`dados_acolhimento`)
- [ ] Modo de edição funciona (busca dados existentes)
- [ ] Revisão antes de enviar mostra todos os dados

---

## Fase 4 — Chat Caso-a-Caso

**Objetivo:** Comunicação entre requerente e assistente social vinculada ao caso.

**Pré-requisitos:** Fase 3 concluída (precisa de um caso existente).

**Arquivos a criar:**
- `frontend/src/components/caso/MensagensCaso.jsx` — componente de chat (baseado no padrão de `Chat.jsx`)
- `frontend/src/pages/ChatCaso.jsx` — wrapper da página

**Padrão a seguir:** `Chat.jsx` (linhas 1-160) — usar `useRealtime` para subscription na tabela `mensagens_caso`, bolhas de mensagem com `sent`/`received`, auto-scroll.

**Critérios de conclusão:**
- [ ] Requerente pode enviar mensagens ao assistente social
- [ ] Assistente social pode responder ao requerente
- [ ] Mensagens aparecem em tempo real (Realtime)
- [ ] Mensagens são vinculadas ao `caso_id`
- [ ] Histórico preserva ordem cronológica

---

## Fase 5 — Cofre Digital (Documentos)

**Objetivo:** Upload e download de documentos vinculados ao caso.

**Pré-requisitos:** Fase 3 concluída.

**Arquivos a criar:**
- `frontend/src/components/caso/DocumentosCaso.jsx` — componente de upload/download
- `frontend/src/pages/CofreDigital.jsx` — wrapper da página

**Padrão a seguir:** `ProntuarioView.jsx` (linhas de anexo) — upload para Supabase Storage, inserção de metadados, download via `createSignedUrl`.

**Critérios de conclusão:**
- [ ] Requerente pode fazer upload de qualquer tipo de arquivo
- [ ] Assistente social pode fazer upload
- [ ] Lista mostra nome, tamanho, data e quem fez upload
- [ ] Download funciona via URL assinada
- [ ] Delete funciona para quem fez upload
- [ ] RLS garante que apenas participantes do caso acessam

---

## Fase 6 — Videochamada com Sala de Espera

**Objetivo:** Extensão do sistema de videoconferência com sala de espera para requerente.

**Pré-requisitos:** Fase 3 concluída.

**Arquivos a modificar:**
- `backend/app/api/rooms.py` — endpoint para criar sala vinculada a caso (preencher `daily_room_*` em `triagens`)

**Arquivos a criar:**
- `frontend/src/pages/VideoRequerente.jsx` — página com sala de espera
- `frontend/src/components/video/VideoCall.jsx` — wrapper Daily.co (compartilhado entre `Videoconferencia.jsx` e `VideoRequerente.jsx`)

**Padrão a seguir:** `Videoconferencia.jsx` — Dynamic import de `@daily-co/daily-js`, criação de iframe, endpoint `POST /api/rooms`.

**Critérios de conclusão:**
- [ ] Assistente social pode iniciar videochamada a partir do dashboard
- [ ] Requerente entra em sala de espera
- [ ] Quando profissional inicia, requerente é conectado
- [ ] Componente `VideoCall` é reutilizado entre profissionais e requerentes
- [ ] Sala é vinculada ao caso na tabela `triagens`

---

## Fase 7 — Plano de Ação

**Objetivo:** Tarefas vinculadas ao caso com acompanhamento de progresso.

**Pré-requisitos:** Fase 3 concluída.

**Arquivos a criar:**
- `frontend/src/components/caso/PlanoAcaoCaso.jsx` — componente com prop `modo` ('requerente' | 'assistente')
- `frontend/src/pages/PlanoAcao.jsx` — wrapper da página

**Critérios de conclusão:**
- [ ] Assistente social pode criar tarefas com título, descrição, responsável e data limite
- [ ] Requerente pode marcar tarefas como concluídas
- [ ] Status é atualizado em tempo real
- [ ] Filtros por status funcionam (pendente, em andamento, concluído)
- [ ] Modo requerente e assistente mostram permissões diferentes

---

## Dependências entre fases

```
Fase 1 (Auth + DB)
  ├── Fase 2 (Dashboard)
  └── Fase 3 (Triagem)
        ├── Fase 4 (Chat)
        ├── Fase 5 (Documentos)
        ├── Fase 6 (Videochamada)
        └── Fase 7 (Plano de Ação)
```

Fases 4, 5, 6 e 7 são independentes entre si e podem ser implementadas em paralelo após a Fase 3.

---

## Arquivos totais a criar/modificar

| Fase | Criar | Modificar |
|---|---|---|
| 1 | 1 (CadastroRequerente) | 4 (roles.js, useAuth, Login, auth.py) |
| 2 | 1 (DashboardRequerente) | 2 (App.jsx, Sidebar.jsx) |
| 3 | 8 (TriagemSocial + 5 etapas + scoring + options) | 0 |
| 4 | 2 (MensagensCaso, ChatCaso) | 0 |
| 5 | 2 (DocumentosCaso, CofreDigital) | 0 |
| 6 | 2 (VideoRequerente, VideoCall) | 1 (rooms.py) |
| 7 | 2 (PlanoAcaoCaso, PlanoAcao) | 0 |
| **Total** | **18** | **7** |
