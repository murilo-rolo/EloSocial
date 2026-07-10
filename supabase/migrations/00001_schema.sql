-- =============================================
-- EloSocial - Schema Consolidado
-- Prontuário Eletrônico SUAS
-- =============================================

-- =============================================
-- 1. TABELAS
-- =============================================

-- 1.1 PROFILES (estende auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'assistente_social', 'psicologo', 'pedagogo', 'tecnico', 'gerente', 'requerente'
  )),
  email TEXT NOT NULL,
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT true,
  cras TEXT NOT NULL DEFAULT 'CRAS Guamá'
    CHECK (cras IN (
      'CRAS Aurá', 'CRAS Barreiro', 'CRAS Benguí', 'CRAS Cremação',
      'CRAS Guamá', 'CRAS Icoaraci', 'CRAS Jurunas', 'CRAS Mosqueiro',
      'CRAS Outeiro', 'CRAS Pedreira', 'CRAS Tapanã', 'CRAS Terra Firme'
    )),
  telefone TEXT,
  cpf TEXT,
  nome_mae TEXT,
  rg TEXT,
  rg_orgao TEXT,
  rg_uf TEXT,
  rg_data_emissao DATE,
  data_nascimento DATE,
  sexo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 APPLICANTS (requerentes)
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
  ponto_referencia TEXT,
  composicao_familiar JSONB,
  observacoes TEXT,
  vulnerabilidade_score TEXT,
  vulnerabilidade_cor TEXT,
  vulnerabilidade_motivo TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3 PRONTUARIOS
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

-- 1.4 ATENDIMENTOS (histórico cronológico)
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

-- 1.5 MESSAGES (chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remetente_id UUID REFERENCES public.profiles(id) NOT NULL,
  destinatario_id UUID REFERENCES public.profiles(id),
  grupo TEXT,
  conteudo TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.6 AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  acao TEXT NOT NULL,
  detalhes JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.7 VIDEO ROOMS
CREATE TABLE public.video_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name TEXT UNIQUE NOT NULL,
  room_url TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
  access_code TEXT,
  expires_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.8 VIDEO PARTICIPANTS
CREATE TABLE public.video_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.video_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- 1.9 PRONTUARIO ANEXOS
CREATE TABLE public.prontuario_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prontuario_id UUID REFERENCES public.prontuarios(id) ON DELETE CASCADE NOT NULL,
  nome_arquivo TEXT NOT NULL,
  caminho_storage TEXT NOT NULL,
  tamanho INTEGER,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.10 AGENDAMENTOS
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Concluido', 'Cancelado', 'Faltou')),
  observacoes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.11 TRIAGENS
CREATE TABLE public.triagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES public.applicants(id) ON DELETE SET NULL UNIQUE,
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

-- 1.12 MENSAGENS CASO
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

-- 1.13 PLANOS DE AÇÃO
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

-- 1.14 DOCUMENTOS CASO
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

-- 1.15 KNOWLEDGE DOCUMENTS (RAG)
CREATE TABLE public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.16 KNOWLEDGE CHUNKS (RAG)
CREATE TABLE public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(768),
  fts TSVECTOR GENERATED ALWAYS AS (to_tsvector('portuguese', chunk_text)) STORED
);

-- =============================================
-- 2. INDEXES
-- =============================================

CREATE INDEX idx_triagens_user_id ON public.triagens(user_id);
CREATE INDEX idx_triagens_status ON public.triagens(status);
CREATE INDEX idx_triagens_assistente ON public.triagens(assistente_social_id);
CREATE INDEX idx_triagens_applicant_id ON public.triagens(applicant_id);
CREATE INDEX idx_mensagens_caso_caso ON public.mensagens_caso(caso_id);
CREATE INDEX idx_mensagens_caso_remetente ON public.mensagens_caso(remetente_id);
CREATE INDEX idx_planos_acao_caso ON public.planos_acao(caso_id);
CREATE INDEX idx_documentos_caso_caso ON public.documentos_caso(caso_id);
CREATE INDEX idx_knowledge_chunks_fts ON public.knowledge_chunks USING GIN (fts);

-- =============================================
-- 3. EXTENSÕES
-- =============================================

CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- 4. RLS
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prontuario_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_caso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_acao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_caso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR
    (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gerente')
      AND
      cras = (SELECT cras FROM public.profiles WHERE id = auth.uid())
    )
  );

-- APPLICANTS
CREATE POLICY "applicants_select" ON public.applicants
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "applicants_insert" ON public.applicants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "applicants_update" ON public.applicants
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "applicants_delete" ON public.applicants
  FOR DELETE USING (auth.role() = 'authenticated');

-- PRONTUARIOS
CREATE POLICY "prontuarios_select" ON public.prontuarios
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "prontuarios_insert" ON public.prontuarios
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "prontuarios_update" ON public.prontuarios
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gerente')
  );

-- ATENDIMENTOS
CREATE POLICY "atendimentos_select" ON public.atendimentos
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "atendimentos_insert" ON public.atendimentos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- MESSAGES
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    remetente_id = auth.uid() OR
    destinatario_id = auth.uid() OR
    grupo IS NOT NULL
  );
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- AUDIT LOGS
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gerente')
  );
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- VIDEO ROOMS
CREATE POLICY "video_rooms_select" ON public.video_rooms
  FOR SELECT USING (
    created_by = auth.uid()
    OR id IN (SELECT room_id FROM public.video_participants WHERE user_id = auth.uid())
  );
CREATE POLICY "video_rooms_insert" ON public.video_rooms
  FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "video_rooms_update" ON public.video_rooms
  FOR UPDATE USING (created_by = auth.uid());

-- VIDEO PARTICIPANTS
CREATE POLICY "video_participants_select" ON public.video_participants
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "video_participants_insert" ON public.video_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- PRONTUARIO ANEXOS
CREATE POLICY "prontuario_anexos_select" ON public.prontuario_anexos
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "prontuario_anexos_insert" ON public.prontuario_anexos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "prontuario_anexos_delete" ON public.prontuario_anexos
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gerente')
  );

-- AGENDAMENTOS
CREATE POLICY "agendamentos_select" ON public.agendamentos
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "agendamentos_insert" ON public.agendamentos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "agendamentos_update" ON public.agendamentos
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "agendamentos_delete" ON public.agendamentos
  FOR DELETE USING (auth.role() = 'authenticated');

-- TRIAGENS
CREATE POLICY "triagens_select_requerente" ON public.triagens
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "triagens_select_profissional" ON public.triagens
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role != 'requerente')
  );
CREATE POLICY "triagens_insert_requerente" ON public.triagens
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "triagens_update_profissional" ON public.triagens
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role != 'requerente')
  );
CREATE POLICY "triagens_update_requerente" ON public.triagens
  FOR UPDATE USING (user_id = auth.uid());

-- MENSAGENS CASO
CREATE POLICY "mensagens_caso_select" ON public.mensagens_caso
  FOR SELECT USING (
    remetente_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (user_id = auth.uid() OR assistente_social_id = auth.uid())
    )
  );
CREATE POLICY "mensagens_caso_insert" ON public.mensagens_caso
  FOR INSERT WITH CHECK (
    remetente_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (user_id = auth.uid() OR assistente_social_id = auth.uid())
    )
  );
CREATE POLICY "mensagens_caso_update" ON public.mensagens_caso
  FOR UPDATE USING (
    remetente_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (user_id = auth.uid() OR assistente_social_id = auth.uid())
    )
  );

-- PLANOS DE AÇÃO
CREATE POLICY "planos_acao_select" ON public.planos_acao
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (user_id = auth.uid() OR assistente_social_id = auth.uid())
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
      WHERE id = caso_id AND (user_id = auth.uid() OR assistente_social_id = auth.uid())
    )
  );

-- DOCUMENTOS CASO
CREATE POLICY "documentos_caso_select" ON public.documentos_caso
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (user_id = auth.uid() OR assistente_social_id = auth.uid())
    )
  );
CREATE POLICY "documentos_caso_insert" ON public.documentos_caso
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (user_id = auth.uid() OR assistente_social_id = auth.uid())
    )
  );
CREATE POLICY "documentos_caso_delete" ON public.documentos_caso
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (user_id = auth.uid() OR assistente_social_id = auth.uid())
    )
  );

-- KNOWLEDGE DOCUMENTS
CREATE POLICY "knowledge_documents_select" ON public.knowledge_documents
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "knowledge_documents_insert" ON public.knowledge_documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- KNOWLEDGE CHUNKS
CREATE POLICY "knowledge_chunks_select" ON public.knowledge_chunks
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "knowledge_chunks_insert" ON public.knowledge_chunks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- 5. FUNÇÕES E TRIGGERS
-- =============================================

-- 5.1 Criar profile automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role, cras, telefone, cpf, nome_mae, rg, rg_orgao, rg_uf, rg_data_emissao, data_nascimento, sexo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuario'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico'),
    COALESCE(NEW.raw_user_meta_data->>'cras', 'CRAS Guamá'),
    NULLIF(NEW.raw_user_meta_data->>'telefone', ''),
    NULLIF(NEW.raw_user_meta_data->>'cpf', ''),
    NULLIF(NEW.raw_user_meta_data->>'nome_mae', ''),
    NULLIF(NEW.raw_user_meta_data->>'rg', ''),
    NULLIF(NEW.raw_user_meta_data->>'rg_orgao', ''),
    NULLIF(NEW.raw_user_meta_data->>'rg_uf', ''),
    NULLIF(NEW.raw_user_meta_data->>'rg_data_emissao', '')::date,
    NULLIF(NEW.raw_user_meta_data->>'data_nascimento', '')::date,
    NULLIF(NEW.raw_user_meta_data->>'sexo', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5.2 Validação de email institucional (pula para requerente)
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
    RAISE EXCEPTION 'Email institucional invalido. Use um email com dominio gov.br';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_validation
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_institutional_email();

-- 5.3 Criar applicants para requerentes (copia de profiles)
CREATE OR REPLACE FUNCTION public.handle_new_requerente()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'requerente' THEN
    INSERT INTO public.applicants (id, nome, cpf, telefone, nome_mae, rg, rg_orgao, rg_uf, rg_data_emissao, data_nascimento, sexo, created_by)
    VALUES (NEW.id, NEW.nome, NEW.cpf, NEW.telefone, NEW.nome_mae, NEW.rg, NEW.rg_orgao, NEW.rg_uf, NEW.rg_data_emissao, NEW.data_nascimento, NEW.sexo, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_requerente();

-- 5.4 RPC: busca semântica RAG
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  chunk_text TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    knowledge_chunks.id,
    knowledge_chunks.document_id,
    knowledge_chunks.chunk_text,
    1 - (knowledge_chunks.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks
  WHERE 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 5.5 RPC: busca híbrida RAG (semântica + lexical)
CREATE OR REPLACE FUNCTION public.hybrid_search_knowledge(
  query_text TEXT,
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  title TEXT,
  chunk_text TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  WITH semantic_search AS (
    SELECT
      id,
      1 - (embedding <=> query_embedding) AS semantic_score
    FROM knowledge_chunks
    WHERE 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  keyword_search AS (
    SELECT
      id,
      ts_rank(fts, plainto_tsquery('portuguese', query_text)) AS keyword_score
    FROM knowledge_chunks
    WHERE fts @@ plainto_tsquery('portuguese', query_text)
    ORDER BY keyword_score DESC
    LIMIT match_count * 2
  )
  SELECT
    c.id,
    c.document_id,
    d.title,
    c.chunk_text,
    COALESCE(ss.semantic_score, 0.0) + (COALESCE(ks.keyword_score, 0.0) * 0.5) AS similarity
  FROM knowledge_chunks c
  JOIN knowledge_documents d ON c.document_id = d.id
  LEFT JOIN semantic_search ss ON c.id = ss.id
  LEFT JOIN keyword_search ks ON c.id = ks.id
  WHERE ss.id IS NOT NULL OR ks.id IS NOT NULL
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- =============================================
-- 6. REALTIME
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.triagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_caso;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planos_acao;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documentos_caso;
