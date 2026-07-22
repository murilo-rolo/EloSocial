1) Atualmente, quando alguém troca mensagens com o requerente, essa mensagem é mostrada em broadcast para outros profissionais, mas o chat em /requerentes/:id deve ser único para cada profissional, podendo ver suas mensagens somente com o requerente, sem poder ver mensagens de outros.

2) Adiciona seção de 'Documentos' em /requerentes/:id e mostrar documentos enviados por aquele requerente.

3) Em /requerentes/:id, há a prioridade do caso. Ela deve ser removida, tanto do banco de dados como da interface do requerente e dos profissionais.

4) Agendamentos devem aparecer em 'Plano de Ação' para o requerente, de modo que possa vê-las como parte do 'Plano de Ação'

5) Em /requerentes, as informações sobre o requerente são "Requerente Principal	Contato	Triagem	Ações", troque por "Requerente	Contato	Status	'Assistente Social'", Motivo deve ser o mesmo da triagem. Além disso, adicione uma seção em requerentes/:id com as informações da triagem do requerente. Além disso, tire a opção de mudar status a partir de requerentes/, deixe a opção de alterar somente no detalhe (requerentes/:id)

6) Tirar o lápis para alterar status do requerente em /requerente