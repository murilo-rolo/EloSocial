import { HeartHandshake, Home, AlertTriangle, ClipboardList, CreditCard, Users, Shield, FileText, CheckCircle } from 'lucide-react'

export const COMPOSICAO_FAMILIAR = [
  'Mora sozinho(a)',
  'Casal sem filhos',
  'Casal com filhos',
  'Mae/Pai solo com filhos',
  'Familia estendida (com avos, tios, etc)',
  'Abrigo ou Instituicao',
  'Situacao de rua',
  'Outro',
]

export const RENDA_FAMILIAR = [
  'Sem renda',
  'Ate 1 salario minimo',
  'De 1 a 2 salarios minimos',
  'Acima de 2 salarios minimos',
  'Nao sabe informar',
  'Prefere nao informar',
]

export const BENEFICIOS_SOCIAIS = [
  { value: 'Bolsa Familia', label: 'Bolsa Familia' },
  { value: 'BPC', label: 'BPC' },
  { value: 'Auxilio eventual', label: 'Auxilio eventual' },
  { value: 'Beneficio bloqueado', label: 'Beneficio bloqueado' },
  { value: 'Nenhum', label: 'Nenhum', exclusive: true },
  { value: 'Nao sei informar', label: 'Nao sei informar', exclusive: true },
  { value: 'Outro', label: 'Outro', showOther: true },
]

export const DEMANDAS_PRINCIPAIS = [
  { id: 'Alimentacao', label: 'Alimentacao', icon: HeartHandshake },
  { id: 'Moradia ou risco de despejo', label: 'Moradia', icon: Home },
  { id: 'Violencia ou ameaca', label: 'Violencia ou ameaca', icon: AlertTriangle },
  { id: 'Beneficios sociais', label: 'Beneficios sociais', icon: ClipboardList },
  { id: 'Documentacao', label: 'Documentacao', icon: CreditCard },
  { id: 'Crianca, adolescente, idoso ou PCD em risco', label: 'Pessoa vulneravel', icon: Users },
  { id: 'Saude e medicacao', label: 'Saude e medicacao', icon: Shield },
  { id: 'Orientacao social', label: 'Orientacao social', icon: FileText },
  { id: 'Outra necessidade', label: 'Outra necessidade', icon: CheckCircle },
]

export const NIVEIS_URGENCIA = [
  { value: 'baixa', label: 'Posso aguardar' },
  { value: 'media', label: 'Retorno breve' },
  { value: 'alta', label: 'Atencao imediata' },
]

export const SITUACOES_VULNERABILIDADE = [
  'Risco de violencia',
  'Falta de alimento',
  'Sem moradia ou risco de despejo',
  'Crianca ou adolescente em risco',
  'Idoso ou PCD em risco',
  'Pessoa doente sem acompanhamento',
  'Familia sem renda',
  'Beneficio bloqueado ou pendente',
  'Documentacao pendente',
]

export const ETAPAS = [
  { id: 1, nome: 'Contato' },
  { id: 2, nome: 'Familia' },
  { id: 3, nome: 'Motivo' },
  { id: 4, nome: 'Urgencia' },
  { id: 5, nome: 'Relato' },
]
