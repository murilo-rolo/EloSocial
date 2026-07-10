-- =============================================
-- EloSocial - Role Requerente + 7 Features
-- Migration 00011
-- =============================================

-- 1. Adicionar 'requerente' ao CHECK constraint de role
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'assistente_social', 'psicologo', 'pedagogo', 'tecnico', 'gerente', 'requerente'
  ));

-- 2. Modificar trigger: pular validação de email para requerente
CREATE OR REPLACE FUNCTION public.validate_institutional_email()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
  user_role TEXT;
BEGIN
  user_role := NEW.raw_user_meta_data->>'role';
  IF user_role = 'requerente' THEN
    RETURN NEW;
  END IF;
  email_domain := SPLIT_PART(NEW.email, '@', 2);
  IF NOT (
    email_domain = 'gov.br' OR email_domain LIKE '%.gov.br' OR
    email_domain = 'gov.com.br' OR email_domain LIKE '%.gov.com.br'
  ) THEN
    RAISE EXCEPTION 'Email institucional inválido. Use um email com domínio gov.br';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. TABELA: triagens
-- =============================================
CREATE TABLE public.triagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'em_analise', 'em_atendimento', 'concluido', 'cancelado'
  )),
  prioridade TEXT CHECK (prioridade IN ('ALTA', 'MEDIA', 'BAIXA')),
  dados_acolhimento JSONB NOT NULL DEFAULT '{}',
  detalhes TEXT,
  sintomas TEXT[],
  assistente_social_id UUID REFERENCES public.profiles(id),
  daily_room_name TEXT,
  daily_room_url TEXT,
  daily_room_created_at TIMESTAMPTZ,
  daily_room_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_triagens_user_id ON public.triagens(user_id);
CREATE INDEX idx_triagens_status ON public.triagens(status);
CREATE INDEX idx_triagens_assistente ON public.triagens(assistente_social_id);

ALTER TABLE public.triagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "triagens_select_requerente" ON public.triagens
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "triagens_select_profissional" ON public.triagens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role != 'requerente'
    )
  );

CREATE POLICY "triagens_insert_requerente" ON public.triagens
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "triagens_update_profissional" ON public.triagens
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role != 'requerente'
    )
  );

CREATE POLICY "triagens_update_requerente" ON public.triagens
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- =============================================
-- 4. TABELA: mensagens_caso
-- =============================================
CREATE TABLE public.mensagens_caso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES public.triagens(id) ON DELETE CASCADE NOT NULL,
  remetente_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  remetente_nome TEXT,
  remetente_tipo TEXT CHECK (remetente_tipo IN ('requerente', 'assistente')),
  conteudo TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mensagens_caso_caso ON public.mensagens_caso(caso_id);
CREATE INDEX idx_mensagens_caso_remetente ON public.mensagens_caso(remetente_id);

ALTER TABLE public.mensagens_caso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mensagens_caso_select" ON public.mensagens_caso
  FOR SELECT USING (
    remetente_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

CREATE POLICY "mensagens_caso_insert" ON public.mensagens_caso
  FOR INSERT WITH CHECK (
    remetente_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

CREATE POLICY "mensagens_caso_update" ON public.mensagens_caso
  FOR UPDATE USING (
    remetente_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

-- =============================================
-- 5. TABELA: planos_acao
-- =============================================
CREATE TABLE public.planos_acao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES public.triagens(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'em_andamento', 'concluido'
  )),
  responsavel TEXT CHECK (responsavel IN ('requerente', 'assistente', 'ambos')),
  data_limite DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_by_tipo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_planos_acao_caso ON public.planos_acao(caso_id);

ALTER TABLE public.planos_acao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planos_acao_select" ON public.planos_acao
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

CREATE POLICY "planos_acao_insert" ON public.planos_acao
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND assistente_social_id = auth.uid()
    )
  );

CREATE POLICY "planos_acao_update" ON public.planos_acao
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

-- =============================================
-- 6. TABELA: documentos_caso
-- =============================================
CREATE TABLE public.documentos_caso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES public.triagens(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_by_tipo TEXT,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documentos_caso_caso ON public.documentos_caso(caso_id);

ALTER TABLE public.documentos_caso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documentos_caso_select" ON public.documentos_caso
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

CREATE POLICY "documentos_caso_insert" ON public.documentos_caso
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

CREATE POLICY "documentos_caso_delete" ON public.documentos_caso
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

-- =============================================
-- 7. STORAGE BUCKET: documentos-caso
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-caso', 'documentos-caso', false);

-- Upload: apenas participantes do caso
CREATE POLICY "documentos_caso_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos-caso' AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = (string_to_array(name, '/'))[1]::uuid AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

-- Download: apenas participantes do caso
CREATE POLICY "documentos_caso_download" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos-caso' AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = (string_to_array(name, '/'))[1]::uuid AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

-- Delete: apenas participantes do caso
CREATE POLICY "documentos_caso_delete_storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documentos-caso' AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = (string_to_array(name, '/'))[1]::uuid AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

-- =============================================
-- 8. HABILITAR REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_caso;
ALTER PUBLICATION supabase_realtime ADD TABLE public.triagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planos_acao;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documentos_caso;
