# Backlog

## ✅ Concluído

### Core
- Supabase: migrations 00001 + 00002 + 00003, RLS, triggers, seed
- Backend: FastAPI, PDF (ReportLab), admin de usuários com CRAS, Daily.co rooms
- Frontend: setup, auth, layout PWA, Dashboard, Requerentes CRUD
- Frontend: Prontuário SUAS (13 seções), PDF/JSON export
- Frontend: Chat (Realtime), Admin (usuários + CRAS scoping)
- Frontend: Videoconferência (salas públicas/privadas, código de acesso, Daily.co)

### IA — Copiloto SUAS
- Backend: ChatIA (gemini-2.5-flash + tool calling RAG)
- Backend: Triagem de vulnerabilidade automática (score + cor)
- Backend: Resumo executivo de prontuários
- Backend: Gerador de pareceres (padrão, jurídico, saúde)
- Backend: EloBot — busca global com IA
- Backend: OCR — extração de dados de documentos (Gemini Vision)
- Frontend: ChatIA (split-view: requerentes à esquerda, chat à direita)

### RAG — Base de Conhecimento
- Backend: pgvector + embeddings gemini-embedding-2 (768d)
- Backend: Busca híbrida (semântica + lexical via tsvector)
- Backend: Upload de PDFs/texto, chunking, vetorização automática
- Frontend: BaseConhecimento (upload, listagem, exclusão de documentos)

### Infraestrutura
- Migration 00004: Anexos de prontuário (Supabase Storage)
- Migration 00005: Sistema de agendamentos
- Migration 00006: Triagem de vulnerabilidade (colunas em applicants)
- Migration 00007: pgvector + tabelas RAG
- Migration 00008: Busca híbrida RAG
- Migration 00009: Realtime para messages
- Migration 00010: Remoção campo localizacao
- Documentação: README, BACKLOG, SKILL.md, DOCKER.md
- Docs: Migração telemedicina (11 arquivos)

### Frontend — Páginas novas
- Cadastro de usuários (pública)
- Agenda de atendimentos
- Perfil do usuário
- Base de Conhecimento RAG

### Design
- Tailwind CSS v4 (migrou do CSS puro)
- Tema escuro/claro (CSS custom properties)
- Ícones: lucide-react
- Gráficos: recharts

## 🔄 Em andamento

### Fluxo existente
- Testar fluxo completo: cadastro → prontuário → PDF
- Ajustar responsividade mobile (viewport 360px)
- Validar RLS policies
- Deploy: Vercel (frontend + backend)
- Pastas vazias: components/Chat/, components/Prontuario/, components/ReportViewer/ (componentes estão nas páginas)

### Role Requerente + 7 Features

Plano detalhado em: `docs/migracao-telemedicina/PLANO-IMPLEMENTACAO.md`

#### Marco 1 — Fundação (Auth + Database) `~2-3h`
- [ ] Migration `00011_requerente.sql` (CHECK role, trigger email, 4 tabelas, RLS, Storage, Realtime)
- [ ] `roles.js` — adicionar REQUERENTE + helpers
- [ ] `CadastroRequerente.jsx` — cadastro mínimo com email pessoal
- [ ] `Login.jsx` — redirect por role (requerente → /acompanhamento)
- [ ] `Sidebar.jsx` — links condicionais para requerente
- [ ] `App.jsx` — 6 rotas protegidas
- **Teste:** Requerente cadastra, loga, vê sidebar simplificada

#### Marco 2 — Dashboard do Requerente `~2h`
- [ ] `DashboardRequerente.jsx` — resumo do caso, status, prioridade, cards de acesso rápido
- [ ] Realtime na tabela `triagens`
- [ ] Estado vazio com botão "Iniciar Triagem"
- **Teste:** Dashboard exibe caso ativo, atualiza status em tempo real

#### Marco 3 — Triagem Social `~4-5h`
- [ ] `TriagemSocial.jsx` — componente multi-step principal
- [ ] 5 etapas: EtapaContato, EtapaFamilia, EtapaMotivo, EtapaUrgencia, EtapaRelato
- [ ] `triagemScoring.js` — cálculo de pontuação (ALTA ≥70, MEDIA ≥30, BAIXA <30)
- [ ] `triagemOptions.js` — constantes de opções
- [ ] Modo edição (`?editar=1`)
- [ ] Revisão antes de enviar
- **Teste:** Fluxo completo com 3 prioridades (ALTA, MEDIA, BAIXA), edição, validação

#### Marco 4 — Chat Caso-a-Caso `~2h`
- [ ] `MensagensCaso.jsx` — componente compartilhado (requerente + assistente)
- [ ] `ChatCaso.jsx` — wrapper para requerente
- [ ] Realtime + deduplicação
- **Teste:** Mensagens em tempo real vinculadas ao caso

#### Marco 5 — Cofre Digital `~2h`
- [ ] `DocumentosCaso.jsx` — componente compartilhado
- [ ] `CofreDigital.jsx` — wrapper para requerente
- [ ] Upload/download/delete com Storage + metadados
- **Teste:** Upload de arquivo, download assinado, delete com permissão

#### Marco 6 — Videochamada com Sala de Espera `~3h`
- [ ] `video.py` — modificar endpoint com `caso_id` opcional
- [ ] `VideoCall.jsx` — wrapper Daily.co compartilhado
- [ ] `VideoRequerente.jsx` — sala de espera + conexão automática
- **Teste:** Sala de espera, conexão via Realtime, sala vinculada ao caso

#### Marco 7 — Plano de Ação `~2h`
- [ ] `PlanoAcaoCaso.jsx` — componente compartilhado
- [ ] `PlanoAcao.jsx` — wrapper para requerente
- [ ] Status cycles + permissões por modo
- **Teste:** Assistente cria tarefas, requerente altera status

#### Checkpoint Final — Validação
- [ ] Todos os 34 cenários de teste do `10-GUIA-TESTES.md` executados
- [ ] RLS validado para todas as 4 tabelas novas
- [ ] Sidebar requerente vs profissional consistentes
- [ ] Fluxo completo: cadastro → triagem → dashboard → chat → documentos → video → plano

## 📋 Futuro
- Dashboard estatístico com gráficos (recharts já instalado)
- Relatórios gerenciais
- Filtros avançados (data, profissional, faixa etária, bairro)
- Exportar estatísticas CSV/PDF
- Mover componentes de páginas para pastas dedicadas (Chat/, Prontuario/, ReportViewer/)
- Notificações push para mudanças de status do caso
- Relatório/pdf do plano de ação para o requerente
