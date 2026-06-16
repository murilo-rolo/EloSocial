# Observações Técnicas

1. `service_role_key` fica **apenas** no backend (.env), nunca no frontend
2. `anon_key` fica no frontend (.env) — RLS protege os dados
3. `handle_new_user()` cria profile automaticamente no signup, propagando `nome`, `role` e `cras` do `user_metadata`
4. Para criar usuários sem confirmação de email, usa-se Admin API (`POST /api/users`) com `service_role_key`
5. Frontend usa `import.meta.env.VITE_*` (Vite); backend usa `os.getenv()` + `.env`
6. Dashboard usa `Promise.all` para joins (Supabase FK joins são instáveis)
7. Chat usa Supabase Realtime (subscriptions PostgreSQL), não WebSocket customizado
8. Migration `00002_add_cras.sql` adiciona coluna `cras` com CHECK de 12 unidades
9. Gerentes só gerenciam usuários do mesmo CRAS (RLS + filtro frontend)
10. Domínios de email aceitos: `%.gov.br` e `%.gov.com.br`
11. Videoconferência usa Daily.co — `DAILY_API_KEY` no backend `.env`; frontend usa `@daily-co/daily-js`
12. Salas privadas usam código de 6 dígitos gerado pelo backend ou definido pelo criador
13. `video_rooms` e `video_participants` têm RLS que restringe acesso a criador e participantes
