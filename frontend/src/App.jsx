import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Requerentes from './pages/Requerentes'
import RequerenteDetail from './pages/RequerenteDetail'
import ProntuarioEdit from './pages/ProntuarioEdit'
import ProntuarioView from './pages/ProntuarioView'
import Prontuarios from './pages/Prontuarios'
import Chat from './pages/Chat'
import Admin from './pages/Admin'

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
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/requerentes" element={<ProtectedRoute><Requerentes /></ProtectedRoute>} />
      <Route path="/requerentes/:id" element={<ProtectedRoute><RequerenteDetail /></ProtectedRoute>} />
      <Route path="/prontuarios/novo/:applicantId" element={<ProtectedRoute><ProntuarioEdit /></ProtectedRoute>} />
      <Route path="/prontuarios" element={<ProtectedRoute><Prontuarios /></ProtectedRoute>} />
  <Route path="/prontuarios/:id" element={<ProtectedRoute><ProntuarioView /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['gerente']}><Admin /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
