-- =============================================
-- EloSocial - Garante uma triagem por requerente
-- Migration 00013
-- =============================================

-- 1. Remover triagens duplicadas com mesmo applicant_id (manter a mais recente)
DELETE FROM public.triagens t1
USING public.triagens t2
WHERE t1.applicant_id = t2.applicant_id
  AND t1.applicant_id IS NOT NULL
  AND t1.created_at < t2.created_at;

-- 2. Adicionar constraint UNIQUE em applicant_id (previne triagens duplicadas)
ALTER TABLE public.triagens
  ADD CONSTRAINT triagens_applicant_id_unique UNIQUE (applicant_id);
