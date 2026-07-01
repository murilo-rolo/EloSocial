-- =============================================
-- Migration 00008: RAG Arcane Level (Busca Híbrida)
-- =============================================

-- 1. Adicionar Full-Text Search na tabela de chunks para Busca Lexical (Palavra-Chave)
ALTER TABLE knowledge_chunks 
ADD COLUMN IF NOT EXISTS fts tsvector 
GENERATED ALWAYS AS (to_tsvector('portuguese', chunk_text)) STORED;

-- Criar índice GIN para buscas rápidas de texto
CREATE INDEX IF NOT EXISTS knowledge_chunks_fts_idx ON knowledge_chunks USING GIN (fts);

-- 2. Função de Busca Híbrida (Semântica + Lexical)
CREATE OR REPLACE FUNCTION hybrid_search_knowledge(
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
    -- Normalizamos os scores grosseiramente e somamos
    COALESCE(ss.semantic_score, 0.0) + (COALESCE(ks.keyword_score, 0.0) * 0.5) AS similarity
  FROM knowledge_chunks c
  JOIN knowledge_documents d ON c.document_id = d.id
  LEFT JOIN semantic_search ss ON c.id = ss.id
  LEFT JOIN keyword_search ks ON c.id = ks.id
  WHERE ss.id IS NOT NULL OR ks.id IS NOT NULL
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
