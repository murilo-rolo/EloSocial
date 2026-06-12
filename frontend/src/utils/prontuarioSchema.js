// Estrutura vazia do Prontuário SUAS
export function emptyProntuario() {
  return {
    identificacao: {
      logradouro: '', numero: '', complemento: '', bairro: '',
      municipio: '', uf: '', cep: '',
    },
    composicao_familiar: [],
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
