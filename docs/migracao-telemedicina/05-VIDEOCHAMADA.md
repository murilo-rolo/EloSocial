# 05 — Videochamada com Sala de Espera

## Contexto

O EloSocial já possui `Videoconferencia.jsx` para criar e entrar em salas Daily.co entre profissionais. A extensão adiciona uma sala de espera para o requerente, que é conectado quando o profissional inicia a chamada.

**Referência EloSocial**: `Videoconferencia.jsx` (salas Daily.co, iframe `daily-js`), endpoint `POST /api/rooms`

---

## RF — Requisitos Funcionais

### RF-01: Sala de espera

Quando o caso do requerente não está com status `em_atendimento`, a página de video deve exibir uma sala de espera com:
- Mensagem "Aguardando atendimento..."
- Nome do caso e prioridade
- Indicador visual de que o sistema está aguardando (animação)

### RF-02: Conexão automática via Realtime

A sala de espera deve assinar Realtime na tabela `triagens` filtrado por `id` do caso. Quando o status muda para `em_atendimento` e `daily_room_url` é preenchido, o requerente deve ser conectado automaticamente ao iframe Daily.co.

### RF-03: Videochamada ativa

Ao receber a URL da sala, a página deve renderizar o componente `VideoCall` (wrapper do Daily.co iframe).

### RF-04: Vínculo sala-caso

O endpoint `POST /api/rooms` deve aceitar um campo opcional `caso_id`. Quando fornecido, o backend deve:
1. Criar a sala Daily.co (comportamento existente)
2. Atualizar a tabela `triagens`: preencher `daily_room_url`, `daily_room_name`, `daily_room_created_at`, `daily_room_expires_at`, e mudar `status` para `em_atendimento`

### RF-05: Fim da chamada

Quando o profissional encerra a chamada:
1. Status do caso muda para `em_acompanhamento`
2. `daily_room_url` é limpo (null)
3. Requerente recebe notificação via Realtime e exibe mensagem "Chamada encerrada"

### RF-06: Página do requerente

Criar `VideoRequerente.jsx` que:
1. Busca o caso mais recente do requerente
2. Se caso não existe → mensagem informativa
3. Se caso não está `em_atendimento` → sala de espera
4. Se caso está `em_atendimento` com `daily_room_url` → iframe de vídeo

### RF-07: Expiração da sala

Salas devem expirar após 7 dias (comportamento já existente no Daily.co). O campo `daily_room_expires_at` na tabela `triagens` deve ser preenchido com timestamp + 7 dias.

---

## RNF — Requisitos Não-Funcionais

### RNF-01: Experiência de espera

A sala de espera deve ter animação suave (pulse) para indicar que o sistema está aguardando, evocando sensação de "fila" ao invés de "tela travada".

### RNF-02: Transição fluida

A transição de sala de espera para videochamada ativa deve ser instantânea (sem reload da página), guiada apenas pelo Realtime.

### RNF-03: Reaproveitamento do iframe

O componente `VideoCall` (wrapper Daily.co) deve ser compartilhado entre `Videoconferencia.jsx` (profissionais) e `VideoRequerente.jsx` (requerente).

### RNF-04: Dimensões do vídeo

O iframe de vídeo deve ocupar a maior parte da tela disponível (altura calculada viewport - header), garantindo boa experiência em desktop e mobile.
