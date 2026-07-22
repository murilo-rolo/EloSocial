-- Migration 00003: Chat requerente com direcionamento
-- Adiciona destinatario_id e atualiza RLS para permitir qualquer profissional

-- 1. Nova coluna destinatario_id
ALTER TABLE public.mensagens_caso
  ADD COLUMN destinatario_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_mensagens_caso_destinatario ON public.mensagens_caso(destinatario_id);

-- 2. Remover políticas antigas de mensagens_caso
DROP POLICY IF EXISTS "mensagens_caso_select" ON public.mensagens_caso;
DROP POLICY IF EXISTS "mensagens_caso_insert" ON public.mensagens_caso;
DROP POLICY IF EXISTS "mensagens_caso_update" ON public.mensagens_caso;

-- 3. Novas políticas: qualquer profissional autenticado pode acessar
-- SELECT: requerente do caso OR qualquer profissional
CREATE POLICY "mensagens_caso_select" ON public.mensagens_caso
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role != 'requerente'
    )
  );

-- INSERT: remetente é o próprio usuário E (requerente do caso OR qualquer profissional)
CREATE POLICY "mensagens_caso_insert" ON public.mensagens_caso
  FOR INSERT WITH CHECK (
    remetente_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.triagens
        WHERE id = caso_id AND user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role != 'requerente'
      )
    )
  );

-- UPDATE: remetente é o próprio usuário OR (requerente do caso OR qualquer profissional)
CREATE POLICY "mensagens_caso_update" ON public.mensagens_caso
  FOR UPDATE USING (
    remetente_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role != 'requerente'
    )
  );
