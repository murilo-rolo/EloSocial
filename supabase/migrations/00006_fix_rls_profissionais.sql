-- Migration 00006: Corrigir RLS de documentos_caso e planos_acao
-- para permitir que qualquer profissional veja documentos e tarefas,
-- e permitir que o assistente social do caso exclua tarefas.

-- 1. DOCUMENTOS CASO: adicionar policy SELECT para profissionais
DROP POLICY IF EXISTS "documentos_caso_select_profissional" ON public.documentos_caso;
CREATE POLICY "documentos_caso_select_profissional" ON public.documentos_caso
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role != 'requerente'
    )
  );

-- 2. PLANOS ACAO: adicionar policy SELECT para profissionais
DROP POLICY IF EXISTS "planos_acao_select_profissional" ON public.planos_acao;
CREATE POLICY "planos_acao_select_profissional" ON public.planos_acao
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role != 'requerente'
    )
  );

-- 3. PLANOS ACAO: adicionar policy DELETE (inexistente)
DROP POLICY IF EXISTS "planos_acao_delete" ON public.planos_acao;
CREATE POLICY "planos_acao_delete" ON public.planos_acao
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (user_id = auth.uid() OR assistente_social_id = auth.uid())
    )
  );
