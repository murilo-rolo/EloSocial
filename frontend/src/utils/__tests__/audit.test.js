import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockInsert, mockFrom } = vi.hoisted(() => {
  const mockInsert = vi.fn()
  const mockFrom = vi.fn(() => ({ insert: mockInsert }))
  return { mockInsert, mockFrom }
})

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

import { auditLog } from '../audit'

describe('auditLog', () => {
  beforeEach(() => {
    mockFrom.mockClear()
    mockInsert.mockReset()
    mockInsert.mockResolvedValue({})
  })

  it('chama supabase.from("audit_logs").insert com user_id, acao e detalhes', async () => {
    await auditLog('user-123', 'criou_usuario', { email: 'teste@teste.com' })

    expect(mockFrom).toHaveBeenCalledWith('audit_logs')
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      acao: 'criou_usuario',
      detalhes: { email: 'teste@teste.com' },
    })
  })

  it('usa objeto vazio como detalhes quando nao fornecido', async () => {
    await auditLog('user-456', 'excluiu_usuario')

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-456',
      acao: 'excluiu_usuario',
      detalhes: {},
    })
  })

  it('nao lanca excecao quando supabase falha (fire-and-forget)', async () => {
    mockInsert.mockRejectedValueOnce(new Error('Rede error'))

    await expect(auditLog('user-1', 'teste')).resolves.toBeUndefined()
  })
})
