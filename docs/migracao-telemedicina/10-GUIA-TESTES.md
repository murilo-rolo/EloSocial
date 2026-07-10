# 10 — Guia de Testes

## Visão Geral

Cenários de teste manuais para validar cada funcionalidade do fluxo do requerente. Organizados por fase de implementação.

---

## Pré-requisitos

- Supabase local ou remoto com a migration `00011_requerente.sql` aplicada
- Backend rodando (`docker compose up backend` ou `uvicorn`)
- Frontend rodando (`docker compose up frontend` ou `npm run dev`)
- Pelo menos um assistente social cadastrado (para testar interação)

---

## 1. Cadastro e Login

### TC-01: Cadastro com email pessoal

1. Acessar `/cadastro`
2. Preencher: nome, email pessoal (ex: `teste@gmail.com`), senha, CPF, telefone
3. Selecionar CRAS: "CRAS Guamá"
4. Submeter
5. **Esperado:** Redirecionado para `/triagem`

### TC-02: Cadastro com email gov.br

1. Acessar `/cadastro`
2. Preencher com email `usuario@gov.br`
3. Submeter
4. **Esperado:** Cadastro funciona normalmente (sem restrição de domínio)

### TC-03: Login do requerente

1. Fazer logout
2. Acessar `/login`
3. Inserir credenciais do requerente
4. **Esperado:** Redirecionado para `/acompanhamento` (dashboard)

### TC-04: Login do assistente social

1. Fazer logout
2. Fazer login com assistente social
3. **Esperado:** Redirecionado para `/` (dashboard normal), sidebar completa

### TC-05: Sidebar do requerente

1. Logar como requerente
2. **Esperado:** Sidebar mostra apenas: Dashboard, Triagem, Mensagens, Documentos, Videochamada

### TC-06: Sidebar do profissional

1. Logar como assistente social
2. **Esperado:** Sidebar mostra todos os links existentes (Dashboard, Agenda, Requerentes, etc.)

---

## 2. Triagem Social

### TC-07: Fluxo completo — prioridade ALTA

1. Logar como requerente (sem triagem existente)
2. Etapa 1 — Contato: preencher telefone, idade, bairro, selecionar CRAS
3. Etapa 2 — Família: selecionar "Mãe/Pai solo com filhos", renda "Sem renda", benefícios "Bolsa Família"
4. Etapa 3 — Motivo: selecionar "Violência ou ameaça" (50 pts)
5. Etapa 4 — Urgência: selecionar "alta" (30 pts), marcar "Risco de violência" (50 pts)
6. Etapa 5 — Relato: escrever texto, revisar dados
7. Submeter
8. **Esperado:**
   - Triagem criada com `status: 'pendente'`
   - `prioridade: 'ALTA'` (50+30+50 = 130 ≥ 70)
   - `dados_acolhimento` JSONB preenchido
   - Redirecionado para `/acompanhamento`

### TC-08: Fluxo completo — prioridade MÉDIA

1. Nova triagem
2. Etapa 3: "Saúde e medicação" (25 pts)
3. Etapa 4: "media" (15 pts), sem situações
4. **Esperado:** `prioridade: 'MEDIA'` (25+15 = 40, ≥30)

### TC-09: Fluxo completo — prioridade BAIXA

1. Nova triagem
2. Etapa 3: "Orientação social" (5 pts)
3. Etapa 4: "baixa" (0 pts), sem situações
4. **Esperado:** `prioridade: 'BAIXA'` (5+0 = 5, <30)

### TC-10: Validação de etapas

1. Tentar avançar etapa 1 sem preencher telefone
2. **Esperado:** Erro de validação, não avança

### TC-11: Navegação entre etapas

1. Preencher etapa 1, avançar para etapa 2
2. Clicar "Voltar"
3. **Esperado:** Dados da etapa 1 preservados

### TC-12: Barra de progresso

1. Iniciar triagem
2. Avançar pelas etapas
3. **Esperado:** Barra mostra etapa atual e etapas concluídas

### TC-13: Revisão antes de enviar

1. Preencher todas as etapas
2. Chegar na etapa 5
3. **Esperado:** Painel mostra todos os dados preenchidos (contato, família, motivo, urgência, relato)

### TC-14: Editar triagem existente

1. Ter uma triagem já salva
2. Acessar `/triagem?editar=1`
3. **Esperado:** Formulário preenchido com dados existentes
4. Alterar motivo, submeter
5. **Esperado:** Triagem atualizada (UPDATE, não INSERT)

---

## 3. Dashboard do Requerente

### TC-15: Dashboard com caso ativo

1. Ter uma triagem com `status: 'pendente'`
2. Logar como requerente
3. **Esperado:** Dashboard mostra:
   - Status do caso (badge colorido)
   - Resumo da triagem (demanda, urgência, prioridade)
   - Acesso rápido para chat, documentos, videochamada

### TC-16: Dashboard sem caso

1. Logar como requerente sem triagens
2. **Esperado:** Mensagem "Nenhum caso ativo" com botão para iniciar triagem

### TC-17: Normalização de dados legados

1. Criar triagem com formato legado (texto em `detalhes`, sem JSONB)
2. Acessar dashboard
3. **Esperado:** Dados exibidos corretamente via fallback de parsing

---

## 4. Chat Caso-a-Caso

### TC-18: Requerente envia mensagem

1. Logar como requerente
2. Acessar chat do caso
3. Digitar mensagem, enviar
4. **Esperado:**
   - Mensagem aparece imediatamente (optimistic update)
   - Registro em `mensagens_caso` com `caso_id` e `remetente_id`

### TC-19: Profissional recebe em tempo real

1. Com chat aberto no assistente social
2. Requerente envia mensagem
3. **Esperado:** Mensagem aparece sem refresh (Realtime)

### TC-20: Histórico de mensagens

1. Enviar várias mensagens
2. Fechar e reabrir chat
3. **Esperado:** Histórico completo, ordem cronológica

### TC-21: RLS — requerente não vê outros casos

1. Ter dois casos diferentes
2. Acessar chat de um caso
3. **Esperado:** Apenas mensagens do caso atual visíveis

---

## 5. Cofre Digital (Documentos)

### TC-22: Upload de documento

1. Logar como requerente
2. Acessar documentos do caso
3. Arrastar um PDF para a zona de upload
4. **Esperado:**
   - Arquivo aparece na lista
   - Metadados: nome, tamanho, data, quem fez upload
   - Arquivo acessível em `storage.buckets['documentos-caso']`

### TC-23: Upload por profissional

1. Logar como assistente social
2. Fazer upload de documento para o mesmo caso
3. **Esperado:** Documento aparece para ambos (requerente e profissional)

### TC-24: Download de documento

1. Clicar em "Download" em um documento
2. **Esperado:** Arquivo baixado via URL assinada

### TC-25: Delete de documento

1. Deletar um documento que o próprio usuário fez upload
2. **Esperado:** Documento removido da lista e do Storage

### TC-26: RLS — participante não vê documentos de outro caso

1. Ter dois casos
2. Acessar documentos de um caso
3. **Esperado:** Apenas documentos do caso atual

---

## 6. Videochamada

### TC-27: Assistente inicia videochamada

1. Logar como assistente social
2. Acessar caso, clicar "Iniciar Videochamada"
3. **Esperado:**
   - Sala Daily.co criada via `POST /api/rooms`
   - `daily_room_url` e `daily_room_name` preenchidos em `triagens`
   - Status muda para `em_atendimento`

### TC-28: Requerente na sala de espera

1. Logar como requerente
2. Acessar videochamada do caso
3. **Esperado:** Tela "Aguardando profissional..." com mensagem informativa

### TC-29: Conexão da videochamada

1. Assistente inicia chamada
2. Requerente é conectado automaticamente
3. **Esperado:** Vídeo e áudio funcionando para ambos

### TC-30: Requerente sai da chamada

1. Requerente clica "Sair"
2. **Esperado:** iframe Daily.co destruído, volta para dashboard

---

## 7. Plano de Ação

### TC-31: Assistente cria tarefa

1. Logar como assistente social
2. Acessar plano de ação do caso
3. Criar tarefa: título, descrição, responsável "requerente", data limite
4. **Esperado:** Tarefa aparece na lista com status "pendente"

### TC-32: Requerente marca como concluída

1. Logar como requerente
2. Acessar plano de ação
3. Marcar tarefa como concluída
4. **Esperado:** Status muda para "concluido"

### TC-33: Filtros por status

1. Ter tarefas em diferentes status
2. Clicar filtro "Pendentes"
3. **Esperado:** Apenas tarefas pendentes visíveis

### TC-34: Modo requerente vs assistente

1. Requerente: apenas pode marcar tarefas como concluídas
2. Assistente: pode criar, editar e excluir tarefas
3. **Esperado:** Permissões corretas em cada modo

---

## Checklist de validação RLS

Executar direto no Supabase SQL Editor para validar políticas:

```sql
-- Simular requerente
SET request.jwt.claims = '{"sub": "UUID-DO-REQUERENTE", "role": "authenticated"}';
SET role = 'authenticated';

-- Teste: requerente só vê suas triagens
SELECT count(*) FROM public.triagens;
-- Esperado: apenas as triagens do requerente

-- Teste: requerente não vê triagens de outros
SELECT * FROM public.triagens WHERE user_id != 'UUID-DO-REQUERENTE';
-- Esperado: 0 resultados

-- Voltar ao padrão
RESET role;
```

---

## Dados de teste sugeridos

### Requerente (email pessoal)
- Email: `maria.silva@gmail.com`
- Nome: Maria Silva da Cruz
- CPF: 123.456.789-00
- Telefone: (91) 99876-5432
- CRAS: CRAS Guamá

### Assistente social (email gov.br)
- Email: `joao.santos@gov.br`
- Nome: João Santos Lima
- Role: assistente_social

### Dados de triagem (ALTA prioridade)
- Telefone: (91) 99876-5432
- Idade: 34
- Bairro: Guamá
- Composição: Mãe/Pai solo com filhos
- Renda: Sem renda
- Benefícios: Bolsa Família
- Demanda: Violência ou ameaça
- Urgência: alta
- Situações: Risco de violência, Falta de alimento
- Relato: "Preciso de ajuda com situação de violência doméstica e falta de alimentação para meus filhos"
