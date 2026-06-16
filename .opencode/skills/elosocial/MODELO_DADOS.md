# Modelo de Dados (Supabase — 8 tabelas)

## Tabelas

1. **profiles** — Estende `auth.users`. Campos: `id` (FK), `nome`, `email`, `role` (enum: assistente_social, psicologo, pedagogo, tecnico, gerente), `ativo`, `cras` (TEXT, CHECK 12 unidades), `created_at`
2. **applicants** — Requerentes. `id` (UUID PK), `nis` (unique), `nome`, `cpf` (unique), `rg`, `rg_orgao`, `rg_uf`, `rg_data_emissao`, `data_nascimento`, `sexo`, `telefone`, `endereco` (JSONB), `localizacao` (urbano/rural), `ponto_referencia`, `composicao_familiar` (JSONB), `observacoes`, `created_by` (FK profiles), `created_at`, `updated_at`
3. **prontuarios** — Relatórios. `id` (UUID PK), `applicant_id` (FK), `created_by` (FK), `dados_json` (JSONB), `hash_assinatura`, `assinado_por` (FK), `assinado_em`, `versao` (int), `created_at`, `updated_at`
4. **atendimentos** — Histórico. `id` (UUID PK), `prontuario_id` (FK), `profissional_id` (FK), `data_atendimento`, `tipo_atendimento`, `descricao`, `observacoes`, `created_at`
5. **messages** — Chat. `id` (UUID PK), `remetente_id` (FK), `destinatario_id` (FK), `grupo`, `conteudo`, `lida`, `created_at`
6. **audit_logs** — Auditoria. `id` (UUID PK), `user_id` (FK), `acao`, `detalhes` (JSONB), `ip`, `created_at`
7. **video_rooms** — Salas de videoconferência. `id` (UUID PK), `room_name` (unique), `room_url`, `created_by` (FK profiles), `privacy` (public/private), `access_code` (nullable), `expires_at`, `created_at`
8. **video_participants** — Participantes. `id` (UUID PK), `room_id` (FK video_rooms), `user_id` (FK profiles), `joined_at`, unique(room_id, user_id)

## RLS

- **profiles:** SELECT autenticados, UPDATE (próprio ou gerente do mesmo CRAS)
- **applicants:** ALL autenticados (compartilhado na rede)
- **prontuarios:** SELECT/INSERT autenticados, UPDATE (criador ou gerente)
- **atendimentos:** SELECT/INSERT autenticados
- **messages:** SELECT (próprias ou de grupo), INSERT autenticados
- **audit_logs:** SELECT só gerente, INSERT autenticados
- **video_rooms:** SELECT (criador ou participante), INSERT (criador), UPDATE (criador)
- **video_participants:** SELECT/INSERT (próprio)

## Triggers

- `handle_new_user()` (AFTER INSERT `auth.users`) — Cria `profiles` com dados de `raw_user_meta_data` (`nome`, `role`, `cras`)
- `validate_institutional_email()` (BEFORE INSERT `auth.users`) — Rejeita emails fora de `%.gov.br` ou `%.gov.com.br`
