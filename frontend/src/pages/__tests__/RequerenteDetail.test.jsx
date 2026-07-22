import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user-1', role: 'assistente' },
  })),
}))

const mockApplicant = {
  id: 'applicant-1',
  nome: 'Maria da Silva',
  cpf: '000.000.000-00',
  data_nascimento: '1990-01-01',
  sexo: 'F',
  telefone: '(91) 99999-0000',
  vulnerabilidade_motivo: 'Alto risco social identificado',
  vulnerabilidade_cor: 'vermelho',
  vulnerabilidade_score: 'Alto Risco',
}

const mockCaso = {
  id: 'caso-1',
  applicant_id: 'applicant-1',
  status: 'em_atendimento',
  prioridade: 'ALTA',
}

const mockApplicantSingle = vi.fn(() => Promise.resolve({ data: mockApplicant, error: null }))
const mockProntuariosOrder = vi.fn(() => Promise.resolve({ data: [], error: null }))

let casoData = mockCaso
const mockMaybeSingle = vi.fn(() => Promise.resolve({ data: casoData, error: null }))
const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockTriagemOrder = vi.fn(() => ({ limit: mockLimit }))
const mockTriagemEq = vi.fn(() => ({ order: mockTriagemOrder }))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'applicants') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockApplicantSingle })),
          })),
        }
      }
      if (table === 'prontuarios') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => mockProntuariosOrder()),
            })),
          })),
        }
      }
      if (table === 'triagens') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => mockTriagemOrder()),
            })),
          })),
        }
      }
      return { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn() }
    }),
  },
}))

vi.mock('../../hooks/useRealtime', () => ({
  useRealtime: vi.fn(() => {}),
}))

vi.mock('../../components/Layout/Layout', () => ({
  default: ({ children, title }) => <div data-testid="layout" data-title={title}>{children}</div>,
}))

vi.mock('../../components/SlideOver', () => ({
  default: ({ isOpen, onClose, title, children }) => isOpen ? <div data-testid="slideover">{children}</div> : null,
}))

vi.mock('./ProntuarioView', () => ({
  default: () => <div data-testid="prontuario-view" />,
}))

vi.mock('../../components/ChatLLM', () => ({
  default: () => null,
}))

vi.mock('../../components/caso/MensagensCaso', () => ({
  default: () => <div data-testid="mensagens-caso" />,
}))

vi.mock('../../components/caso/PlanoAcaoCaso', () => ({
  default: () => <div data-testid="plano-acao-caso" />,
}))

import RequerenteDetail from '../RequerenteDetail'

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/requerentes/applicant-1']}>
      <Routes>
        <Route path="/requerentes/:id" element={<RequerenteDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TS-01: Exibir status da triagem em RequerenteDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    casoData = mockCaso
  })

  it('exibe badge de status "Em Atendimento" quando caso existe', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Em Atendimento')).toBeInTheDocument()
    })
  })

  it('exibe badge de prioridade "ALTA" quando caso tem prioridade', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Prioridade ALTA')).toBeInTheDocument()
    })
  })

  it('não exibe badges de status quando caso é nulo', async () => {
    casoData = null
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Maria da Silva')).toBeInTheDocument()
    })
    expect(screen.queryByText('Em Atendimento')).not.toBeInTheDocument()
    expect(screen.queryByText('Prioridade ALTA')).not.toBeInTheDocument()
  })
})
