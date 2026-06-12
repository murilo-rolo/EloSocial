export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR')
}

export function formatCPF(cpf) {
  if (!cpf) return ''
  const n = cpf.replace(/\D/g, '')
  if (n.length !== 11) return cpf
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatPhone(phone) {
  if (!phone) return ''
  const n = phone.replace(/\D/g, '')
  if (n.length === 11) {
    return n.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (n.length === 10) {
    return n.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('pt-BR')
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`
  return formatDate(dateStr)
}
