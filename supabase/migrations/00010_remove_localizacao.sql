-- Remove coluna localizacao da tabela applicants
alter table public.applicants drop column if exists localizacao;
