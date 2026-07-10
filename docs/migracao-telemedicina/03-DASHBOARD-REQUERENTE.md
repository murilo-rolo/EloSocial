# 03 — Dashboard do Requerente

## Contexto

Página principal do requerente após login. Mostra o status do caso, dados resumidos da triagem e acesso rápido às ferramentas de atendimento. Não existe equivalente no EloSocial atual.

---

## RF — Requisitos Funcionais

### RF-01: Busca do caso ativo

O dashboard deve buscar o caso mais recente do requerente na tabela `triagens` (filtrado por `user_id`, ordenado por `created_at` descendente, limit 1).

### RF-02: Estado vazio

Se o requerente não possui nenhum caso, o dashboard deve exibir:
- Mensagem "Nenhum caso em andamento"
- Botão "Iniciar Triagem" que redireciona para `/triagem`

### RF-03: Exibição do caso

Quando o caso existe, o dashboard deve exibir:
- Badge de status com cor (pendente=amarelo, em_atendimento=verde, em_acompanhamento=azul, concluido cinza)
- Badge de prioridade (ALTA, MÉDIA, BAIXA)
- Dados resumidos da triagem: contato, motivo, urgência
- Botão "Editar Triagem" (visível apenas quando status = `pendente`)

### RF-04: Acesso rápido

Quatro cards clicáveis para navegação rápida:
- Video Atendimento → `/video-atendimento`
- Mensagens → `/chat-atendimento`
- Plano de Ação → `/plano-acao`
- Cofre Digital → `/cofre-digital`

### RF-05: Atualização em tempo real

O dashboard deve assinar Realtime na tabela `triagens` para refletir mudanças de status instantaneamente (ex: profissional inicia videochamada, status muda de `pendente` para `em_atendimento`).

### RF-06: Caso encerrado

Quando status = `concluido`, o dashboard deve exibir os dados do caso mas desabilitar os links de ação (vídeo, chat).

### RF-07: Normalização de dados

O dashboard deve suportar ambos os formatos de dados:
- `dados_acolhimento` (JSONB) — formato novo
- Fallback para parsing do texto em `detalhes` — formato legado

---

## RNF — Requisitos Não-Funcionais

### RNF-01: Atualização sem recarregamento

As mudanças de status devem refletir na interface sem recarregamento da página, usando Realtime.

### RNF-02: Layout responsivo

Os cards de acesso rápido devem se adaptar: 2 colunas em mobile, 4 colunas em desktop.

### RNF-03: Consistência visual

O dashboard deve usar o componente `Layout` existente para manter sidebar e topbar consistentes com o resto do sistema.
