-- =============================================
-- EloSocial - Migration 00004
-- Suporte a Anexos de Prontuários (PDFs)
-- =============================================

-- 1. TABELA PRONTUARIO_ANEXOS
CREATE TABLE public.prontuario_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prontuario_id UUID REFERENCES public.prontuarios(id) ON DELETE CASCADE NOT NULL,
  nome_arquivo TEXT NOT NULL,
  caminho_storage TEXT NOT NULL,
  tamanho INTEGER,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS POLICIES - PRONTUARIO_ANEXOS
ALTER TABLE public.prontuario_anexos ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ver os anexos
CREATE POLICY "prontuario_anexos_select" ON public.prontuario_anexos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Qualquer autenticado pode inserir um anexo
CREATE POLICY "prontuario_anexos_insert" ON public.prontuario_anexos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Apenas quem criou o anexo ou um gerente pode deletar o anexo
CREATE POLICY "prontuario_anexos_delete" ON public.prontuario_anexos
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gerente')
  );

-- =============================================
-- SUPABASE STORAGE CONFIGURATION
-- =============================================

-- 3. CRIAR BUCKET (SE NÃO EXISTIR)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prontuario_anexos', 'prontuario_anexos', false)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS POLICIES - STORAGE.OBJECTS
-- Permite leitura de objetos do bucket 'prontuario_anexos' para usuários autenticados
CREATE POLICY "storage_anexos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'prontuario_anexos' AND auth.role() = 'authenticated');

-- Permite upload de objetos para o bucket 'prontuario_anexos' para usuários autenticados
CREATE POLICY "storage_anexos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'prontuario_anexos' AND auth.role() = 'authenticated');

-- Permite exclusão se for autenticado (Poderia ser restrito ao criador da mesma forma que a tabela)
CREATE POLICY "storage_anexos_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'prontuario_anexos' AND auth.role() = 'authenticated');
