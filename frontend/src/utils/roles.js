export const ROLES = {
  ASSISTENTE_SOCIAL: 'assistente_social',
  PSICOLOGO: 'psicologo',
  PEDAGOGO: 'pedagogo',
  TECNICO: 'tecnico',
  GERENTE: 'gerente',
  REQUERENTE: 'requerente',
}

export const ROLE_LABELS = {
  [ROLES.ASSISTENTE_SOCIAL]: 'Assistente Social',
  [ROLES.PSICOLOGO]: 'Psicólogo',
  [ROLES.PEDAGOGO]: 'Pedagogo',
  [ROLES.TECNICO]: 'Técnico',
  [ROLES.GERENTE]: 'Gerente',
  [ROLES.REQUERENTE]: 'Requerente',
}

export function canManageUsers(role) {
  return role === ROLES.GERENTE
}

export function canViewAllReports(role) {
  return role === ROLES.GERENTE
}

export function isRequerente(role) {
  return role === ROLES.REQUERENTE
}

export const CRAS_LIST = [
  'CRAS Aurá',
  'CRAS Barreiro',
  'CRAS Benguí',
  'CRAS Cremação',
  'CRAS Guamá',
  'CRAS Icoaraci',
  'CRAS Jurunas',
  'CRAS Mosqueiro',
  'CRAS Outeiro',
  'CRAS Pedreira',
  'CRAS Tapanã',
  'CRAS Terra Firme',
]
