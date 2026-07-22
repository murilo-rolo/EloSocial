/**
 * Testes do Sidebar para perfil requerente
 * Verifica labels, rotas e ausência de itens conforme spec RIR-01..04
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../Sidebar'

// Mock useAuth
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { role: 'requerente' },
  })),
}))

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar open={true} onClose={() => {}} />
    </MemoryRouter>
  )
}

// ─── RIR-01: label "Acompanhamento" ──────────────────────────────────────────
describe('RIR-01: Sidebar requerente — label Acompanhamento', () => {
  it('exibe "Acompanhamento" como item de navegação', () => {
    renderSidebar()
    expect(screen.getByText('Acompanhamento')).toBeInTheDocument()
  })
})

// ─── RIR-02: label "Documentos" com rota /documentos ──────────────────────────
describe('RIR-02: Sidebar requerente — label Documentos', () => {
  it('exibe "Documentos" como item de navegação', () => {
    renderSidebar()
    expect(screen.getByText('Documentos')).toBeInTheDocument()
  })

  it('link de Documentos aponta para /documentos', () => {
    renderSidebar()
    const link = screen.getByText('Documentos').closest('a')
    expect(link).toHaveAttribute('href', '/documentos')
  })
})

// ─── RIR-03: "Triagem" ausente da sidebar ────────────────────────────────────
describe('RIR-03: Sidebar requerente — Triagem removido', () => {
  it('NÃO exibe "Triagem" como item de navegação', () => {
    renderSidebar()
    expect(screen.queryByText('Triagem')).not.toBeInTheDocument()
  })
})

// ─── RIR-04: "Plano de Acao" ausente da sidebar ──────────────────────────────
describe('RIR-04: Sidebar requerente — Plano de Acao removido', () => {
  it('NÃO exibe "Plano de Acao" como item de navegação', () => {
    renderSidebar()
    expect(screen.queryByText('Plano de Acao')).not.toBeInTheDocument()
  })
})
