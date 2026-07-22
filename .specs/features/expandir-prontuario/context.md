# Context: Expandir Prontuário SUAS

## User Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Schema antigo vs novo | Migrar ao salvar | Prontuários antigos mantêm schema até reabertura; migration automática no frontend |
| Campos calculados | Armazenar no JSON | perfil_etário e pessoas/dormitório calculados e salvos para consistência offline/histórico |
| Códigos vs texto opções | Armazenar texto | Consistente com o formato atual do sistema (ex: parentesco "Pessoa de Referência" em vez de código "1") |

## Execution Priority

- **Fase 1** (P1, 8 tarefas) → foco em expandir seções existentes com campos estruturados
- **Fase 2** (P2, 3 tarefas + migração + visualização) → novas seções + migração
- **Fase 3** (P2, 2 tarefas) → PDF generator + testes
