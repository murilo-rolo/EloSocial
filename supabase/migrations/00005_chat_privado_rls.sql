-- Migration 00005: Chat privado por profissional
-- Cada profissional vê apenas mensagens onde é remetente ou destinatário.
-- Requerente também vê apenas mensagens onde é remetente ou destinatário.

-- 1. Preencher destinatario_id retroativo para mensagens de profissionais
-- que não tinham destinatario_id definido (anteriores à migração 00003).
-- O destinatário padrão é o requerente dono do caso.
UPDATE public.mensagens_caso
SET destinatario_id = (
  SELECT user_id FROM public.triagens WHERE id = mensagens_caso.caso_id
)
WHERE destinatario_id IS NULL
  AND remetente_tipo = 'assistente';

-- 2. Remover política SELECT antiga
DROP POLICY IF EXISTS "mensagens_caso_select" ON public.mensagens_caso;

-- 3. Nova política SELECT: cada um vê apenas mensagens onde é parte
CREATE POLICY "mensagens_caso_select" ON public.mensagens_caso
  FOR SELECT USING (
    remetente_id = auth.uid()
    OR
    destinatario_id = auth.uid()
  );
