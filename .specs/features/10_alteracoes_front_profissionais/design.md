# Design: Alterações Frontend Profissionais

## Arquitetura do Plano de Ação em RequerenteDetail

O card "Plano de Ação" contém 3 sub-seções verticais:

```
┌─ Plano de Ação ───────────────────────┐
│                                        │
│  ┌─ Tarefas ───────────────────────┐  │
│  │  [PlanoAcaoCaso modo=assistente]  │  │
│  │  + Nova Tarefa                  │  │
│  └─────────────────────────────────┘  │
│                                        │
│  ┌─ Agendamentos ─────────────────┐  │
│  │  Lista compacta de agendamentos │  │
│  │  + Novo Agendamento (modal)    │  │
│  └─────────────────────────────────┘  │
│                                        │
│  [Agendar Video Chamada] btn          │
│                                        │
└────────────────────────────────────────┘
```

### Dados
- Tarefas: `planos_acao WHERE caso_id = :casoId`
- Agendamentos: `agendamentos WHERE applicant_id = :id`
- Video: cria `video_rooms` via POST /api/rooms

### Extensão do PlanoAcaoCaso
- Adicionar prop `applicantId`
- Quando `applicantId` presente e `modo="assistente"`, renderizar:
  1. Sub-seção Agendamentos com lista + modal de criação
  2. Botão "Agendar Video Chamada"

### Melhoria visual Mensagens
- Avatar/ícone inicial do nome (círculo com primeira letra)
- Balões com `borderRadius: 12`, sombra sutil (`boxShadow`)
- Data/hora inline no balão
- Fundo contrastante: próprio (accent) vs. recebido (surface)

### Fluxo Video Chamada
```
1. Profissional clica "Agendar Video Chamada"
2. Modal pergunta: data/hora (opcional) + observações
3. Frontend chama POST /api/rooms (já existe)
4. Sala criada → mostra link e código de acesso
5. Opcional: insere registro em planos_acao vinculado ao caso
```
