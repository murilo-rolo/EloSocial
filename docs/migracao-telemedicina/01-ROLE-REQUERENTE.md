# 01 — Role Requerente

## Contexto

O EloSocial possui 5 roles: `assistente_social`, `psicologo`, `pedagogo`, `tecnico`, `gerente`. Todos são perfis profissionais com email institucional. O requerente é o primeiro role de cidadão/usuário final do sistema.

---

## RF — Requisitos Funcionais

### RF-01: Novo valor de role no banco

A tabela `profiles` deve aceitar o valor `'requerente'` na coluna `role`.

- **Referência**: CHECK constraint na migration `00001_schema.sql` (linha 10)

### RF-02: Vinculação do requerente a um CRAS

O requerente deve ser vinculado a um CRAS específico (unidade onde será atendido). A coluna `cras` na tabela `profiles` permanece NOT NULL.

- **Referência**: `00001_schema.sql` define `cras TEXT NOT NULL` — não precisa de alteração

### RF-03: Cadastro mínimo de requerentes

O cadastro do requerente deve ser mínimo — apenas dados de autenticação e identificação básica. Os dados socioeconômicos são coletados posteriormente pela Triagem Social, que cria o caso.

- **Campos**: nome, email (pessoal), CPF, telefone, CRAS (select com 12 unidades), senha
- **Sem**: campo de role (sempre `requerente`), sem dados socioeconômicos
- **Fluxo**: após cadastro → redirecionamento automático para `/triagem`

- **Referência**: `Cadastro.jsx` atual usa `POST /api/users` com email institucional — requerentes usam `supabase.auth.signUp()` diretamente, passando `cras` no `raw_user_meta_data`

### RF-04: Validação de email flexível

A trigger `validate_institutional_email` deve pular a validação de domínio `*.gov.br` quando o role for `requerente`.

- **Referência**: `00001_schema.sql` (linha 178) — trigger rejeita emails fora de `gov.br`

### RF-05: Cadastro automático do profile

A trigger `handle_new_user` cria o profile com `cras` a partir de `raw_user_meta_data`. Não precisa de alteração — o requerente envia o `cras` no signup.

- **Referência**: `00001_schema.sql` (linha 159) — lê `raw_user_meta_data->>'cras'`

### RF-06: Redirecionamento pós-login

Após login, o sistema deve redirecionar requerentes para `/acompanhamento` e profissionais para `/` (comportamento atual).

- **Referência**: `Login.jsx` (linha 15) — redirecionamento genérico para `from`

### RF-07: Rotas exclusivas do requerente

As rotas do requerente devem ser protegidas por `ProtectedRoute` com `roles={['requerente']}`:

| Rota | Descrição |
|---|---|
| `/triagem` | Formulário de triagem social |
| `/acompanhamento` | Dashboard do requerente |
| `/chat-atendimento` | Chat com assistente |
| `/video-atendimento` | Sala de espera + videochamada |
| `/plano-acao` | Plano de ação |
| `/cofre-digital` | Documentos do caso |

- **Referência**: `ProtectedRoute.jsx` já suporta prop `roles`

### RF-08: Sidebar do requerente

Requerentes devem ver uma sidebar diferente dos profissionais, com links relevantes ao seu fluxo.

- **Links**: Acompanhamento, Triagem, Mensagens, Video, Plano de Ação, Cofre Digital
- **Sem**: links de Admin, Conhecimento IA, Chat IA

- **Referência**: `Sidebar.jsx` já tem lógica condicional para link de Admin (linha 19)

### RF-09: Novas tabelas no banco

Quatro tabelas novas para suportar as funcionalidades do requerente:

| Tabela | Papel |
|---|---|
| `triagens` | Casos de atendimento |
| `mensagens_caso` | Chat vinculado a caso |
| `plano_acao_itens` | Tarefas do plano de ação |
| `documentos_caso` | Metadados de documentos do caso |

### RF-10: Storage bucket

Bucket `documentos-caso` (privado) no Supabase Storage para arquivos do caso.

### RF-11: Realtime habilitado

As tabelas `triagens`, `mensagens_caso`, `plano_acao_itens` e `documentos_caso` devem ter Realtime habilitado para atualizações ao vivo.

---

## RNF — Requisitos Não-Funcionais

### RNF-01: Segurança via RLS

Requerentes só devem acessar seus próprios dados. Profissionais devem acessar dados de todos os casos. Todas as novas tabelas devem ter RLS habilitado com policies adequadas.

### RNF-02: Isolamento de interface

A interface do requerente (sidebar, rotas, layout) deve ser visualmente distinta da interface de profissionais, evitando confusão de contexto.

### RNF-03: Compatibilidade com trigger existente

As alterações nas triggers `handle_new_user` e `validate_institutional_email` não devem quebrar o fluxo de cadastro de profissionais existente.
