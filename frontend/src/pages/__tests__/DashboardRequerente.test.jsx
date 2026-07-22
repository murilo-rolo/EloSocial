/**
 * Testes do DashboardRequerente
 * Verifica remoção dos quickLinks conforme spec RIR-09
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user-1', role: 'requerente' },
  })),
}))

// Mock supabase — retorna caso mockado
const mockCaso = {
  id: 'caso-1',
  user_id: 'user-1',
  status: 'em_atendimento',
  prioridade: 'ALTA',
  dados_acolhimento: {
    motivo: { demanda_principal: 'Necessidade de assistencia' },
    urgencia: { nivel: 'Alta' },
    contato: { telefone: '(91) 99999-0000', bairro_localidade: 'Jurunas' },
  },
  sintomas: ['Ansiedade', 'Depressao'],
}

const mockMaybeSingle = vi.fn(() => Promise.resolve({ data: mockCaso, error: null }))
const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockOrder = vi.fn(() => ({ limit: mockLimit }))
const mockEq = vi.fn(() => ({ order: mockOrder }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}))

// Mock PlanoAcaoCaso — renderiza texto identificável
vi.mock('../../components/caso/PlanoAcaoCaso', () => ({
  default: ({ casoId, modo }) => (
    <div data-testid="plano-acao-caso">PlanoAcaoCaso casoId={casoId} modo={modo}</div>
  ),
}))

// Mock useRealtime — noop
vi.mock('../../hooks/useRealtime', () => ({
  useRealtime: vi.fn(() => {}),
}))

// Mock Layout — renderiza children diretamente
vi.mock('../../components/Layout/Layout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}))

import DashboardRequerente from '../DashboardRequerente'

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardRequerente />
    </MemoryRouter>
  )
}

// ─── RIR-09: quickLinks removidos ────────────────────────────────────────────
describe('RIR-09: DashboardRequerente — quickLinks removidos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('NÃO exibe botão/card "Video Atendimento" (após carregamento)', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Em Atendimento')).toBeInTheDocument()
    })
    expect(screen.queryByText('Video Atendimento')).not.toBeInTheDocument()
  })

  it('NÃO exibe botão/card "Mensagens" (após carregamento)', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Em Atendimento')).toBeInTheDocument()
    })
    expect(screen.queryByText('Mensagens')).not.toBeInTheDocument()
  })

  it('NÃO exibe botão/card "Plano de Acao" (após carregamento)', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Em Atendimento')).toBeInTheDocument()
    })
    expect(screen.queryByText('Plano de Acao')).not.toBeInTheDocument()
  })

  it('NÃO exibe botão/card "Cofre Digital" (após carregamento)', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Em Atendimento')).toBeInTheDocument()
    })
    expect(screen.queryByText('Cofre Digital')).not.toBeInTheDocument()
  })

  it('ainda exibe status do caso', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Em Atendimento')).toBeInTheDocument()
    })
  })

  it('renderiza PlanoAcaoCaso como seção com modo requerente', async () => {
    renderDashboard()
    await waitFor(() => {
      const plano = screen.getByTestId('plano-acao-caso')
      expect(plano).toBeInTheDocument()
      expect(plano).toHaveTextContent('PlanoAcaoCaso')
      expect(plano).toHaveTextContent('casoId=caso-1')
      expect(plano).toHaveTextContent('modo=requerente')
    })
  })
})

// ─── RIR-10: PlanoAcaoCaso como seção — sem caso ────────────────────────────
describe('RIR-10: PlanoAcaoCaso — sem caso', () => {
  it('NÃO renderiza PlanoAcaoCaso quando não há caso', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Nenhum caso em andamento.')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('plano-acao-caso')).not.toBeInTheDocument()
  })
})

// ─── RIR-12: botões de triagem apontam para /acompanhamento/triagem ──────────
describe('RIR-12: botões de triagem — URLs atualizadas', () => {
  it('botão "Editar Triagem" existe quando caso está pendente', async () => {
    const casoPendente = { ...mockCaso, status: 'pendente' }
    mockMaybeSingle.mockResolvedValueOnce({ data: casoPendente, error: null })

    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Editar Triagem')).toBeInTheDocument()
    })
  })

  it('botão "Iniciar Triagem" existe quando não há caso', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Iniciar Triagem')).toBeInTheDocument()
    })
  })
})
