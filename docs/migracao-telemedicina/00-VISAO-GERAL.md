# Visão Geral — Integração de Funcionalidades no EloSocial

## Escopo

Adicionar um novo role `requerente` (cidadão que busca atendimento no CRAS) ao EloSocial, com funcionalidades próprias. Funcionalidades que já existem no EloSocial serão estendidas; funcionalidades novas serão criadas.

---

## Mapeamento: novo vs extensão

| Funcionalidade | Status no EloSocial | Ação |
|---|---|---|
| Role `requerente` | Não existe | **Novo** — role, auth, RLS, interface |
| Triagem social multi-step | Não existe | **Nova** — feature completa |
| Dashboard do requerente | Não existe | **Nova** — feature completa |
| Plano de ação | Não existe | **Nova** — feature completa |
| Chat caso-a-caso | Existe `Chat.jsx` (mensagens entre profissionais) | **Estende** — novo chat vinculado a caso específico |
| Videochamada com sala de espera | Existe `Videoconferencia.jsx` (salas entre profissionais) | **Estende** — sala de espera para requerente |
| Documentos vinculados ao caso | Existe anexo de PDF em `ProntuarioView.jsx` | **Estende** — upload de qualquer arquivo vinculado ao caso |

---

## Funcionalidades existentes do EloSocial referenciadas

| Funcionalidade | Arquivo | Tabela/Storage | O que já faz |
|---|---|---|---|
| Chat entre profissionais | `Chat.jsx` | `messages` | DM 1:1 entre profissionais com Realtime |
| Videoconferência | `Videoconferencia.jsx` | `video_rooms`, `video_participants` | Criar/entrar salas Daily.co com código de acesso |
| Anexos de prontuário | `ProntuarioView.jsx` | `prontuario_anexos`, Storage `prontuario_anexos` | Upload/download de PDFs vinculados a prontuário |
| Layout principal | `Layout.jsx` | — | Sidebar + Topbar |
| Hook Realtime | `useRealtime.js` | — | Subscription genérica a eventos PostgreSQL |
| Chat com IA | `ChatIA.jsx`, `ChatLLM.jsx` | — | Chat contextual com Gemini |

---

## Funcionalidades a implementar

| # | Feature | Tipo | Documento |
|---|---|---|---|
| 1 | Role `requerente` | Infraestrutura | `01-ROLE-REQUERENTE.md` |
| 2 | Triagem social | Nova | `02-TRIAGEM-SOCIAL.md` |
| 3 | Dashboard do requerente | Nova | `03-DASHBOARD-REQUERENTE.md` |
| 4 | Chat caso-a-caso | Extensão | `04-CHAT-CASO.md` |
| 5 | Videochamada com sala de espera | Extensão | `05-VIDEOCHAMADA.md` |
| 6 | Plano de ação | Nova | `06-PLAO-AOCAO.md` |
| 7 | Documentos do caso | Extensão | `07-COFRE-DIGITAL.md` |

---

## Premissas

- EloSocial funcional com todos os roles atuais
- Supabase configurado com migrations existentes
- Daily.co API configurada (já utilizada pelo backend)
- FastAPI rodando (já existe)
