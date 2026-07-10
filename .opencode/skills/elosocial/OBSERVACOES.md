# Observações Técnicas

## Infraestrutura & Segurança

1. `service_role_key` fica **apenas** no backend (.env), nunca no frontend
2. `anon_key` fica no frontend (.env) — RLS protege os dados
3. `GEMINI_API_KEY` fica no backend (.env) — usada para todas as chamadas à API Gemini
4. Para criar usuários sem confirmação de email, usa-se Admin API (`POST /api/users`) com `service_role_key`
5. Frontend usa `import.meta.env.VITE_*` (Vite); backend usa `os.getenv()` + `.env`
6. Gerentes só gerenciam usuários do mesmo CRAS (RLS + filtro frontend)
7. Domínios de email aceitos: `%.gov.br` e `%.gov.com.br`

## Arquitetura & Convenções

8. `handle_new_user()` cria profile automaticamente no signup, propagando `nome`, `role` e `cras` do `user_metadata`
9. Dashboard usa `Promise.all` para joins (Supabase FK joins são instáveis)
10. Chat usa Supabase Realtime (subscriptions PostgreSQL), não WebSocket customizado
11. Migration `00009` habilita realtime para tabela `messages`
12. CSS usa Tailwind CSS v4 (`@import "tailwindcss"`) + CSS custom properties para tema escuro/claro
13. Ícones: lucide-react em todas as páginas
14. Gráficos: recharts no Dashboard

## IA & RAG

15. IA usa Google Gemini (gemini-2.5-flash) — cota gratuita, tool calling nativo
16. Embeddings: gemini-embedding-2 (768 dimensões) via `genai.embed_content()`
17. Contexto base SUAS/LOAS definido em `backend/app/api/suas_context.py`
18. RAG usa pgvector no Supabase — busca híbrida (semântica + lexical via tsvector)
19. Fallback: se migration 00008 não rodou, usa `match_knowledge_chunks` (semântica pura)
20. OCR usa Gemini Vision (`response_mime_type: application/json`) para extrair dados de documentos
21. Triagem gera JSON com score (Alto/Médio/Baixo Risco), cor (vermelho/amarelo/verde) e motivo
22. Gerador de pareceres aceita 3 formatos: `padrao_suas`, `juridico`, `saude`

## Videoconferência & Anexos

23. Videoconferência usa Daily.co — `DAILY_API_KEY` no backend `.env`; frontend usa `@daily-co/daily-js`
24. Salas privadas usam código de 6 dígitos gerado pelo backend ou definido pelo criador
25. `video_rooms` e `video_participants` têm RLS que restringe acesso a criador e participantes
26. Anexos de prontuário usam Supabase Storage (bucket `prontuario_anexos`) com RLS

## Agendamentos & Triagem

27. Agendamentos suportam status: Pendente, Concluído, Cancelado, Faltou
28. Colunas de vulnerabilidade em `applicants`: `vulnerabilidade_score`, `vulnerabilidade_cor`, `vulnerabilidade_motivo`
29. Campo `localizacao` (urbano/rural) foi removido na migration 00010

## Documentação

30. Pasta `docs/migracao-telemedicina/` contém 11 arquivos de documentação da migração para telemedicina
