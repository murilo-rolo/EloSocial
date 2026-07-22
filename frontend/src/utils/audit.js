import { supabase } from '../lib/supabase'

export async function auditLog(userId, acao, detalhes = {}) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      acao,
      detalhes,
    })
  } catch (err) {
    console.error('Erro ao registrar auditoria:', err)
  }
}
