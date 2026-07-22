import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Welcome from './pages/Welcome'
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
import PlanoAcao from './pages/PlanoAcao'
import BaseConhecimento from './pages/BaseConhecimento'
import ThemeToggle from './components/ThemeToggle'
import ChatIA from './pages/ChatIA'
import Perfil from './pages/Perfil'
import Ajuda from './pages/Ajuda'

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
        {/* Rota pública — Landing Page */}
        <Route path="/" element={user ? <Navigate to="/sistema" replace /> : <Landing />} />

        {/* Auth routes */}
        <Route path="/login" element={user ? <Navigate to="/sistema" replace /> : <Login />} />
        <Route path="/cadastro" element={user ? <Navigate to="/sistema" replace /> : <Cadastro />} />
        <Route path="/cadastro-requerente" element={user ? <Navigate to="/sistema" replace /> : <CadastroRequerente />} />

        {/* Rota autenticada — Bem vindo */}
        <Route path="/sistema" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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
        <Route path="/ajuda" element={<ProtectedRoute><Ajuda /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['gerente']}><Admin /></ProtectedRoute>} />

        {/* Rotas do Requerente */}
        <Route path="/acompanhamento" element={<ProtectedRoute roles={['requerente']}><DashboardRequerente /></ProtectedRoute>} />
        <Route path="/triagem" element={<ProtectedRoute roles={['requerente']}><TriagemSocial /></ProtectedRoute>} />
        <Route path="/chat-atendimento" element={<ProtectedRoute roles={['requerente']}><ChatCaso /></ProtectedRoute>} />
        <Route path="/video-atendimento" element={<ProtectedRoute roles={['requerente']}><VideoRequerente /></ProtectedRoute>} />
        <Route path="/plano-acao" element={<ProtectedRoute roles={['requerente']}><PlanoAcao /></ProtectedRoute>} />
        <Route path="/documentos" element={<ProtectedRoute roles={['requerente']}><CofreDigital /></ProtectedRoute>} />
        <Route path="/cofre-digital" element={<Navigate to="/documentos" replace />} />

        <Route path="*" element={<Navigate to="/sistema" replace />} />
      </Routes>
      <ThemeToggle />
    </>
  )
}
