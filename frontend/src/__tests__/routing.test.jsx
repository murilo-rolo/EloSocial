/**
 * Testes de roteamento do App.jsx
 * Verifica que rotas corretas renderizam os componentes corretos
 * e que redirects funcionam conforme spec RIR-05..08, RIR-11
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock useAuth — retorna requerente autenticado por padrão
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1' },
    profile: { role: 'requerente' },
    loading: false,
  })),
}))

// Mock de componentes de página — retornam texto identificável
vi.mock('../pages/CofreDigital', () => ({ default: () => <div>CofreDigital</div> }))
vi.mock('../pages/TriagemSocial', () => ({ default: () => <div>TriagemSocial</div> }))
vi.mock('../pages/DashboardRequerente', () => ({ default: () => <div>DashboardRequerente</div> }))
vi.mock('../pages/ChatCaso', () => ({ default: () => <div>ChatCaso</div> }))
vi.mock('../pages/VideoRequerente', () => ({ default: () => <div>VideoRequerente</div> }))
vi.mock('../pages/PlanoAcao', () => ({ default: () => <div>PlanoAcao</div> }))
vi.mock('../pages/Landing', () => ({ default: () => <div>Landing</div> }))
vi.mock('../pages/Login', () => ({ default: () => <div>Login</div> }))
vi.mock('../pages/Dashboard', () => ({ default: () => <div>Dashboard</div> }))
vi.mock('../pages/Welcome', () => ({ default: () => <div>Welcome</div> }))
vi.mock('../pages/Agenda', () => ({ default: () => <div>Agenda</div> }))
vi.mock('../pages/Requerentes', () => ({ default: () => <div>Requerentes</div> }))
vi.mock('../pages/RequerenteDetail', () => ({ default: () => <div>RequerenteDetail</div> }))
vi.mock('../pages/ProntuarioEdit', () => ({ default: () => <div>ProntuarioEdit</div> }))
vi.mock('../pages/ProntuarioView', () => ({ default: () => <div>ProntuarioView</div> }))
vi.mock('../pages/Chat', () => ({ default: () => <div>Chat</div> }))
vi.mock('../pages/Videoconferencia', () => ({ default: () => <div>Videoconferencia</div> }))
vi.mock('../pages/Admin', () => ({ default: () => <div>Admin</div> }))
vi.mock('../pages/Cadastro', () => ({ default: () => <div>Cadastro</div> }))
vi.mock('../pages/CadastroRequerente', () => ({ default: () => <div>CadastroRequerente</div> }))
vi.mock('../pages/BaseConhecimento', () => ({ default: () => <div>BaseConhecimento</div> }))
vi.mock('../pages/ChatIA', () => ({ default: () => <div>ChatIA</div> }))
vi.mock('../pages/Perfil', () => ({ default: () => <div>Perfil</div> }))
vi.mock('../pages/Ajuda', () => ({ default: () => <div>Ajuda</div> }))
vi.mock('../components/ThemeToggle', () => ({ default: () => null }))

import App from '../App'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  )
}

// ─── RIR-05: /documentos renderiza CofreDigital ──────────────────────────────
describe('RIR-05: rota /documentos', () => {
  it('renderiza CofreDigital quando requerente acessa /documentos', () => {
    renderAt('/documentos')
    expect(screen.getByText('CofreDigital')).toBeInTheDocument()
  })
})

// ─── RIR-06: /cofre-digital redireciona para /documentos ─────────────────────
describe('RIR-06: redirect /cofre-digital → /documentos', () => {
  it('redireciona /cofre-digital para /documentos e renderiza CofreDigital', () => {
    renderAt('/cofre-digital')
    expect(screen.getByText('CofreDigital')).toBeInTheDocument()
  })
})
