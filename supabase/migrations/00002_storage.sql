-- =============================================
-- EloSocial - Storage Buckets e Policies
-- =============================================

-- 1. BUCKET: prontuario_anexos
INSERT INTO storage.buckets (id, name, public)
VALUES ('prontuario_anexos', 'prontuario_anexos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_anexos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'prontuario_anexos' AND auth.role() = 'authenticated');

CREATE POLICY "storage_anexos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'prontuario_anexos' AND auth.role() = 'authenticated');

CREATE POLICY "storage_anexos_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'prontuario_anexos' AND auth.role() = 'authenticated');

-- 2. BUCKET: documentos-caso
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-caso', 'documentos-caso', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "documentos_caso_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos-caso' AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = (string_to_array(name, '/'))[1]::uuid AND (
        user_id = auth.uid() OR assistente_social_id = auth.uid()
      )
    )
  );

CREATE POLICY "documentos_caso_download" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos-caso' AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = (string_to_array(name, '/'))[1]::uuid AND (
        user_id = auth.uid() OR assistente_social_id = auth.uid()
      )
    )
  );

CREATE POLICY "documentos_caso_delete_storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documentos-caso' AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = (string_to_array(name, '/'))[1]::uuid AND (
        user_id = auth.uid() OR assistente_social_id = auth.uid()
      )
    )
  );
