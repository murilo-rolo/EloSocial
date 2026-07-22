# Relatório Técnico de Desenvolvimento — EloSocial

## 1. Introdução

O **EloSocial** é um sistema de Prontuário Eletrônico desenvolvido para a rede socioassistencial brasileira, especificamente para os Centros de Referência de Assistência Social (CRAS) do município de Belém, Pará. O projeto integra funcionalidades de gestão de casos, documentação eletrônica, inteligência artificial e comunicação em tempo real em uma única plataforma web.

O sistema foi inspirado no case Arcane e equipado com um Copiloto de Inteligência Artificial de nível enterprise, voltado para automatizar e acelerar o fluxo de trabalho de profissionais de assistência social (Assistentes Sociais, Psicólogos, Pedagogos e Técnicos).

---

## 2. Objetivo do Sistema

O EloSocial resolve o problema da fragmentação de informações na rede SUAS (Sistema Único de Assistência Social), onde profissionais de CRAS precisam de uma ferramenta integrada para:

- Registrar e acompanhar o histórico de atendimento de famílias em situação de vulnerabilidade social
- Acessar prontuários eletrônicos padronizados com versionamento e assinatura digital
- Utilizar inteligência artificial para triagem de vulnerabilidade, geração de pareceres e assistência contextual
- Realizar videoconferências para atendimento remoto
- Manter uma base de conhecimento institucional acessível via busca semântica (RAG)

O público-alvo são os profissionais lotados nas 12 unidades CRAS de Belém/PA, com controle de acesso restrito por unidade e por perfil profissional.

---

## 3. Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + JavaScript (sem TypeScript) | ^18.3.1 |
| Build Tool | Vite | ^8.0.16 |
| CSS Framework | Tailwind CSS v4 | ^4.3.2 |
| PWA | vite-plugin-pwa | ^1.3.0 |
| Roteamento | React Router v6 | ^6.28.0 |
| Ícones | lucide-react | ^1.21.0 |
| Gráficos | recharts | ^2.12.0 |
| Markdown | react-markdown | ^10.1.0 |
| Backend | Python + FastAPI | 0.115.6 |
| Servidor ASGI | Uvicorn | 0.34.0 |
| Validação | Pydantic v2 | 2.10.4 |
| HTTP Client | httpx | <0.28 |
| Banco de Dados | Supabase Cloud (PostgreSQL) | — |
| Autenticação | Supabase Auth (JWT) | — |
| Tempo Real | Supabase Realtime (PostgreSQL subscriptions) | — |
| Armazenamento | Supabase Storage | — |
| IA / LLM | Google Gemini API (gemini-3.5-flash) | google-generativeai 0.8.3 |
| Embeddings | gemini-embedding-2 (768 dimensões) | — |
| RAG / Vetores | pgvector (extensão PostgreSQL) | — |
| PDF | ReportLab | 4.3.1 |
| Extração de PDF | pypdf | >=4.1.0 |
| Videoconferência | Daily.co API + daily-js SDK | @daily-co/daily-js ^0.91.0 |

---

## 4. Arquitetura do Sistema

### 4.1 Visão Geral

O sistema adota uma arquitetura client-server com comunicação direta entre o frontend e o Supabase para operações de dados em tempo real, e um backend Python (FastAPI) para operações que requerem processamento pesado (IA, PDF, OCR).

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React PWA)                  │
│            Vite + Tailwind CSS v4 + React Router         │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│   Supabase SDK   │        FastAPI Backend               │
│   (Auth, DB,     │   (PDF, IA/RAG/OCR, Admin,          │
│    Realtime,     │    Videoconferência)                  │
│    Storage)      │                                      │
│        │         │              │                        │
└────────┼─────────┴──────────────┼────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐   ┌──────────────────────────┐
│  Supabase Cloud  │   │   APIs Externas           │
│  (PostgreSQL +   │   │   - Google Gemini API     │
│   pgvector +     │   │   - Daily.co API          │
│   Auth + RLS)    │   │                          │
└─────────────────┘   └──────────────────────────┘
```

### 4.2 Padrões de Comunicação

O frontend se comunica com dois backends:

1. **Landing Page (estática)** — A página pública em `/` é renderizada inteiramente no cliente, sem chamadas ao backend. Serve como ponto de entrada e apresentação do sistema.

2. **Supabase SDK (direto)** — Para operações de autenticação, CRUD de dados, chat em tempo real, upload/download de arquivos e subscriptions de banco. Todas as queries passam pelo motor RLS (Row Level Security) do PostgreSQL.

2. **Backend FastAPI (via `VITE_API_URL`)** — Para operações que exigem processamento externo:
   - Geração de PDF (ReportLab)
   - Endpoints de IA (ChatIA, Triagem, Resumo, Pareceres)
   - Upload e busca na base de conhecimento RAG
   - OCR de documentos
   - Gerenciamento de usuários (Admin API do Supabase)
   - Criação de salas de videoconferência (Daily.co)

### 4.3 Gerenciamento de Estado

- **Autenticação**: React Context (`AuthContext`) com `useAuth()` hook. Sessão armazenada em `sessionStorage` com isolamento por aba.
- **Estado da aplicação**: `useState` local em cada componente/página. Não há biblioteca de estado global (Redux, Zustand, etc.).
- **Tempo Real**: Hook customizado `useRealtime` que encapsula subscriptions PostgreSQL do Supabase para 6 tabelas.

---

## 5. Funcionalidades Core

### 5.1 Autenticação e Controle de Acesso

O sistema implementa um modelo de controle de acesso baseado em funções (RBAC) com 6 perfis:

| Perfil | Prontuário | Requerentes | Chat | IA | Admin |
|--------|-----------|-------------|------|-----|-------|
| Assistente Social | CRUD | CRUD | Sim | Sim | Não |
| Psicólogo | CRUD | CRUD | Sim | Sim | Não |
| Pedagogo | CRUD | CRUD | Sim | Sim | Não |
| Técnico | CRUD | CRUD | Sim | Sim | Não |
| Gerente | CRUD (tudo) | CRUD | Sim | Sim | Sim |
| Requerente | Visualizar | — | Caso | Não | Não |

**Mecanismos de segurança:**

- **RLS (Row Level Security)**: Todas as 16 tabelas possuem políticas RLS habilitadas. Dados acessíveis apenas por usuários autenticados com permissão adequada.
- **Domínio de email**: Trigger `validate_institutional_email()` rejeita emails fora de `%.gov.br` e `%.gov.br` para usuários não-requerentes.
- **Escopo por CRAS**: Cada profissional vinculado a uma das 12 unidades. Gerentes gerenciam apenas usuários do mesmo CRAS.
- **JWT**: Autenticação via Supabase Auth com tokens JWT. `service_role_key` restrita ao backend.
- **Logs de auditoria**: Tabela `audit_logs` com registro de ações, acessível apenas por gerentes.

### 5.2 Gestão de Requerentes

- **CRUD completo**: Cadastro de requerentes com dados pessoais (nome, CPF, NIS, RG, data de nascimento, telefone, endereço).
- **Composição familiar**: Registro de membros da família com parentesco, sexo, data de nascimento e documentação.
- **Busca**: Filtro por nome e CPF.
- **Filtros urbanos/rurais**: Suporte a classificação geográfica.
- **OCR**: Extração automática de dados de documentos (RG, CPF, CNH) via Gemini Vision, com suporte a JPEG, PNG, WebP e PDF.

### 5.3 Prontuário Eletrônico SUAS

O prontuário é o componente central do sistema, estruturado em 12 seções padronizadas:

| # | Seção | Conteúdo |
|---|-------|----------|
| 1 | Identificação e Endereço | Logradouro, número, complemento, bairro, município, UF, CEP |
| 2 | Composição Familiar | Lista de membros com parentesco, sexo, nascimento, documentação |
| 3 | Condições Habitacionais | Situação habitacional, tipo de moradia |
| 4 | Condições Educacionais | Escolaridade, frequência escolar |
| 5 | Trabalho e Rendimento | Situação laboral, renda familiar |
| 6 | Condições de Saúde | Condições de saúde da família |
| 7 | Benefícios Eventuais | Benefícios recebidos |
| 8 | Convivência Familiar | Dinâmica familiar |
| 9 | Participação em Programas | Programas sociais vinculados |
| 10 | Violência e Violação de Direitos | Registros de violência |
| 11 | Encaminhamentos | Lista de encaminhamentos (destino, motivo, data) |
| 12 | Observações Técnicas | Notas livres do profissional |

**Recursos técnicos:**

- **Versionamento**: Cada edição incrementa o campo `versao` (INTEGER).
- **Assinatura digital**: Hash SHA-256 do conteúdo JSON para imutabilidade.
- **Exportação PDF**: Gerado via ReportLab com layout A4, cabeçalho institucional, tabelas de composição familiar e histórico de atendimentos.
- **Exportação JSON**: Download do prontuário em formato estruturado.
- **Anexos**: Upload de PDFs para o bucket `prontuario_anexos` no Supabase Storage, com drag-and-drop.

### 5.4 Dashboard Analítico

- **KPIs**: Contadores de requerentes, prontuários e atendimentos.
- **Prontuários recentes**: Lista dos 5 últimos prontuários com joins para nome do requerente e profissional.
- **Gráficos**: Estrutura preparada para recharts (importação presente, gráficos em desenvolvimento).

### 5.5 Agenda de Atendimentos

- **Cadastro de sessões**: Tipo (sessão, reunião, visita domiciliar), data/hora, requerente vinculado.
- **Controle de status**: Pendente, Concluído, Cancelado, Faltou.
- **Alertas**: Notificação de atraso em atendimentos pendentes.

### 5.6 Chat em Tempo Real

- **Mensagens internas**: Chat entre profissionais da equipe, habilitado via Supabase Realtime (subscriptions PostgreSQL).
- **Mensagens de caso**: Chat vinculado a um caso específico (triagem), permitindo comunicação entre requerente e assistente social.
- **Deduplicação**: Mecanismo de `sentIdsRef` para evitar mensagens duplicadas em atualizações otimistas.

### 5.7 Videoconferência

- **Provedor**: Daily.co API com SDK daily-js no frontend.
- **Salas públicas e privadas**: Salas privadas utilizam código de 6 dígitos gerado pelo backend.
- **Vinculação a caso**: Salas podem ser vinculadas a uma triagem, com status atualizado para "em_atendimento".
- **Expiração**: Salas expiram automaticamente após 2 horas.
- **Sala de espera**: Para requerentes, implementação com conexão automática via Realtime.
- **Máximo de participantes**: 10 por sala.

### 5.8 Central de Ajuda

- **Accordion por role**: Seções colapsáveis filtradas conforme o perfil do usuário.
- **10 seções profissionais** + **6 seções para requerentes**, descrevendo cada funcionalidade do sistema.

---

## 6. Copiloto SUAS — Inteligência Artificial

O componente de IA é integrado ao sistema como um copiloto contextual, utilizando o modelo **gemini-3.5-flash** do Google Gemini com tool calling nativo.

### 6.1 Contexto Base

O prompt base (`suas_context.py`) estabelece a IA como especialista em SUAS e LOAS (Lei 8.742/1993), com diretrizes para:

- Utilizar terminologia técnica de assistência social
- Análise de vulnerabilidade baseada em renda per capita, composição familiar, acesso a serviços
- Rede de referenciamento: CRAS, CREAS, SUS, CAPS, educação, justiça, INSS, BPC, Bolsa Família
- Sigilo e compromisso com direitos humanos

### 6.2 ChatIA (Copiloto Contextual)

**Endpoint**: `POST /api/chat-ai`

- **Split-view**: Página dedicada com lista de requerentes à esquerda e chat à direita.
- **Contexto completo**: A IA recebe todos os prontuários do requerente selecionado.
- **Tool calling RAG**: A IA pode consultar automaticamente a base de conhecimento institucional via function calling.
- **Chat flutuante**: Widget `ChatLLM.jsx` disponível em qualquer página de detalhe do requerente.

**Parâmetros de request:**
```json
{
  "message": "string",
  "history": [{"role": "user|model", "content": "string"}],
  "prontuario_context": {"applicants": {...}, "prontuarios": [...]}
}
```

### 6.3 Triagem de Vulnerabilidade

**Endpoint**: `POST /api/triagem`

- **Análise automática**: Cruza renda, composição familiar e histórico pregresso.
- **Saída estruturada**: JSON com score (Alto/Médio/Baixo Risco), cor (vermelho/amarelo/verde) e motivo.
- **Persistência**: Resultado salvo nos campos `vulnerabilidade_score`, `vulnerabilidade_cor`, `vulnerabilidade_motivo` da tabela `applicants`.
- **Indicadores visuais**: Badge colorido com emoji no perfil do requerente.

### 6.4 Resumo Executivo

**Endpoint**: `POST /api/resumo`

- **Varredura automática**: Consolida dezenas de páginas de prontuários, evoluções e anotações.
- **Saída**: Texto em Markdown renderizado via `react-markdown`.
- **Uso**: Ideal para passagem de plantão ou integração de novos profissionais ao caso.

### 6.5 Geração de Pareceres

**Endpoint**: `POST /api/generate-parecer`

- **3 formatos**:
  - `padrao_suas` — Relatório padrão CRAS/CREAS
  - `juridico` — Tom jurídico, formatado como ofício para justiça/MP
  - `saude` — Tom médico/clínico, para encaminhamento ao SUS/CAPS
- **Saída**: Texto editável em modal, com opção de copiar para área de transferência.

### 6.6 OCR — Extração de Documentos

**Endpoint**: `POST /api/ocr/extract_requerente`

- **Provedor**: Gemini Vision (modelo multimodal).
- **Formatos aceitos**: JPEG, PNG, WebP, PDF.
- **Dados extraídos**: Nome, CPF, RG, data de nascimento, nome da mãe, sexo.
- **Saída**: JSON estruturado com campos preenchidos (string vazia para dados não encontrados).

---

## 7. Base de Conhecimento (RAG)

O sistema RAG (Retrieval-Augmented Generation) permite que a IA responda com base em documentação oficial institucional.

### 7.1 Arquitetura RAG

```
Upload (PDF/TXT) → Extração de texto → Chunking (1000 chars, overlap 200)
     → Embeddings (gemini-embedding-2, 768d) → Armazenamento no pgvector
     → Busca híbrida (semântica + lexical) → Retorno com citações
```

### 7.2 Componentes

| Componente | Detalhes |
|-----------|----------|
| **Tabela `knowledge_documents`** | Documentos-fonte (título, conteúdo, criador) |
| **Tabela `knowledge_chunks`** | Chunks vetorizados com `VECTOR(768)` e `TSVECTOR` (full-text) |
| **Embeddings** | `gemini-embedding-2` com 768 dimensões |
| **Indexação** | `task_type="retrieval_document"` para upload, `"retrieval_query"` para busca |
| **Busca semântica** | RPC `match_knowledge_chunks` — similaridade de cosseno |
| **Busca híbrida** | RPC `hybrid_search_knowledge` — semântica + lexical (tsvector) com pesos combinados |

### 7.3 Funcionalidades

- **Upload de PDFs**: Extração via pypdf, chunking com janela sobreposta.
- **Upload de texto**: Inserção direta de conteúdo.
- **Busca híbrida**: Combina score semântico + score lexical (0.5x) para resultados mais precisos.
- **Fallback**: Se a função `hybrid_search_knowledge` não estiver disponível, usa `match_knowledge_chunks` (busca semântica pura).
- **Gerenciamento**: Listagem e exclusão de documentos via interface web.

### 7.4 Frontend

- **Página BaseConhecimento**: Upload com drag-and-drop, listagem de documentos, filtro por título, badge "Vetorizado", exclusão com confirmação.

---

## 8. Modelo de Dados

### 8.1 Tabelas (16 total)

| # | Tabela | Descrição | Realtime |
|---|--------|-----------|----------|
| 1 | `profiles` | Extends `auth.users`. Dados profissionais + CRAS | Não |
| 2 | `applicants` | Requerentes. Dados pessoais + vulnerabilidade | Não |
| 3 | `prontuarios` | Prontuários eletrônicos (JSONB + versionamento) | Não |
| 4 | `atendimentos` | Histórico cronológico de atendimentos | Não |
| 5 | `messages` | Chat interno entre profissionais | Sim |
| 6 | `audit_logs` | Registro de auditoria | Não |
| 7 | `video_rooms` | Salas de videoconferência | Sim |
| 8 | `video_participants` | Participantes de salas | Não |
| 9 | `prontuario_anexos` | Anexos de prontuários | Não |
| 10 | `agendamentos` | Agenda de atendimentos | Não |
| 11 | `triagens` | Triagem social/caso | Sim |
| 12 | `mensagens_caso` | Chat do caso (requerente ↔ profissional) | Sim |
| 13 | `planos_acao` | Planos de ação vinculados ao caso | Sim |
| 14 | `documentos_caso` | Documentos do caso | Sim |
| 15 | `knowledge_documents` | Documentos da base de conhecimento RAG | Não |
| 16 | `knowledge_chunks` | Chunks vetorizados (VECTOR 768d + TSVECTOR) | Não |

### 8.2 Diagrama de Entidades

```
auth.users (Supabase)
  │
  ├──→ profiles (1:1 via id)
  │       │
  │       ├──→ applicants (auto-criado para role='requerente')
  │       │       │
  │       │       ├──→ prontuarios (N:1)
  │       │       │       ├──→ atendimentos (1:N)
  │       │       │       └──→ prontuario_anexos (1:N) → Storage
  │       │       │
  │       │       ├──→ agendamentos (N:1)
  │       │       └──→ triagens (1:1 via applicant_id UNIQUE)
  │       │               ├──→ mensagens_caso (1:N) → Realtime
  │       │               ├──→ planos_acao (1:N) → Realtime
  │       │               └──→ documentos_caso (1:N) → Realtime → Storage
  │       │
  │       ├──→ messages (chat interno) → Realtime
  │       ├──→ audit_logs (1:N)
  │       └──→ video_rooms (1:N) → Realtime
  │               └──→ video_participants (1:N)
  │
  └──→ knowledge_documents (1:N)
          └──→ knowledge_chunks (1:N) [VECTOR(768) + TSVECTOR]
```

### 8.3 Triggers

| Trigger | Evento | Função |
|---------|--------|--------|
| `on_auth_user_created` | AFTER INSERT em `auth.users` | Cria `profiles` com dados de `raw_user_meta_data` |
| `on_auth_user_email_validation` | BEFORE INSERT em `auth.users` | Valida domínio `.gov.br` / `.gov.com.br` |
| `on_profile_created` | AFTER INSERT em `profiles` | Cria `applicants` para role='requerente' |

### 8.4 Funções RPC

| Função | Propósito |
|--------|-----------|
| `match_knowledge_chunks` | Busca semântica por similaridade de cosseno (pgvector) |
| `hybrid_search_knowledge` | Busca híbrida: semântica + lexical (tsvector) com pesos |

### 8.5 Storage

| Bucket | Propósito | Acesso |
|--------|-----------|--------|
| `prontuario_anexos` | Anexos de prontuários (PDF) | SELECT/INSERT/DELETE autenticados |
| `documentos-caso` | Documentos vinculados a casos | Participantes do caso (verificação por path) |

### 8.6 Índices (10 total)

| Índice | Tabela | Coluna(s) | Tipo |
|--------|--------|-----------|------|
| `idx_triagens_user_id` | triagens | user_id | btree |
| `idx_triagens_status` | triagens | status | btree |
| `idx_triagens_assistente` | triagens | assistente_social_id | btree |
| `idx_triagens_applicant_id` | triagens | applicant_id | btree |
| `idx_mensagens_caso_caso` | mensagens_caso | caso_id | btree |
| `idx_mensagens_caso_remetente` | mensagens_caso | remetente_id | btree |
| `idx_mensagens_caso_destinatario` | mensagens_caso | destinatario_id | btree |
| `idx_planos_acao_caso` | planos_acao | caso_id | btree |
| `idx_documentos_caso_caso` | documentos_caso | caso_id | btree |
| `idx_knowledge_chunks_fts` | knowledge_chunks | fts | GIN |

---

## 9. Segurança e Controle de Acesso

### 9.1 Row Level Security (RLS)

Todas as 16 tabelas possuem RLS habilitado com políticas específicas:

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `profiles` | Autenticados | Self (auth.uid() = id) | Self ou gerente mesmo CRAS | — |
| `applicants` | Autenticados | Autenticados | Autenticados | Autenticados |
| `prontuarios` | Autenticados | Autenticados | Criador ou gerente | — |
| `atendimentos` | Autenticados | Autenticados | — | — |
| `messages` | Próprias ou grupo | Autenticados | — | — |
| `audit_logs` | Gerente apenas | Autenticados | — | — |
| `video_rooms` | Criador ou participante | Criador | Criador | — |
| `video_participants` | Próprios | Próprios | — | — |
| `prontuario_anexos` | Autenticados | Autenticados | — | Criador ou gerente |
| `agendamentos` | Autenticados | Autenticados | Autenticados | Autenticados |
| `triagens` | Requerente (próprios) / Profissional (todos) | Requerente (próprios) | Profissional ou requerente | — |
| `mensagens_caso` | Participantes do caso | Participantes do caso | Participantes do caso | — |
| `planos_acao` | Participantes do caso | Assistente do caso | Participantes do caso | — |
| `documentos_caso` | Participantes do caso | Participantes do caso | — | Participantes do caso |
| `knowledge_documents` | Autenticados | Autenticados | — | — |
| `knowledge_chunks` | Autenticados | Autenticados | — | — |

### 9.2 Isolamento de Chaves

| Chave | Localização | Propósito |
|-------|------------|-----------|
| `SUPABASE_URL` | Backend `.env` | Conexão com Supabase |
| `SUPABASE_SERVICE_KEY` | Backend `.env` | Acesso admin (bypass RLS) |
| `GEMINI_API_KEY` | Backend `.env` | API Google Gemini |
| `DAILY_API_KEY` | Backend `.env` | API Daily.co |
| `VITE_SUPABASE_URL` | Frontend `.env` | Conexão Supabase (client-side) |
| `VITE_SUPABASE_ANON_KEY` | Frontend `.env` | Chave pública (RLS protege) |
| `VITE_API_URL` | Frontend `.env` | URL do backend FastAPI |

### 9.3 Validação de Email

Trigger `validate_institutional_email()` garante que apenas emails com domínio `%.gov.br` ou `%.gov.com.br` são aceitos para usuários não-requerentes. O domínio é validado no nível do banco de dados, antes da inserção em `auth.users`.

### 9.4 Armazenamento Seguro

- O bucket `documentos-caso` utiliza verificação de path: o primeiro segmento do caminho deve ser um UUID válido de triagem onde o usuário é participante.
- Anexos de prontuário utilizam bucket privado com acesso restrito a autenticados.

---

## 10. Endpoints Backend (FastAPI)

### 10.1 Core

| Método | Rota | Função |
|--------|------|--------|
| GET | `/api/health` | Health check |
| POST | `/api/pdf` | Gera PDF do prontuário (ReportLab) |
| POST | `/api/hash` | Gera hash SHA-256 do JSON |

### 10.2 Administração

| Método | Rota | Função |
|--------|------|--------|
| POST | `/api/users` | Cria usuário via Admin API (service_role) |
| DELETE | `/api/users/{user_id}` | Exclui usuário via Admin API |

### 10.3 Videoconferência

| Método | Rota | Função |
|--------|------|--------|
| POST | `/api/rooms` | Cria sala no Daily.co (pública ou privada) |
| POST | `/api/rooms/join` | Valida código e retorna URL da sala |

### 10.4 IA — Copiloto SUAS

| Método | Rota | Função |
|--------|------|--------|
| POST | `/api/chat-ai` | Chat contextual com tool calling RAG |
| POST | `/api/triagem` | Triagem de vulnerabilidade (score + cor) |
| POST | `/api/resumo` | Resumo executivo do histórico |
| POST | `/api/generate-parecer` | Geração de parecer (3 formatos) |

### 10.5 RAG — Base de Conhecimento

| Método | Rota | Função |
|--------|------|--------|
| POST | `/api/rag/upload` | Upload de texto (vetoriza e salva chunks) |
| POST | `/api/rag/upload_file` | Upload de arquivo PDF/TXT |
| GET | `/api/rag/documents` | Lista documentos da base |
| DELETE | `/api/rag/documents/{doc_id}` | Remove documento e chunks |
| POST | `/api/rag/query` | Busca híbrida (semântica + lexical) |

### 10.6 OCR

| Método | Rota | Função |
|--------|------|--------|
| POST | `/api/ocr/extract_requerente` | Extração de dados de documento via Gemini Vision |

---

## 11. Rotas Frontend

### 11.1 Rotas Públicas

| Rota | Página |
|------|--------|
| `/` | Landing Page pública com hover menu, feature cards e seção "Quem Somos" |
| `/login` | Login com email institucional |
| `/cadastro` | Cadastro de novos usuários |
| `/cadastro-requerente` | Cadastro de requerentes (email pessoal) |

### 11.2 Rotas Autenticadas (Profissionais)

| Rota | Página |
|------|--------|
| `/sistema` | Página de boas-vindas "Bem vindo, {nome}!" |
| `/dashboard` | Dashboard analítico com KPIs |
| `/agenda` | Agenda de atendimentos |
| `/requerentes` | Lista de requerentes (CRUD + busca) |
| `/requerentes/:id` | Detalhe do requerente + triagem IA |
| `/prontuarios/novo/:applicantId` | Novo prontuário (12 seções) |
| `/prontuarios/:id` | Visualização do prontuário + export PDF/JSON |
| `/chat` | Chat em tempo real (equipe) |
| `/chat-ia` | ChatIA split-view (copiloto) |
| `/videoconferencia` | Salas de videoconferência |
| `/conhecimento` | Base de conhecimento RAG |
| `/perfil` | Perfil do usuário |
| `/ajuda` | Central de ajuda |

### 11.3 Rota Administrativa

| Rota | Página | Acesso |
|------|--------|--------|
| `/admin` | Gerenciar usuários + auditoria | Gerente apenas |

### 11.4 Rotas do Requerente

| Rota | Página |
|------|--------|
| `/acompanhamento` | Dashboard do requerente |
| `/triagem` | Triagem social (multi-step) |
| `/chat-atendimento` | Chat do caso |
| `/video-atendimento` | Videochamada com sala de espera |
| `/plano-acao` | Plano de ação |
| `/cofre-digital` | Cofre digital (documentos do caso) |

---

## 12. Unidades CRAS

O sistema contempla as 12 unidades do CRAS do município de Belém, Pará:

| # | Unidade |
|---|---------|
| 1 | CRAS Aurá |
| 2 | CRAS Barreiro |
| 3 | CRAS Benguí |
| 4 | CRAS Cremação |
| 5 | CRAS Guamá |
| 6 | CRAS Icoaraci |
| 7 | CRAS Jurunas |
| 8 | CRAS Mosqueiro |
| 9 | CRAS Outeiro |
| 10 | CRAS Pedreira |
| 11 | CRAS Tapanã |
| 12 | CRAS Terra Firme |

Cada profissional é vinculado a uma unidade via campo `cras` na tabela `profiles`. O CHECK constraint no banco garante que apenas valores válidos são aceitos. Gerentes têm escopo restrito à própria unidade.

---

## 13. Fluxo de Trabalho

### 13.1 Fluxo Principal (Profissional)

```
1. Acessa / (landing pública) → Clica "Acessar Sistema" → Login (email @gov.br) → /sistema
2. Dashboard → Visualiza KPIs e prontuários recentes
3. Requerentes → Busca/cadastra requerente
4. RequerenteDetail → Visualiza dados + executa Triagem IA
5. ProntuárioEdit → Preenche 12 seções do prontuário
6. ProntuarioView → Visualiza prontuário + exporta PDF
7. Gera parecer via IA (padrão SUAS / jurídico / saúde)
8. Agenda atendimentos e registra evoluções
```

### 13.2 Fluxo do Requerente

```
1. Cadastro (email pessoal) → Trigger cria profiles + applicants
2. Login → Dashboard do requerente (caso ativo)
3. Triagem Social → Formulário multi-step (5 etapas)
4. Chat do caso → Comunicação com assistente social
5. Videochamada → Sala de espera + conexão
6. Plano de ação → Visualiza e atualiza status das tarefas
7. Cofre digital → Upload/download de documentos
```

### 13.3 Fluxo RAG

```
1. Gestor faz upload de PDF (manual SUAS, LOAS, portarias)
2. Backend extrai texto → chunking (1000 chars, overlap 200)
3. gemini-embedding-2 gera vetores (768 dimensões)
4. Chunks + embeddings salvos no pgvector
5. Técnico pergunta à IA → tool calling consulta base
6. Busca híbrida (semântica + lexical) retorna trechos relevantes
7. IA responde com citações da documentação oficial
```

---

## 14. Dependências

### 14.1 Backend (Python)

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| fastapi | 0.115.6 | Framework web |
| uvicorn[standard] | 0.34.0 | Servidor ASGI |
| pydantic | 2.10.4 | Validação de dados |
| python-multipart | 0.0.20 | Upload de arquivos |
| python-dotenv | 1.0.1 | Carregamento de .env |
| httpx | <0.28 | Cliente HTTP async |
| supabase | 2.10.0 | Cliente Supabase |
| reportlab | 4.3.1 | Geração de PDF |
| google-generativeai | 0.8.3 | API Google Gemini |
| pypdf | >=4.1.0 | Extração de texto de PDF |

### 14.2 Frontend (JavaScript)

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| react | ^18.3.1 | Framework UI |
| react-dom | ^18.3.1 | Renderer DOM |
| react-router-dom | ^6.28.0 | Roteamento |
| @supabase/supabase-js | ^2.47.0 | Cliente Supabase |
| @daily-co/daily-js | ^0.91.0 | Videoconferência |
| tailwindcss | ^4.3.2 | CSS utility-first |
| @tailwindcss/vite | ^4.3.2 | Plugin Vite Tailwind |
| lucide-react | ^1.21.0 | Biblioteca de ícones |
| recharts | ^2.12.0 | Gráficos |
| react-markdown | ^10.1.0 | Renderização Markdown |
| vite | ^8.0.16 | Build tool |
| vite-plugin-pwa | ^1.3.0 | Progressive Web App |

---

## 15. Estrutura de Migrations

| # | Arquivo | Descrição |
|---|---------|-----------|
| 00001 | `schema.sql` | Schema completo: 16 tabelas, RLS, triggers, funções RPC, índices, realtime |
| 00002 | `storage.sql` | Buckets de storage: prontuario_anexos, documentos-caso |
| 00003 | `chat_requerente_rls.sql` | Adiciona `destinatario_id` a mensagens_caso + recria RLS para colaboração multi-profissional |

---

## 16. Conclusão

O EloSocial representa uma solução completa para a gestão de prontuários eletrônicos na rede SUAS, integrando:

- **Gestão de casos** com prontuários padronizados em 12 seções, versionamento e assinatura digital
- **Inteligência artificial** como copiloto contextual (ChatIA, triagem, resumo, pareceres, OCR)
- **Base de conhecimento RAG** com busca híbrida semântica + lexical em documentação oficial
- **Comunicação em tempo real** via chat interno, chat de caso e videoconferência
- **Controle de acesso granular** via RLS, RBAC e segmentação por 12 unidades CRAS
- **Interface moderna** com React PWA, Tailwind CSS v4 e suporte a temas escuro/claro

### Status Atual

- **Core**: Funcional (auth, CRUD, prontuário, dashboard, agenda, chat, videoconferência)
- **IA**: Funcional (ChatIA, triagem, resumo, pareceres, OCR)
- **RAG**: Funcional (upload, chunking, embedding, busca híbrida)
- **Requerente**: Implementado (cadastro, dashboard, triagem social multi-step, chat de caso, videochamada com sala de espera, plano de ação, cofre digital)
- **Landing Page**: Implementada (página pública com hover menu, 6 feature cards, seção "Quem Somos")
- **Deploy**: Frontend e backend configurados para Vercel (serverless)

### Próximos Passos

- Dashboard estatístico com gráficos recharts
- Relatórios gerenciais
- Filtros avançados (data, profissional, faixa etária, bairro)
- Exportação de estatísticas CSV/PDF
- Notificações push para mudanças de status
- Validação completa do fluxo end-to-end
- Deploy em produção
