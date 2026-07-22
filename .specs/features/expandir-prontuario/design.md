# Design: Expandir Prontuário SUAS

## Architecture

No database schema changes — `dados_json` (JSONB) comporta a expansão. As mudanças são no frontend (schema, form, view) e backend (PDF generator).

## Component Tree

```
prontuarioSchema.js        ← Schema vazio + constantes + opções + migrator
ProntuarioEdit.jsx          ← Formulário com seções explícitas
ProntuarioView.jsx          ← Visualização com renderizadores por tipo
pdf_generator.py            ← Renderização PDF
```

## Data Flow

```
[PDF Oficial] → prontuarioSchema.js (schema expandido)
                                    ↓
[ProntuarioEdit] → dados_json (JSONB) → [ProntuarioView]
                                    ↓
                              pdf_generator.py → PDF
```

## Migration Strategy

Em `prontuarioSchema.js`:
```
function migrarSchemaAntigo(dados):
  detectar schema antigo (falta campos novos)
  preencher defaults para campos ausentes
  retornar schema expandido
```

Executado em `ProntuarioEdit.jsx` e `ProntuarioView.jsx` ao carregar dados.

## Field Structure Design

### Princípios:

1. Cada seção do PDF vira uma chave em `dados_json`
2. Opções `[ ]` viram campos string com valores predefinidos
3. Tabelas viram arrays de objetos
4. Legendas/códigos viram arrays de constantes para selects
5. Campos calculados (perfil etário, pessoas/dormitório) são atualizados automaticamente

### Schema expandido (seções modificadas):

```javascript
identificacao: {
  logradouro, numero, complemento, bairro, municipio, uf, cep,
  apelido: '',
  localizacao_domicilio: '',     // 'Urbano' | 'Rural' | 'Abrigo'
  tipo_unidade: '',              // 'CRAS' | 'CREAS'
  nome_unidade: '',
  forma_ingresso: '',            // 10 opções
  motivo_primeiro_atendimento: '',
  programas_sociais: {           // checkboxes com valor
    bolsa_familia: { ativo: false, valor: '' },
    bpc: { ativo: false, valor: '' },
    peti: { ativo: false, valor: '' },
    outros: { ativo: false, valor: '', descricao: '' },
  }
}

composicao_familiar: [{
  nome, parentesco, sexo, data_nascimento,
  pessoa_com_deficiencia: false,
  documentacao: []               // ['CN','RG','CTPS','CPF','TE']
}]

perfil_etario: {
  '0_a_6': 0, '7_a_14': 0, '15_a_17': 0, '18_a_29': 0,
  '30_a_59': 0, '60_a_64': 0, '65_a_69': 0, '70_mais': 0,
  total: 0
}

especificidades_sociais: {
  situacao_rua: false,
  quilombola: false,
  ribeirinha: false,
  cigana: false,
  indigena_aldeia: { ativo: false, etnia: '' },
  indigena_nao_aldeia: { ativo: false, etnia: '' },
}

habitacional: {
  tipo_residencia: '',           // 'Propria' | 'Alugada' | 'Cedida' | 'Ocupada'
  material_paredes: '',          // 'Alvenaria' | 'Precaria'
  energia_eletrica: '',          // 'Medidor_proprio' | 'Medidor_compartilhado' | 'Sem_medidor' | 'Nao_possui'
  agua_canalizada: '',           // 'Sim' | 'Nao'
  abastecimento_agua: '',        // 'Rede_geral' | 'Poco' | 'Cisterna' | 'Carro_pipa' | 'Outra'
  escoamento_sanitario: '',      // 'Rede_esgoto' | 'Fossa_septica' | 'Fossa_rudimentar' | 'Vala' | 'Sem_banheiro'
  coleta_lixo: '',               // 'Direta' | 'Indireta' | 'Nao_possui'
  total_comodos: 0,
  dormitorios: 0,
  pessoas_por_dormitorio: 0,    // calculado
  area_risco: '',                // 'Sim' | 'Nao'
  acesso_dificil: '',            // 'Sim' | 'Nao'
  conflito_violencia: '',        // 'Sim' | 'Nao'
}

educacional: {
  vulnerabilidades: {
    '0_a_5_sem_creche': 0,
    '6_a_14_sem_escola': 0,
    '15_a_17_sem_escola': 0,
    '10_a_17_nao_alfabetizado': 0,
    '18_a_59_nao_alfabetizado': 0,
    '60_mais_nao_alfabetizado': 0,
  },
  condicionalidades_bf: [{ mes_ano: '', efeito: '' }], // efeito: Advertencia/Bloqueio/1a_Suspensao/2a_Suspensao/Cancelamento
  membros: [{
    ordem, nome, idade,
    sabe_ler: '',                // 'S' | 'N'
    frequenta_escola: '',        // 'S' | 'N'
    escolaridade: '',            // 16 códigos (texto)
  }]
}

trabalho_renda: {
  renda_total_sem_programas: '',
  renda_per_capita_sem_programas: '',
  renda_total_com_programas: '',
  renda_per_capita_com_programas: '',
  aposentados: '',
  membros: [{
    ordem, nome, idade,
    possui_ctps: '',             // 'S' | 'N'
    condicao_ocupacao: '',       // 7 códigos
    possui_qualificacao: '',     // 'S' | 'N'
    qualificacao: '',
    renda_mensal: '',
  }]
}

saude: {
  deficiencias: [{
    ordem, nome,
    tipos: [],                   // array de 7 tipos
    necessita_cuidador: '',      // 'Sim' | 'Nao'
    responsavel_cuidador: '',
  }],
  pessoa_necessita_cuidados: { resposta: '', nomes: '', responsavel: '' },
  inseguranca_alimentar: { resposta: '', data: '' },
  doencas_graves: { resposta: '', descricao: '' },
  remedios_controlados: { resposta: '', nomes: '' },
  uso_alcool: { resposta: '', nomes: '', data: '' },
  uso_drogas: { resposta: '', nomes_substancias: '', data: '' },
  gestantes: [{
    ordem, nome, meses_gestacao: 0, pre_natal: '', data_anotacao: ''
  }],
  condicionalidades_bf: [{ ordem, nome, semestre: '', efeito: '' }],
}

beneficios: {
  registros: [{
    data: '', tipo: '',           // 'Auxilio_Natalidade' | 'Auxilio_Funeral'
    observacao: '',
    registro_nascimento: '',
    cpf_falecido: '',
  }]
}

convivencia: {
  dependentes_sozinhos: { resposta: '', observacao: '' },
  discriminacao: { resposta: '', observacao: '' },
  tempo_residencia: {
    estado: { anos: 0, sempre: false },
    municipio: { anos: 0, sempre: false },
    bairro: { anos: 0, sempre: false },
  },
  rede_apoio_parentes: { resposta: '', observacao: '' },
  rede_apoio_vizinhos: { resposta: '', observacao: '' },
  grupos_religiosos_comunitarios: { resposta: '', observacao: '' },
  lazer_crianca: { resposta: '' },     // 'Sim' | 'Nao' | 'Nao_se_aplica'
  lazer_idoso: { resposta: '' },       // 'Sim' | 'Nao' | 'Nao_se_aplica'
  relacoes_conjugais: [{
    tecnico: '', data: '', avaliacao: ''  // 'Conflituoso_com_violencia' | 'Conflituoso_sem_violencia' | 'Sem_conflitos'
  }],
  relacoes_pais_filhos: [{
    tecnico: '', data: '', avaliacao: ''
  }],
  relacoes_irmaos: [{
    tecnico: '', data: '', avaliacao: ''
  }],
  outros_conflitos: '',           // 'Sim_com_violencia' | 'Sim_sem_violencia' | 'Nao'
}

violencia: {
  quadro1: [{
    tipo: '',                    // 10 tipos
    persiste: '', data_anotacao: '',
    persiste_atualizacao: '', data_atualizacao: '',
  }],
  quadro2_creas: [{              // exclusivo CRAS
    data_inicio: '', data_fim: '', identificacao_creas: '',
  }],
  quadro3_creas: [{              // exclusivo CREAS
    ordem_pessoa: '', codigo_situacao: '', tipo: '', data_registro: '',
  }]
}

medidas_socioeducativas: [{
  ordem, nome, tipo_medida: '',  // 6 códigos
  numero_processo: '',
  data_inicio: '', data_fim: '',
  acompanhamento_creas: { resposta: '', data: '' },
  local_psc: '',
}]

acolhimento_institucional: {
  historico: [{ ordem, nome, data_inicio: '', data_fim: '', motivo: '' }],
  acolhimento_familia: { periodo: '', motivo: '' },
  guarda_informal: { periodo: '', razao: '', responsavel: '', crianca: '' },
  membro_prisao: false,
  adolescente_internacao: false,
}

planejamento_evolucao: {
  inclusao_desligamento: [{
    incluir: false, data_inclusao: '',
    desligar: false, data_desligamento: '', razao_desligamento: '',
  }],
  planejamento_inicial: '',       // texto livre datado
  evolucao: '',                   // texto livre datado
}

encaminhamentos: [{
  area: '',                      // 7 opções
  orgao_destino: '',
  objetivo_motivo: '',
  data: '',
  contra_referencia: '',
}]
```

## Constants

Cada conjunto de opções vira uma constante exportada de `prontuarioSchema.js`:

- `LOCALIZACAO_DOMICILIO_OPCOES`, `TIPO_UNIDADE_OPCOES`
- `FORMA_INGRESSO_OPCOES`, `PROGRAMAS_SOCIAIS_LISTA`
- `TIPO_RESIDENCIA_OPCOES`, `MATERIAL_PAREDES_OPCOES`, `ENERGIA_OPCOES`
- `ESCOLARIDADE_OPCOES` (16), `CONDICAO_OCUPACAO_OPCOES` (7)
- `TIPO_DEFICIENCIA_OPCOES` (7)
- `TIPO_BENEFICIO_OPCOES`, `TIPO_MEDIDA_OPCOES`
- `AVALIACAO_RELACAO_OPCOES` (3)
- `AREA_ENCAMINHAMENTO_OPCOES` (7)
