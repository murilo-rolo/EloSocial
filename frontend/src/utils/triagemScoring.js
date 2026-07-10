const PONTUACAO_DEMANDA = {
  'Violencia ou ameaca': 50,
  'Alimentacao': 40,
  'Moradia ou risco de despejo': 35,
  'Crianca, adolescente, idoso ou PCD em risco': 35,
  'Saude e medicacao': 25,
  'Beneficios sociais': 20,
  'Documentacao': 10,
  'Orientacao social': 5,
  'Outra necessidade': 10,
}

const PONTUACAO_SITUACAO = {
  'Risco de violencia': 50,
  'Falta de alimento': 40,
  'Crianca ou adolescente em risco': 35,
  'Idoso ou PCD em risco': 35,
  'Sem moradia ou risco de despejo': 35,
  'Pessoa doente sem acompanhamento': 25,
  'Familia sem renda': 20,
  'Beneficio bloqueado ou pendente': 10,
  'Documentacao pendente': 5,
  'Outra situacao': 10,
}

const PONTUACAO_URGENCIA = {
  alta: 30,
  media: 15,
  baixa: 0,
}

export function calcularPontuacao(dados) {
  let total = 0

  const demanda = dados?.motivo?.demanda_principal
  if (demanda && PONTUACAO_DEMANDA[demanda] !== undefined) {
    total += PONTUACAO_DEMANDA[demanda]
  }

  const situacoes = dados?.urgencia?.situacoes || []
  situacoes.forEach(s => {
    if (PONTUACAO_SITUACAO[s] !== undefined) {
      total += PONTUACAO_SITUACAO[s]
    }
  })

  const urgencia = dados?.urgencia?.nivel
  if (urgencia && PONTUACAO_URGENCIA[urgencia] !== undefined) {
    total += PONTUACAO_URGENCIA[urgencia]
  }

  return total
}

export function calcularPrioridade(dados) {
  const total = calcularPontuacao(dados)

  if (total >= 70) return { total, prioridade: 'ALTA' }
  if (total >= 30) return { total, prioridade: 'MEDIA' }
  return { total, prioridade: 'BAIXA' }
}

export function gerarSintomas(dados) {
  const sintomas = []

  const demanda = dados?.motivo?.demanda_principal
  if (demanda) sintomas.push(demanda)

  const situacoes = dados?.urgencia?.situacoes || []
  situacoes.forEach(s => {
    if (!sintomas.includes(s)) sintomas.push(s)
  })

  return sintomas
}

export function gerarDetalhes(dados) {
  const partes = []

  if (dados?.contato?.telefone) partes.push(`Telefone: ${dados.contato.telefone}`)
  if (dados?.contato?.idade) partes.push(`Idade: ${dados.contato.idade}`)
  if (dados?.contato?.bairro_localidade) partes.push(`Bairro: ${dados.contato.bairro_localidade}`)
  if (dados?.contato?.territorio_cras) partes.push(`CRAS: ${dados.contato.territorio_cras}`)

  if (dados?.familia?.composicao_familiar) partes.push(`Composicao: ${dados.familia.composicao_familiar}`)
  if (dados?.familia?.renda_familiar) partes.push(`Renda: ${dados.familia.renda_familiar}`)
  if (dados?.familia?.beneficios_sociais?.length) partes.push(`Beneficios: ${dados.familia.beneficios_sociais.join(', ')}`)

  if (dados?.motivo?.demanda_principal) partes.push(`Demanda: ${dados.motivo.demanda_principal}`)
  if (dados?.motivo?.outra_demanda) partes.push(`Outra demanda: ${dados.motivo.outra_demanda}`)

  if (dados?.urgencia?.nivel) partes.push(`Urgencia: ${dados.urgencia.nivel}`)
  if (dados?.urgencia?.situacoes?.length) partes.push(`Situacoes: ${dados.urgencia.situacoes.join(', ')}`)

  if (dados?.relato) partes.push(`Relato: ${dados.relato}`)

  return partes.join('\n')
}
