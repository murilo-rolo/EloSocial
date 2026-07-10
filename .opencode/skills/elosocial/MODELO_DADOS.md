# Modelo de Dados (Supabase — 12 tabelas + extensões)

## Migrations

| # | Arquivo | Descrição |
|---|---|---|
| 00001 | `schema.sql` | Schema inicial: profiles, applicants, prontuarios, atendimentos, messages, audit_logs |
| 00002 | `add_cras.sql` | Coluna `cras` em profiles + RLS |
| 00003 | `video_rooms.sql` | Tabelas video_rooms, video_participants + RLS |
| 00004 | `prontuario_anexos.sql` | Tabela prontuario_anexos + storage bucket |
| 00005 | `agendamentos.sql` | Tabela agendamentos (sessões, visitas) |
| 00006 | `triagem_vulnerabilidade.sql` | Colunas vulnerabilidade_* em applicants |
| 00007 | `rag_pgvector.sql` | Extensão pgvector, knowledge_documents, knowledge_chunks, RPC match_knowledge_chunks |
| 00008 | `rag_hybrid_search.sql` | Coluna fts (tsvector), RPC hybrid_search_knowledge |
| 00009 | `realtime_messages.sql` | Habilita realtime para tabela messages |
| 00010 | `remove_localizacao.sql` | Remove coluna localizacao de applicants |

## Tabelas

1. **profiles** — Estende `auth.users`. Campos: `id` (FK), `nome`, `email`, `role` (enum: assistente_social, psicologo, pedagogo, tecnico, gerente), `ativo`, `cras` (TEXT, CHECK 12 unidades), `created_at`
2. **applicants** — Requerentes. `id` (UUID PK), `nis` (unique), `nome`, `cpf` (unique), `rg`, `rg_orgao`, `rg_uf`, `rg_data_emissao`, `data_nascimento`, `sexo`, `telefone`, `endereco` (JSONB), `ponto_referencia`, `composicao_familiar` (JSONB), `observacoes`, `created_by` (FK profiles), `created_at`, `updated_at`, `vulnerabilidade_score`, `vulnerabilidade_cor`, `vulnerabilidade_motivo`
3. **prontuarios** — Relatórios. `id` (UUID PK), `applicant_id` (FK), `created_by` (FK), `dados_json` (JSONB), `hash_assinatura`, `assinado_por` (FK), `assinado_em`, `versao` (int), `created_at`, `updated_at`
4. **prontuario_anexos** — Anexos de prontuário. `id` (UUID PK), `prontuario_id` (FK cascade), `nome_arquivo`, `caminho_storage`, `tamanho`, `created_by` (FK), `created_at`. Storage bucket: `prontuario_anexos`
5. **atendimentos** — Histórico. `id` (UUID PK), `prontuario_id` (FK), `profissional_id` (FK), `data_atendimento`, `tipo_atendimento`, `descricao`, `observacoes`, `created_at`
6. **agendamentos** — Agenda. `id` (UUID PK), `profissional_id` (FK), `applicant_id` (FK cascade), `data_hora` (TIMESTAMPTZ), `tipo`, `status` (Pendente/Concluído/Cancelado/Faltou), `observacoes`, `created_by` (FK), `created_at`, `updated_at`
7. **messages** — Chat. `id` (UUID PK), `remetente_id` (FK), `destinatario_id` (FK), `grupo`, `conteudo`, `lida`, `created_at`. **Realtime habilitado**
8. **audit_logs** — Auditoria. `id` (UUID PK), `user_id` (FK), `acao`, `detalhes` (JSONB), `ip`, `created_at`
9. **video_rooms** — Salas de videoconferência. `id` (UUID PK), `room_name` (unique), `room_url`, `created_by` (FK profiles), `privacy` (public/private), `access_code` (nullable), `expires_at`, `created_at`
10. **video_participants** — Participantes. `id` (UUID PK), `room_id` (FK video_rooms), `user_id` (FK profiles), `joined_at`, unique(room_id, user_id)
11. **knowledge_documents** — Documentos da base de conhecimento RAG. `id` (UUID PK), `title`, `content`, `created_by` (FK auth.users), `created_at`
12. **knowledge_chunks** — Chunks vetorizados. `id` (UUID PK), `document_id` (FK cascade), `chunk_text`, `embedding` (VECTOR 768d), `fts` (tsvector, gerado automaticamente)

## RLS

- **profiles:** SELECT autenticados, UPDATE (próprio ou gerente do mesmo CRAS)
- **applicants:** ALL autenticados (compartilhado na rede)
- **prontuarios:** SELECT/INSERT autenticados, UPDATE (criador ou gerente)
- **prontuario_anexos:** SELECT/INSERT autenticados, DELETE (criador ou gerente)
- **atendimentos:** SELECT/INSERT autenticados
- **agendamentos:** ALL autenticados
- **messages:** SELECT (próprias ou de grupo), INSERT autenticados
- **audit_logs:** SELECT só gerente, INSERT autenticados
- **video_rooms:** SELECT (criador ou participante), INSERT (criador), UPDATE (criador)
- **video_participants:** SELECT/INSERT (próprio)
- **knowledge_documents:** SELECT/INSERT autenticados
- **knowledge_chunks:** SELECT/INSERT autenticados

## Triggers

- `handle_new_user()` (AFTER INSERT `auth.users`) — Cria `profiles` com dados de `raw_user_meta_data` (`nome`, `role`, `cras`)
- `validate_institutional_email()` (BEFORE INSERT `auth.users`) — Rejeita emails fora de `%.gov.br` ou `%.gov.com.br`

## Funções RPC (RAG)

- `match_knowledge_chunks(query_embedding, match_threshold, match_count)` — Busca semântica por similaridade de cosseno
- `hybrid_search_knowledge(query_text, query_embedding, match_threshold, match_count)` — Busca híbrida (semântica + lexical/full-text)
