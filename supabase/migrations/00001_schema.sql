-- =============================================
-- EloSocial - Schema Inicial
-- Prontuário Eletrônico SUAS
-- =============================================

-- 1. PROFILES (estende auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'assistente_social', 'psicologo', 'pedagogo', 'tecnico', 'gerente'
  )),
  email TEXT NOT NULL,
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. APPLICANTS (requerentes)
CREATE TABLE public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nis TEXT UNIQUE,
  nome TEXT NOT NULL,
  nome_mae TEXT,
  cpf TEXT UNIQUE,
  rg TEXT,
  rg_orgao TEXT,
  rg_uf TEXT,
  rg_data_emissao DATE,
  data_nascimento DATE,
  sexo TEXT,
  telefone TEXT,
  endereco JSONB,
  localizacao TEXT CHECK (localizacao IN ('urbano', 'rural')),
  ponto_referencia TEXT,
  composicao_familiar JSONB,
  observacoes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRONTUARIOS
CREATE TABLE public.prontuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  dados_json JSONB NOT NULL,
  hash_assinatura TEXT,
  assinado_por UUID REFERENCES public.profiles(id),
  assinado_em TIMESTAMPTZ,
  versao INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ATENDIMENTOS (histórico cronológico)
CREATE TABLE public.atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prontuario_id UUID REFERENCES public.prontuarios(id) ON DELETE CASCADE NOT NULL,
  profissional_id UUID REFERENCES public.profiles(id) NOT NULL,
  data_atendimento TIMESTAMPTZ NOT NULL,
  tipo_atendimento TEXT NOT NULL,
  descricao TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. MESSAGES (chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remetente_id UUID REFERENCES public.profiles(id) NOT NULL,
  destinatario_id UUID REFERENCES public.profiles(id),
  grupo TEXT,
  conteudo TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  acao TEXT NOT NULL,
  detalhes JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- APPLICANTS: todos os autenticados podem CRUD
CREATE POLICY "applicants_select" ON public.applicants
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "applicants_insert" ON public.applicants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "applicants_update" ON public.applicants
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "applicants_delete" ON public.applicants
  FOR DELETE USING (auth.role() = 'authenticated');

-- PRONTUARIOS: todos veem, criam; só gerente ou criador atualiza
CREATE POLICY "prontuarios_select" ON public.prontuarios
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "prontuarios_insert" ON public.prontuarios
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "prontuarios_update" ON public.prontuarios
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gerente')
  );

-- ATENDIMENTOS: todos veem, inserem
CREATE POLICY "atendimentos_select" ON public.atendimentos
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "atendimentos_insert" ON public.atendimentos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- MESSAGES: veem só as próprias ou de grupo
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    remetente_id = auth.uid() OR
    destinatario_id = auth.uid() OR
    grupo IS NOT NULL
  );
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- AUDIT LOGS: gerente vê, sistema insere
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gerente')
  );
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- TRIGGERS
-- =============================================

-- Criar profile automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Validação de domínio de email institucional
CREATE OR REPLACE FUNCTION public.validate_institutional_email()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
BEGIN
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

CREATE OR REPLACE TRIGGER on_auth_user_email_validation
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_institutional_email();

-- =============================================
-- SEED: Gerente inicial
-- =============================================

-- Nota: Criar um usuário via Supabase Auth ou pelo dashboard
-- Exemplo manual (executar após criar usuário no Auth):
-- INSERT INTO public.profiles (id, nome, email, role)
-- VALUES ('UUID-DO-USUARIO', 'Administrador', 'admin@instituicao.gov.br', 'gerente');
