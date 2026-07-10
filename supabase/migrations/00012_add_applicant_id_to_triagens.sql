-- =============================================
-- EloSocial - Link triagens <-> applicants
-- Migration 00012
-- =============================================

-- 1. Adicionar coluna applicant_id em triagens
ALTER TABLE public.triagens
  ADD COLUMN applicant_id UUID REFERENCES public.applicants(id) ON DELETE SET NULL;

CREATE INDEX idx_triagens_applicant_id ON public.triagens(applicant_id);

-- 2. Backfill: vincular triagens existentes ao applicant correspondente
--    Usa o profiles.id (user_id da triagem) para encontrar o applicant
--    cujo created_by aponta para o mesmo profiles.id
UPDATE public.triagens t
SET applicant_id = a.id
FROM public.applicants a
WHERE a.created_by = t.user_id
  AND t.applicant_id IS NULL;

-- 3. Atualizar RLS: profissional também pode ver triagens por applicant_id
DROP POLICY IF EXISTS "triagens_select_profissional" ON public.triagens;
CREATE POLICY "triagens_select_profissional" ON public.triagens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role != 'requerente'
    )
  );
