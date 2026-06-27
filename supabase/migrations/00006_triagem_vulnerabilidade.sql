-- Adiciona colunas para a Triagem Inteligente de Vulnerabilidade (IA)
ALTER TABLE applicants
ADD COLUMN vulnerabilidade_score TEXT,
ADD COLUMN vulnerabilidade_cor TEXT,
ADD COLUMN vulnerabilidade_motivo TEXT;