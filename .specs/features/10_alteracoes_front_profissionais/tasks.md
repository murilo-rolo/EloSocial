# Tasks: Alterações Frontend Profissionais

7 tasks atômicas, ordem sequencial recomendada.

---

## Task 1: Remover /chat-ia

**Arquivos**: `App.jsx`, `Sidebar.jsx`, `ChatIA.jsx`
**Requisito**: REQ-01

### Ações
1. App.jsx: remover rota `/chat-ia` (linha 71)
2. App.jsx: remover import de `ChatIA` (linha 25)
3. Sidebar.jsx: remover link `{ to: '/chat-ia', label: 'Chat IA', ... }` (linha 22)
4. Deletar `frontend/src/pages/ChatIA.jsx`

### Verificação
- [ ] Rota `/chat-ia` não existe mais
- [ ] Sidebar não tem link "Chat IA"
- [ ] App compila sem erros

---

## Task 2: Remover barra IA de RequerenteDetail

**Arquivo**: `RequerenteDetail.jsx`
**Requisito**: REQ-02

### Ações
1. Remover estados: `runningTriagem`, `generatingResumo`, `resumoText`, `showResumo`
2. Remover handlers: `handleTriagem`, `handleResumo`
3. Remover import de `ReactMarkdown`
4. Remover barra "Assistentes de IA" (linhas 143-171)
5. Remover SlideOver de resumo (linhas 261-282)
6. Manter `ChatLLM` (Copiloto SUAS)

### Verificação
- [ ] Botões "Triagem IA" e "Resumo IA" não aparecem
- [ ] Copiloto SUAS (ChatLLM) ainda no final da página
- [ ] App compila sem erros

---

## Task 3: Adicionar Plano de Ação ao RequerenteDetail

**Arquivo**: `RequerenteDetail.jsx`
**Requisito**: REQ-03, REQ-06

### Ações
1. Importar `PlanoAcaoCaso` de `../components/caso/PlanoAcaoCaso`
2. Importar `ClipboardList` de `lucide-react`
3. Adicionar card "Plano de Ação" entre "Linha do Tempo" e "Mensagens" com `PlanoAcaoCaso casoId={caso?.id} modo="assistente" applicantId={id}`

### Verificação
- [ ] Card "Plano de Ação" aparece com tarefas do caso
- [ ] "Nova Tarefa" visível (modo assistente)
- [ ] Criar tarefa → aparece em `/acompanhamento`

---

## Task 4: Melhorar visual Mensagens

**Arquivo**: `MensagensCaso.jsx`, `index.css`
**Requisito**: REQ-05

### Ações
1. Adicionar avatar circular com inicial do nome do remetente
2. Balões com borderRadius: 12px, boxShadow sutil
3. Data/hora inline no balão
4. Fundo contrastante (próprio vs recebido)

### Verificação
- [ ] Mensagens têm balões modernos
- [ ] Avatar com inicial aparece
- [ ] Data inline no balão

---

## Task 5: Remover /agenda

**Arquivos**: `App.jsx`, `Sidebar.jsx`, `Agenda.jsx`
**Requisito**: REQ-04

### Ações
1. App.jsx: remover rota `/agenda` (linha 63)
2. App.jsx: remover import de `Agenda` (linha 8)
3. Sidebar.jsx: remover link `{ to: '/agenda', label: 'Agenda', ... }` (linha 19)
4. Deletar `frontend/src/pages/Agenda.jsx`

### Verificação
- [ ] Rota `/agenda` não existe mais
- [ ] Sidebar sem "Agenda"
- [ ] Topbar.jsx referencias a agendamentos ainda funcionam

---

## Task 6: Adicionar Agendamentos no Plano de Ação

**Arquivo**: `PlanoAcaoCaso.jsx`
**Requisito**: REQ-04

### Ações
1. Aceitar prop `applicantId`
2. Quando `applicantId` presente e `modo="assistente"`, renderizar sub-seção "Agendamentos"
3. Lista compacta de `agendamentos WHERE applicant_id = :applicantId`
4. Modal "Novo Agendamento" com campos: requerente (pré-preenchido), data_hora, tipo, observações

### Verificação
- [ ] Agendamentos do requerente aparecem no Plano de Ação
- [ ] Criar agendamento persiste e aparece na lista
- [ ] Atualizar status (Concluir/Cancelar) funciona

---

## Task 7: Agendar Video Chamada

**Arquivo**: `PlanoAcaoCaso.jsx`
**Requisito**: REQ-07

### Ações
1. Botão "Agendar Video Chamada" na sub-seção de agendamentos
2. Modal com data/hora (opcional) + observações
3. Chama `POST /api/rooms` com `privacy: 'private'`
4. Exibe link + código de acesso
5. Opcional: cria item em `planos_acao` vinculado ao caso

### Verificação
- [ ] Botão "Agendar Video Chamada" aparece
- [ ] Sala Daily.co criada via POST /api/rooms
- [ ] Link e código de acesso exibidos
