# Corrigir RLS: Documentos e Tarefas visíveis para profissionais

## Descrição

Profissionais (role != 'requerente') que não são o `user_id` nem o `assistente_social_id` do caso
conseguem ver a triagem mas não conseguem ver os documentos nem as tarefas (planos de ação)
relacionados a esse caso, devido a RLS policies restritivas demais.

Além disso, o assistente social atribuído ao caso não consegue excluir tarefas porque
a tabela `planos_acao` não possui uma RLS policy de DELETE.

## Acceptance Criteria

### AC-01: Profissional vê documentos de qualquer caso
Dado um profissional logado (role != 'requerente') que não é `user_id` nem `assistente_social_id` de um caso,
quando ele acessa a página de detalhe do requerente,
então ele deve conseguir visualizar os documentos do caso.

### AC-02: Profissional vê tarefas de qualquer caso
Dado um profissional logado (role != 'requerente') que não é `user_id` nem `assistente_social_id` de um caso,
quando ele acessa a página de detalhe do requerente,
então ele deve conseguir visualizar as tarefas (planos de ação) do caso.

### AC-03: Assistente social exclui tarefa do próprio caso
Dado um assistente social logado que é o `assistente_social_id` de um caso,
quando ele clica em excluir uma tarefa desse caso,
então a tarefa deve ser removida com sucesso.

### AC-04: Requerente NÃO vê tarefas nem documentos de outros casos
Dado um requerente logado,
quando ele tenta acessar documentos ou tarefas de um caso que não é seu,
então o RLS deve bloquear o SELECT (comportamento existente preservado).
