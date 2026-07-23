-- =============================================
-- EloSocial - Storage Bucket para upload de
-- arquivos da Base de Conhecimento (RAG)
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('conhecimento_uploads', 'conhecimento_uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "conhecimento_uploads_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'conhecimento_uploads' AND auth.role() = 'authenticated'
  );

CREATE POLICY "conhecimento_uploads_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'conhecimento_uploads' AND auth.role() = 'authenticated'
  );

CREATE POLICY "conhecimento_uploads_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'conhecimento_uploads' AND auth.role() = 'authenticated'
  );
