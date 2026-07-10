# Modelo de Dados (Supabase — 16 tabelas + extensões)

## Migrations

| # | Arquivo | Descrição |
|---|---|---|
| 00001 | `schema.sql` | Schema completo: 16 tabelas, RLS, triggers, funções RPC, indexes, realtime |
| 00002 | `storage.sql` | Buckets de storage: prontuario_anexos, documentos-caso |

## Tabelas

1. **profiles** — Estende `auth.users`. Campos: `id` (FK), `nome`, `email`, `role` (enum: assistente_social, psicologo, pedagogo, tecnico, gerente, requerente), `ativo`, `cras` (TEXT, CHECK 12 unidades), `telefone`, `cpf`, `nome_mae`, `rg`, `rg_orgao`, `rg_uf`, `rg_data_emissao`, `data_nascimento`, `sexo`, `created_at`
2. **applicants** — Requerentes. `id` (UUID PK), `nis` (unique), `nome`, `nome_mae`, `cpf` (unique), `rg`, `rg_orgao`, `rg_uf`, `rg_data_emissao`, `data_nascimento`, `sexo`, `telefone`, `endereco` (JSONB), `ponto_referencia`, `composicao_familiar` (JSONB), `observacoes`, `vulnerabilidade_score`, `vulnerabilidade_cor`, `vulnerabilidade_motivo`, `created_by` (FK profiles), `created_at`, `updated_at`
3. **prontuarios** — Relatórios. `id` (UUID PK), `applicant_id` (FK), `created_by` (FK), `dados_json` (JSONB), `hash_assinatura`, `assinado_por` (FK), `assinado_em`, `versao` (int), `created_at`, `updated_at`
4. **prontuario_anexos** — Anexos de prontuário. `id` (UUID PK), `prontuario_id` (FK cascade), `nome_arquivo`, `caminho_storage`, `tamanho`, `created_by` (FK), `created_at`. Storage bucket: `prontuario_anexos`
5. **atendimentos** — Histórico. `id` (UUID PK), `prontuario_id` (FK), `profissional_id` (FK), `data_atendimento`, `tipo_atendimento`, `descricao`, `observacoes`, `created_at`
6. **agendamentos** — Agenda. `id` (UUID PK), `profissional_id` (FK), `applicant_id` (FK cascade), `data_hora` (TIMESTAMPTZ), `tipo`, `status` (Pendente/Concluido/Cancelado/Faltou), `observacoes`, `created_by` (FK), `created_at`, `updated_at`
7. **messages** — Chat. `id` (UUID PK), `remetente_id` (FK), `destinatario_id` (FK), `grupo`, `conteudo`, `lida`, `created_at`. **Realtime habilitado**
8. **audit_logs** — Auditoria. `id` (UUID PK), `user_id` (FK), `acao`, `detalhes` (JSONB), `ip`, `created_at`
9. **video_rooms** — Salas de videoconferencia. `id` (UUID PK), `room_name` (unique), `room_url`, `created_by` (FK profiles), `privacy` (public/private), `access_code` (nullable), `expires_at`, `created_at`. **Realtime habilitado**
10. **video_participants** — Participantes. `id` (UUID PK), `room_id` (FK video_rooms), `user_id` (FK profiles), `joined_at`, unique(room_id, user_id)
11. **triagens** — Triagem social. `id` (UUID PK), `user_id` (FK profiles), `applicant_id` (FK applicants, unique), `status`, `prioridade`, `dados_acolhimento` (JSONB), `detalhes`, `sintomas` (text[]), `assistente_social_id` (FK), daily_room_*, `created_at`, `updated_at`. **Realtime habilitado**
12. **mensagens_caso** — Chat do caso. `id` (UUID PK), `caso_id` (FK triagens), `remetente_id` (FK), `remetente_nome`, `remetente_tipo`, `conteudo`, `lida`, `created_at`. **Realtime habilitado**
13. **planos_acao** — Planos de acao. `id` (UUID PK), `caso_id` (FK triagens), `titulo`, `descricao`, `status`, `responsavel`, `data_limite`, `created_by` (FK), `created_by_tipo`, `created_at`, `updated_at`. **Realtime habilitado**
14. **documentos_caso** — Documentos do caso. `id` (UUID PK), `caso_id` (FK triagens), `nome`, `tipo`, `tamanho`, `storage_path`, `uploaded_by` (FK), `uploaded_by_tipo`, `descricao`, `created_at`. **Realtime habilitado**
15. **knowledge_documents** — Documentos da base de conhecimento RAG. `id` (UUID PK), `title`, `content`, `created_by` (FK auth.users), `created_at`
16. **knowledge_chunks** — Chunks vetorizados. `id` (UUID PK), `document_id` (FK cascade), `chunk_text`, `embedding` (VECTOR 768d), `fts` (tsvector, gerado automaticamente)

## RLS

- **profiles:** SELECT autenticados, UPDATE (proprio ou gerente do mesmo CRAS)
- **applicants:** ALL autenticados (compartilhado na rede)
- **prontuarios:** SELECT/INSERT autenticados, UPDATE (criador ou gerente)
- **prontuario_anexos:** SELECT/INSERT autenticados, DELETE (criador ou gerente)
- **atendimentos:** SELECT/INSERT autenticados
- **agendamentos:** ALL autenticados
- **messages:** SELECT (proprias ou de grupo), INSERT autenticados
- **audit_logs:** SELECT so gerente, INSERT autenticados
- **video_rooms:** SELECT (criador ou participante), INSERT (criador), UPDATE (criador)
- **video_participants:** SELECT/INSERT (proprio)
- **triagens:** SELECT requerente (proprio) / profissional (todos), INSERT requerente (proprio), UPDATE requerente/profissional
- **mensagens_caso:** SELECT/INSERT/UPDATE participantes do caso
- **planos_acao:** SELECT participantes do caso, INSERT assistente, UPDATE participantes
- **documentos_caso:** SELECT/INSERT/DELETE participantes do caso
- **knowledge_documents:** SELECT/INSERT autenticados
- **knowledge_chunks:** SELECT/INSERT autenticados

## Triggers

- `handle_new_user()` (AFTER INSERT `auth.users`) — Cria `profiles` com dados de `raw_user_meta_data` (nome, role, cras, telefone, cpf, nome_mae, rg, rg_orgao, rg_uf, rg_data_emissao, data_nascimento, sexo)
- `validate_institutional_email()` (BEFORE INSERT `auth.users`) — Rejeita emails fora de `%.gov.br` ou `%.gov.com.br` (pula para requerente)
- `handle_new_requerente()` (AFTER INSERT `profiles`) — Cria `applicants` copiando dados de `profiles` para requerentes

## Funcoes RPC (RAG)

- `match_knowledge_chunks(query_embedding, match_threshold, match_count)` — Busca semantica por similaridade de cosseno
- `hybrid_search_knowledge(query_text, query_embedding, match_threshold, match_count)` — Busca hibrida (semantica + lexical/full-text)

## Storage

- Bucket `prontuario_anexos` — SELECT/INSERT/DELETE autenticados
- Bucket `documentos-caso` — SELECT/INSERT/DELETE participantes do caso

## Realtime

- messages, video_rooms, triagens, mensagens_caso, planos_acao, documentos_caso
