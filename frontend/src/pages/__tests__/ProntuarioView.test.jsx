import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ProntuarioView from '../ProntuarioView'

const mockProntuarioData = {
  id: 'pront-1',
  dados_json: {
    identificacao: { logradouro: 'Rua A', numero: '100', localizacao_domicilio: 'Urbano' },
    composicao_familiar: [{ nome: 'João', parentesco: 'Filho' }],
  },
  applicants: {
    id: 'app-1',
    nome: 'Maria da Silva',
    cpf: '000.000.000-00',
    data_nascimento: '1990-01-01',
    telefone: '(91) 99999-0000',
  },
  profiles: { nome: 'Dr. Silva', role: 'assistente_social' },
  prontuario_anexos: [],
  hash_assinatura: null,
}

const mockSingle = vi.fn(() => Promise.resolve({ data: mockProntuarioData, error: null }))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: mockSingle })),
      })),
    })),
  },
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', role: 'assistente_social' },
  })),
}))

vi.mock('../../components/Layout/Layout', () => ({
  default: ({ children, title }) => (
    <div data-testid="layout" data-title={title}>{children}</div>
  ),
}))

let mockedAlert

function renderView() {
  return render(
    <MemoryRouter>
      <div id="app">
        <ProntuarioView id="pront-1" />
      </div>
    </MemoryRouter>
  )
}

describe('PDFTEST-05: exportPDF error handling', () => {
  let originalFetch
  let createObjectURL
  let revokeObjectURL

  beforeEach(() => {
    vi.clearAllMocks()
    mockedAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    originalFetch = globalThis.fetch
    createObjectURL = globalThis.URL.createObjectURL
    revokeObjectURL = globalThis.URL.revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:test')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    mockedAlert?.mockRestore()
    globalThis.fetch = originalFetch
    globalThis.URL.createObjectURL = createObjectURL
    globalThis.URL.revokeObjectURL = revokeObjectURL
  })

  async function waitReady() {
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument()
    })
  }

  it('exibe detail do servidor quando API retorna 500 com detail', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: 'ReportLab error' }),
      })
    )
    renderView()
    await waitReady()
    const btn = screen.getByRole('button', { name: /pdf/i })
    await userEvent.click(btn)
    await waitFor(() => {
      expect(mockedAlert).toHaveBeenCalledWith(expect.stringContaining('ReportLab error'))
    })
  })

  it('usa fallback genérico quando API retorna 500 sem detail', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      })
    )
    renderView()
    await waitReady()
    const btn = screen.getByRole('button', { name: /pdf/i })
    await userEvent.click(btn)
    await waitFor(() => {
      expect(mockedAlert).toHaveBeenCalledWith(expect.stringContaining('Erro ao gerar PDF'))
    })
  })

  it('inicia download quando API retorna 200 com blob', async () => {
    const fakeBlob = new Blob(['%PDF-fake'], { type: 'application/pdf' })
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(fakeBlob),
      })
    )
    const clickSpy = vi.fn()
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = origCreateElement(tag)
      if (tag === 'a') {
        el.click = clickSpy
      }
      return el
    })

    renderView()
    await waitReady()
    const btn = screen.getByRole('button', { name: /pdf/i })
    await userEvent.click(btn)
    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled()
    })
  })
})
