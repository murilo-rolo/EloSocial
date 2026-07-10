# 02 — Triagem Social

## Contexto

A triagem social é o passo principal de coleta de dados do requerente. Após o cadastro mínimo (auth + identificação), o requerente é redirecionado para a triagem, que coleta dados socioeconômicos e cria o caso de atendimento na tabela `triagens`. Não existe equivalente no EloSocial atual.

---

## RF — Requisitos Funcionais

### RF-01: Formulário multi-step

O formulário deve guiar o requerente por 5 etapas sequenciais com validação em cada etapa antes de avançar:

| Etapa | Nome | Campos obrigatórios |
|---|---|---|
| 1 | Contato | telefone, idade, bairro_localidade, territorio_cras |
| 2 | Família | composicao_familiar (multi-select), renda_familiar |
| 3 | Motivo | demanda_principal (9 categorias com ícones) |
| 4 | Urgência | urgencia_nivel (rádio: alta/média/baixa) |
| 5 | Relato + Revisão | relato (textarea) |

### RF-02: Campos opcionais por etapa

Etapa 1: cartao_sus_nis, ponto_referencia
Etapa 2: beneficios_sociais (checkbox group), outros_beneficios
Etapa 3: outra_demanda (condicional, aparece quando demanda_principal = "Outra necessidade")
Etapa 4: situacoes (checkbox group de 9 opções de vulnerabilidade), outra_situacao

### RF-03: Cálculo de pontuação de risco

Cada escolha gera pontos. A prioridade é determinada pela soma total:

**Demanda principal:**

| Demanda | Pontos |
|---|---|
| Violência ou ameaça | 50 |
| Alimentação | 40 |
| Moradia ou risco de despejo | 35 |
| Criança, adolescente, idoso ou PCD em risco | 35 |
| Saúde e medicação | 25 |
| Benefícios sociais | 20 |
| Documentação | 10 |
| Orientação social | 5 |
| Outra necessidade | 10 |

**Situações selecionadas:**

| Situação | Pontos |
|---|---|
| Risco de violência | 50 |
| Falta de alimento | 40 |
| Criança ou adolescente em risco | 35 |
| Idoso ou PCD em risco | 35 |
| Sem moradia ou risco de despejo | 35 |
| Pessoa doente sem acompanhamento | 25 |
| Família sem renda | 20 |
| Benefício bloqueado ou pendente | 10 |
| Documentação pendente | 5 |
| Outra situação | 10 |

**Urgência:**

| Nível | Pontos |
|---|---|
| alta | 30 |
| media | 15 |
| baixa | 0 |

**Prioridade**: soma total ≥70 = ALTA, ≥30 = MÉDIA, <30 = BAIXA

### RF-04: Opções de cada etapa

#### Etapa 1 — Contato

Campos de texto livre: telefone, idade, cartao_sus_nis, bairro_localidade, ponto_referencia. O campo territorio_cras é um select com as 12 unidades CRAS de Belém.

#### Etapa 2 — Família

**Composição familiar** (multi-select):

| Opção |
|---|
| Mora sozinho(a) |
| Casal sem filhos |
| Casal com filhos |
| Mãe/Pai solo com filhos |
| Família estendida (com avós, tios, etc) |
| Abrigo ou Instituição |
| Situação de rua |
| Outro |

**Renda familiar** (select):

| Opção |
|---|
| Sem renda |
| Até 1 salário mínimo |
| De 1 a 2 salários mínimos |
| Acima de 2 salários mínimos |
| Não sabe informar |
| Prefere não informar |

**Benefícios sociais** (checkbox group):

| Opção | Regra |
|---|---|
| Bolsa Família | Multi-seleção |
| BPC | Multi-seleção |
| Auxílio eventual | Multi-seleção |
| Benefício bloqueado | Multi-seleção |
| Nenhum | Exclusivo — limpa outras seleções |
| Não sei informar | Exclusivo — limpa outras seleções |
| Outro | Exibe campo de texto "Outro benefício" |

#### Etapa 3 — Motivo

**Demanda principal** (grid de cards com ícones):

| ID | Título | Ícone |
|---|---|---|
| Alimentação | Alimentação | HeartHandshake |
| Moradia ou risco de despejo | Moradia | Home |
| Violência ou ameaça | Violência ou ameaça | AlertTriangle |
| Benefícios sociais | Benefícios sociais | ClipboardList |
| Documentação | Documentação | CreditCard |
| Criança, adolescente, idoso ou PCD em risco | Pessoa vulnerável | Users |
| Saúde e medicação | Saúde e medicação | Shield |
| Orientação social | Orientação social | FileText |
| Outra necessidade | Outra necessidade | CheckCircle |

Quando "Outra necessidade" é selecionada, exibir campo de texto "Outra necessidade".

#### Etapa 4 — Urgência

**Nível de urgência** (radio):

| Valor | Label |
|---|---|
| baixa | Posso aguardar |
| media | Retorno breve |
| alta | Atenção imediata |

**Situações de vulnerabilidade** (checkbox group):

| Opção |
|---|
| Risco de violência |
| Falta de alimento |
| Sem moradia ou risco de despejo |
| Criança ou adolescente em risco |
| Idoso ou PCD em risco |
| Pessoa doente sem acompanhamento |
| Família sem renda |
| Benefício bloqueado ou pendente |
| Documentação pendente |

Toggle "Outra situação" exibe campo de texto livre.

### RF-05: Serialização dos dados

O formulário deve gerar:
- `dados_acolhimento` (JSONB): dados estruturados com 5 blocos (contato, familia, motivo, urgencia, relato)
- `detalhes` (texto): resumo textual legível dos dados
- `sintomas` (array): demanda principal + situações selecionadas
- `prioridade`: ALTA, MÉDIA ou BAIXA

**Estrutura `dados_acolhimento` (JSONB):**

```json
{
  "contato": {
    "telefone": "",
    "idade": "",
    "cartao_sus_nis": "",
    "bairro_localidade": "",
    "ponto_referencia": "",
    "territorio_cras": ""
  },
  "familia": {
    "composicao_familiar": "",
    "renda_familiar": "",
    "beneficios_sociais": [],
    "outros_beneficios": ""
  },
  "motivo": {
    "demanda_principal": "",
    "outra_demanda": ""
  },
  "urgencia": {
    "nivel": "",
    "situacoes": [],
    "outra_situacao": ""
  },
  "relato": ""
}
```

### RF-06: Inserção no banco

Após preenchimento completo, o sistema deve:
1. Inserir registro na tabela `triagens` com `user_id` do requerente e `status: 'pendente'`
2. Redirecionar para `/acompanhamento`

### RF-07: Modo de edição

Acessado via `/triagem?editar=1`. O formulário deve:
- Buscar a triagem mais recente do requerente
- Preencher todos os campos com dados existentes
- Ao salvar, fazer `UPDATE` em vez de `INSERT`

### RF-08: Barra de progresso

O formulário deve exibir uma barra de progresso indicando a etapa atual e as etapas concluídas.

### RF-09: Revisão antes de salvar

A etapa 5 deve exibir um painel com todos os dados preenchidos nas etapas anteriores, permitindo ao requerente revisar antes de enviar.

### RF-10: Navegação entre etapas

O requerente deve poder voltar para etapas anteriores sem perder dados preenchidos.

---

## RNF — Requisitos Não-Funcionais

### RNF-01: Animação de transição

As etapas devem ter animação suave de transição (padrão `fade-up`).

### RNF-02: Validação client-side

Todas as validações devem ocorrer no client antes do envio, evitando chamadas desnecessárias ao banco.

### RNF-03: Design mobile-first

O formulário deve ser responsivo e usável em dispositivos móveis, já que requerentes podem acessar pelo celular.

### RNF-04: Estilo consistente

Devem ser usadas as CSS custom properties existentes no EloSocial (`var(--bg)`, `var(--border)`, `var(--accent)`, etc.) para manter consistência visual.

### RNF-05: Dados legados

A normalização dos dados deve suportar ambos os formatos (JSONB direto e fallback para parsing de texto), garantindo compatibilidade com registros futuros.
