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
      abastecimento_agua: '', energia_eletrica: '', saneamento: '',
      material_edificacao: '', comodos: '',
    },
    educacional: {
      escolaridade: '', situacao_educacional: '',
    },
    trabalho_renda: {
      ocupacao: '', renda_familiar: '', beneficios: '',
    },
    saude: {
      condicoes_saude: '', doencas: '', deficiencias: '',
      acompanhamento_medico: '',
    },
    beneficios: {
      beneficios_eventuais: '',
    },
    convivencia: {
      convivencia_familiar: '',
    },
    participacao: {
      participacao_programas: '',
    },
    violencia: {
      situacoes_violencia: '',
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

export const PROGRAMAS_SOCIAIS_LISTA = [
  { key: 'bolsa_familia', label: 'Bolsa Família' },
  { key: 'bpc', label: 'BPC' },
  { key: 'peti', label: 'PETI' },
  { key: 'outros', label: 'Outros' },
]
