import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Requerentes from './pages/Requerentes'
import RequerenteDetail from './pages/RequerenteDetail'
import ProntuarioEdit from './pages/ProntuarioEdit'
import ProntuarioView from './pages/ProntuarioView'
import Chat from './pages/Chat'
import Videoconferencia from './pages/Videoconferencia'
import Admin from './pages/Admin'
import Cadastro from './pages/Cadastro'
import CadastroRequerente from './pages/CadastroRequerente'
import DashboardRequerente from './pages/DashboardRequerente'
import TriagemSocial from './pages/TriagemSocial'
import ChatCaso from './pages/ChatCaso'
import CofreDigital from './pages/CofreDigital'
import VideoRequerente from './pages/VideoRequerente'
import BaseConhecimento from './pages/BaseConhecimento'
import ThemeToggle from './components/ThemeToggle'
import ChatIA from './pages/ChatIA'
import Perfil from './pages/Perfil'

function Placeholder({ title }) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h1 className="page-title font-serif">{title}</h1>
      <p className="page-subtitle">Em desenvolvimento</p>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Carregando...
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/cadastro" element={user ? <Navigate to="/" replace /> : <Cadastro />} />
        <Route path="/cadastro-requerente" element={user ? <Navigate to="/" replace /> : <CadastroRequerente />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
        <Route path="/requerentes" element={<ProtectedRoute><Requerentes /></ProtectedRoute>} />
        <Route path="/requerentes/:id" element={<ProtectedRoute><RequerenteDetail /></ProtectedRoute>} />
        <Route path="/prontuarios/novo/:applicantId" element={<ProtectedRoute><ProntuarioEdit /></ProtectedRoute>} />
        <Route path="/prontuarios/:id" element={<ProtectedRoute><ProntuarioView /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/videoconferencia" element={<ProtectedRoute><Videoconferencia /></ProtectedRoute>} />
        <Route path="/conhecimento" element={<ProtectedRoute><BaseConhecimento /></ProtectedRoute>} />
        <Route path="/chat-ia" element={<ProtectedRoute><ChatIA /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['gerente']}><Admin /></ProtectedRoute>} />

        {/* Rotas do Requerente */}
        <Route path="/acompanhamento" element={<ProtectedRoute roles={['requerente']}><DashboardRequerente /></ProtectedRoute>} />
        <Route path="/triagem" element={<ProtectedRoute roles={['requerente']}><TriagemSocial /></ProtectedRoute>} />
        <Route path="/chat-atendimento" element={<ProtectedRoute roles={['requerente']}><ChatCaso /></ProtectedRoute>} />
        <Route path="/video-atendimento" element={<ProtectedRoute roles={['requerente']}><VideoRequerente /></ProtectedRoute>} />
        <Route path="/plano-acao" element={<ProtectedRoute roles={['requerente']}><Placeholder title="Plano de Acao" /></ProtectedRoute>} />
        <Route path="/cofre-digital" element={<ProtectedRoute roles={['requerente']}><CofreDigital /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ThemeToggle />
    </>
  )
}
