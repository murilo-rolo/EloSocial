# Project State — EloSocial

## Decisions

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| AD-001 | JavaScript (sem TypeScript) | Preferência do usuário | Projeto inicial |
| AD-002 | Supabase Cloud | Auth + Realtime + RLS nativos | Projeto inicial |
| AD-003 | Tailwind CSS v4 + CSS custom properties | Utility-first + theming | Projeto inicial |
| AD-004 | Agendamentos inline no Plano de Ação | Sub-seção própria filtrando agendamentos por applicant_id, sem migration | 2026-07-21 |
| AD-005 | Video chamada cria sala Daily.co imediata | Botão cria sala via POST /api/rooms, exibe link + código; sem agendamento futuro | 2026-07-21 |

## Handoff

**Status:** Feature "Alterações na Interface do Profissional" concluída.

### Tasks executadas (7/7):
1. Removido /chat-ia (rota, sidebar, arquivo)
2. Removida barra "Assistentes de IA" de RequerenteDetail (Triagem/Resumo IA)
3. Adicionada seção "Plano de Ação" com PlanoAcaoCaso modo="assistente" em RequerenteDetail
4. Melhorado visual Mensagens (avatar, balões modernos, sombra)
5. Removido /agenda (rota, sidebar, arquivo)
6. Adicionada sub-seção "Agendamentos" inline no PlanoAcaoCaso
7. Adicionado botão "Agendar Video Chamada" com criação de sala Daily.co

### Próximos passos sugeridos:
- Executar testes existentes para validar regressão
- Testar fluxo completo manualmente
