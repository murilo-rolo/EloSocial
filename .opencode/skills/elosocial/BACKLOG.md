# Backlog

## ✅ Concluído

### Core
- Supabase: migrations 00001 + 00002 + 00003, RLS, triggers, seed
- Backend: FastAPI, PDF (ReportLab), admin de usuários com CRAS, Daily.co rooms
- Frontend: setup, auth, layout PWA, Dashboard, Requerentes CRUD
- Frontend: Prontuário SUAS (13 seções), PDF/JSON export
- Frontend: Chat (Realtime), Admin (usuários + CRAS scoping)
- Frontend: Videoconferência (salas públicas/privadas, código de acesso, Daily.co)

### IA — Copiloto SUAS
- Backend: ChatIA (gemini-2.5-flash + tool calling RAG)
- Backend: Triagem de vulnerabilidade automática (score + cor)
- Backend: Resumo executivo de prontuários
- Backend: Gerador de pareceres (padrão, jurídico, saúde)
- Backend: EloBot — busca global com IA
- Backend: OCR — extração de dados de documentos (Gemini Vision)
- Frontend: ChatIA (split-view: requerentes à esquerda, chat à direita)

### RAG — Base de Conhecimento
- Backend: pgvector + embeddings gemini-embedding-2 (768d)
- Backend: Busca híbrida (semântica + lexical via tsvector)
- Backend: Upload de PDFs/texto, chunking, vetorização automática
- Frontend: BaseConhecimento (upload, listagem, exclusão de documentos)

### Infraestrutura
- Migration 00004: Anexos de prontuário (Supabase Storage)
- Migration 00005: Sistema de agendamentos
- Migration 00006: Triagem de vulnerabilidade (colunas em applicants)
- Migration 00007: pgvector + tabelas RAG
- Migration 00008: Busca híbrida RAG
- Migration 00009: Realtime para messages
- Migration 00010: Remoção campo localizacao
- Documentação: README, BACKLOG, SKILL.md, DOCKER.md
- Docs: Migração telemedicina (11 arquivos)

### Frontend — Páginas novas
- Cadastro de usuários (pública)
- Agenda de atendimentos
- Perfil do usuário
- Base de Conhecimento RAG

### Design
- Tailwind CSS v4 (migrou do CSS puro)
- Tema escuro/claro (CSS custom properties)
- Ícones: lucide-react
- Gráficos: recharts

## 🔄 Em andamento
- Testar fluxo completo: cadastro → prontuário → PDF
- Ajustar responsividade mobile (viewport 360px)
- Validar RLS policies
- Deploy: Vercel (frontend + backend)
- Pastas vazias: components/Chat/, components/Prontuario/, components/ReportViewer/ (componentes estão nas páginas)

## 📋 Futuro
- Dashboard estatístico com gráficos (recharts já instalado)
- Relatórios gerenciais
- Filtros avançados (data, profissional, faixa etária, bairro)
- Exportar estatísticas CSV/PDF
- Mover componentes de páginas para pastas dedicadas (Chat/, Prontuario/, ReportViewer/)
