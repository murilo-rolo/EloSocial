-- Habilita a extensão pgvector para RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela para armazenar os documentos da base de conhecimento (Manuais, Leis, etc)
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- The full content
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar os "chunks" (pedaços) vetorizados do documento
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(768) -- Dimensão padrão do modelo text-embedding-004 do Gemini
);

-- Habilita Row Level Security para segurança
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança: Qualquer usuário logado pode ler e escrever
CREATE POLICY "Permitir leitura de documentos para usuários autenticados" ON knowledge_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir inserção de documentos para usuários autenticados" ON knowledge_documents FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir leitura de chunks para usuários autenticados" ON knowledge_chunks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir inserção de chunks para usuários autenticados" ON knowledge_chunks FOR INSERT TO authenticated WITH CHECK (true);

-- Função RPC (Remote Procedure Call) para buscar os chunks mais similares usando Distância por Cosseno
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
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
