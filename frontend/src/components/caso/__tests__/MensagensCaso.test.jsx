import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MensagensCaso from '../MensagensCaso'

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'prof-1', nome: 'Ana Assistente', role: 'assistente_social' },
  })),
}))

vi.mock('../../../hooks/useRealtime', () => ({
  useRealtime: vi.fn(),
}))

const mockOr = vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: [], error: null })) }))
const mockEq = vi.fn(() => ({ or: mockOr }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}))

describe('MensagensCaso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no messages', async () => {
    render(<MensagensCaso casoId="caso-1" modo="assistente" applicantUserId="user-req-1" />)

    await waitFor(() => {
      expect(screen.getByText('Nenhuma mensagem ainda. Envie uma mensagem!')).toBeInTheDocument()
    })
  })

  it('calls or() filter with profile id on load', async () => {
    render(<MensagensCaso casoId="caso-1" modo="assistente" applicantUserId="user-req-1" />)

    await waitFor(() => {
      expect(mockOr).toHaveBeenCalledWith('remetente_id.eq.prof-1,destinatario_id.eq.prof-1')
    })
  })

  it('renders input area', async () => {
    render(<MensagensCaso casoId="caso-1" modo="assistente" applicantUserId="user-req-1" />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
    })
  })
})
