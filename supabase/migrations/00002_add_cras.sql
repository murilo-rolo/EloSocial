-- =============================================
-- EloSocial - Adiciona vínculo com CRAS
-- =============================================

-- 1. Adicionar coluna cras em profiles
ALTER TABLE public.profiles ADD COLUMN cras TEXT NOT NULL DEFAULT 'CRAS Guamá'
  CHECK (cras IN (
    'CRAS Aurá', 'CRAS Barreiro', 'CRAS Benguí', 'CRAS Cremação',
    'CRAS Guamá', 'CRAS Icoaraci', 'CRAS Jurunas', 'CRAS Mosqueiro',
    'CRAS Outeiro', 'CRAS Pedreira', 'CRAS Tapanã', 'CRAS Terra Firme'
  ));

-- 2. Atualizar trigger handle_new_user para propagar cras
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role, cras)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico'),
    COALESCE(NEW.raw_user_meta_data->>'cras', 'CRAS Guamá')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar RLS de profiles
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR
    (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gerente')
      AND
      cras = (SELECT cras FROM public.profiles WHERE id = auth.uid())
    )
  );
