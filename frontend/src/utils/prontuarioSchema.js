// Estrutura vazia do Prontuário SUAS
export function emptyProntuario() {
  return {
    identificacao: {
      logradouro: '', numero: '', complemento: '', bairro: '',
      municipio: '', uf: '', cep: '',
      apelido: '',
      localizacao_domicilio: '',
      tipo_unidade: '',
      nome_unidade: '',
      forma_ingresso: '',
      motivo_primeiro_atendimento: '',
      orgao_encaminhador: '',
      programas_sociais: {
        bolsa_familia: { ativo: false, valor: '' },
        bpc: { ativo: false, valor: '' },
        peti: { ativo: false, valor: '' },
        outros: { ativo: false, valor: '', descricao: '' },
      },
    },
    composicao_familiar: [],
    perfil_etario: {
      '0_a_6': 0, '7_a_14': 0, '15_a_17': 0, '18_a_29': 0,
      '30_a_59': 0, '60_a_64': 0, '65_a_69': 0, '70_mais': 0,
      total: 0,
    },
    especificidades_sociais: {
      situacao_rua: false,
      quilombola: false,
      ribeirinha: false,
      cigana: false,
      indigena_aldeia: { ativo: false, etnia: '' },
      indigena_nao_aldeia: { ativo: false, etnia: '' },
    },
    habitacional: {
      tipo_residencia: '',
      material_paredes: '',
      energia_eletrica: '',
      agua_canalizada: '',
      abastecimento_agua: '',
      escoamento_sanitario: '',
      coleta_lixo: '',
      total_comodos: 0,
      dormitorios: 0,
      pessoas_por_dormitorio: 0,
      area_risco: '',
      acesso_dificil: '',
      conflito_violencia: '',
    },
    educacional: {
      vulnerabilidades: {
        '0_a_5_sem_creche': 0,
        '6_a_14_sem_escola': 0,
        '15_a_17_sem_escola': 0,
        '10_a_17_nao_alfabetizado': 0,
        '18_a_59_nao_alfabetizado': 0,
        '60_mais_nao_alfabetizado': 0,
      },
      condicionalidades_bf: [],
      membros: [],
    },
    trabalho_renda: {
      renda_total_sem_programas: '',
      renda_per_capita_sem_programas: '',
      renda_total_com_programas: '',
      renda_per_capita_com_programas: '',
      aposentados: '',
      membros: [],
    },
    saude: {
      deficiencias: [],
      pessoa_necessita_cuidados: { resposta: '', nomes: '', responsavel: '' },
      inseguranca_alimentar: { resposta: '', data: '' },
      doencas_graves: { resposta: '', descricao: '' },
      remedios_controlados: { resposta: '', nomes: '' },
      uso_alcool: { resposta: '', nomes: '', data: '' },
      uso_drogas: { resposta: '', nomes_substancias: '', data: '' },
      gestantes: [],
      condicionalidades_bf: [],
    },
    beneficios: {
      registros: [],
    },
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
      lazer_crianca: { resposta: '' },
      lazer_idoso: { resposta: '' },
      relacoes_conjugais: [],
      relacoes_pais_filhos: [],
      relacoes_irmaos: [],
      outros_conflitos: '',
    },
    participacao: {
      participacao_programas: '',
    },
    violencia: {
      quadro1: [],
      quadro2_creas: [],
      quadro3_creas: [],
    },
    encaminhamentos: [],
    observacoes: '',
  }
}

// Seções e seus campos
export const SECOES = [
  { key: 'identificacao', title: '1. Identificação e Endereço', icon: '📍' },
  { key: 'composicao_familiar', title: '2. Composição Familiar', icon: '👨‍👩‍👧‍👦' },
  { key: 'habitacional', title: '3. Condições Habitacionais', icon: '🏠' },
  { key: 'educacional', title: '4. Condições Educacionais', icon: '📚' },
  { key: 'trabalho_renda', title: '5. Trabalho e Rendimento', icon: '💼' },
  { key: 'saude', title: '6. Condições de Saúde', icon: '🏥' },
  { key: 'beneficios', title: '7. Benefícios Eventuais', icon: '🎯' },
  { key: 'convivencia', title: '8. Convivência Familiar', icon: '💝' },
  { key: 'participacao', title: '9. Participação em Programas', icon: '📋' },
  { key: 'violencia', title: '10. Violência e Violação de Direitos', icon: '🛡️' },
  { key: 'encaminhamentos', title: '11. Encaminhamentos', icon: '➡️' },
  { key: 'observacoes', title: '12. Observações Técnicas', icon: '📝' },
]

export const PARENTESCO_OPCOES = [
  'Pessoa de Referência', 'Cônjuge/Companheiro(a)', 'Filho(a)',
  'Enteado(a)', 'Sobrinho(a)', 'Pai/Mãe', 'Sogro(a)',
  'Neto(a)/Bisneto(a)', 'Irmão/Irmã', 'Cunhado(a)',
  'Outro parente', 'Não parente',
]

export function emptyMembro() {
  return { nome: '', parentesco: '', sexo: '', data_nascimento: '', pessoa_com_deficiencia: false, documentacao: [] }
}

export const DOCUMENTACAO_OPCOES = ['CN', 'RG', 'CTPS', 'CPF', 'TE']

export const LOCALIZACAO_DOMICILIO_OPCOES = ['Urbano', 'Rural', 'Abrigo']

export const TIPO_UNIDADE_OPCOES = ['CRAS', 'CREAS']

export const FORMA_INGRESSO_OPCOES = [
  'Demanda espontânea',
  'Busca ativa',
  'Encaminhamento PSB',
  'Encaminhamento PSE',
  'Encaminhamento Saúde',
  'Encaminhamento Educação',
  'Conselho Tutelar',
  'Judiciário',
  'SGD',
  'Outros',
]

export const TIPO_RESIDENCIA_OPCOES = ['Própria', 'Alugada', 'Cedida', 'Ocupada']

export const MATERIAL_PAREDES_OPCOES = ['Alvenaria', 'Precária']

export const ENERGIA_OPCOES = ['Medidor próprio', 'Medidor compartilhado', 'Sem medidor', 'Não possui']

export const ABASTECIMENTO_AGUA_OPCOES = ['Rede geral', 'Poço', 'Cisterna', 'Carro pipa', 'Outra']

export const ESCOAMENTO_OPCOES = ['Rede esgoto', 'Fossa séptica', 'Fossa rudimentar', 'Vala', 'Sem banheiro']

export const COLETA_LIXO_OPCOES = ['Direta', 'Indireta', 'Não possui']

export const SIM_NAO_OPCOES = ['Sim', 'Não']

export const PROGRAMAS_SOCIAIS_LISTA = [
  { key: 'bolsa_familia', label: 'Bolsa Família' },
  { key: 'bpc', label: 'BPC' },
  { key: 'peti', label: 'PETI' },
  { key: 'outros', label: 'Outros' },
]

export const ESCOLARIDADE_OPCOES = [
  'Educação Infantil/creche',
  '1º ano E. Fundamental',
  '2º ano E. Fundamental',
  '3º ano E. Fundamental',
  '4º ano E. Fundamental',
  '5º ano E. Fundamental',
  '6º ano E. Fundamental',
  '7º ano E. Fundamental',
  '8º ano E. Fundamental',
  '9º ano E. Fundamental',
  '1º ano E. Médio',
  '2º ano E. Médio',
  '3º ano E. Médio',
  'EJA',
  'Nunca frequentou escola',
  'Ensino Superior',
]

export const CONDICAO_OCUPACAO_OPCOES = [
  'Não trabalha',
  'Desempregado',
  'Conta própria/autônomo/bico',
  'Empregado com Carteira',
  'Empregado sem Carteira',
  'Empregador',
  'Estagiário/Aprendiz',
]

export const TIPO_DEFICIENCIA_OPCOES = [
  'Deficiência visual',
  'Deficiência auditiva',
  'Deficiência física',
  'Deficiência mental/intelectual',
  'Síndrome de Down',
  'Transtorno/doença mental',
  'Deficiências múltiplas',
]

export const TIPO_BENEFICIO_OPCOES = ['Auxílio Natalidade', 'Auxílio Funeral']

export const AVALIACAO_RELACAO_OPCOES = ['Conflituoso com violência', 'Conflituoso sem violência', 'Sem conflitos relevantes']
