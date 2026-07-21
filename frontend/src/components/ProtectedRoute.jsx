import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, roles }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/sistema" replace />
  }

  return children
}
