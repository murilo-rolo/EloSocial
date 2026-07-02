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
import BaseConhecimento from './pages/BaseConhecimento'
import ThemeToggle from './components/ThemeToggle'

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
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
        <Route path="/requerentes" element={<ProtectedRoute><Requerentes /></ProtectedRoute>} />
        <Route path="/requerentes/:id" element={<ProtectedRoute><RequerenteDetail /></ProtectedRoute>} />
        <Route path="/prontuarios/novo/:applicantId" element={<ProtectedRoute><ProntuarioEdit /></ProtectedRoute>} />
    <Route path="/prontuarios/:id" element={<ProtectedRoute><ProntuarioView /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/videoconferencia" element={<ProtectedRoute><Videoconferencia /></ProtectedRoute>} />
        <Route path="/conhecimento" element={<ProtectedRoute><BaseConhecimento /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['gerente']}><Admin /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ThemeToggle />
    </>
  )
}
