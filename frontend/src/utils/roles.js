export const ROLES = {
  ASSISTENTE_SOCIAL: 'assistente_social',
  PSICOLOGO: 'psicologo',
  PEDAGOGO: 'pedagogo',
  TECNICO: 'tecnico',
  GERENTE: 'gerente',
}

export const ROLE_LABELS = {
  [ROLES.ASSISTENTE_SOCIAL]: 'Assistente Social',
  [ROLES.PSICOLOGO]: 'Psicólogo',
  [ROLES.PEDAGOGO]: 'Pedagogo',
  [ROLES.TECNICO]: 'Técnico',
  [ROLES.GERENTE]: 'Gerente',
}

export function canManageUsers(role) {
  return role === ROLES.GERENTE
}

export function canViewAllReports(role) {
  return role === ROLES.GERENTE
}
