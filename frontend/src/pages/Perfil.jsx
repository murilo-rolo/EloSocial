import { useAuth } from '../hooks/useAuth'
import { ROLE_LABELS } from '../utils/roles'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Shield, MapPin } from 'lucide-react'

export default function Perfil() {
  const { profile } = useAuth()

  return (
    <div className="page-content">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-light)',
        textDecoration: 'none', fontSize: 14, marginBottom: 24 }}>
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div className="card" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: 24
          }}>
            {profile?.nome?.charAt(0)}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text)' }}>{profile?.nome}</h2>
            <span style={{ fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {profile?.role ? ROLE_LABELS[profile.role] : ''}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text)' }}>
            <Mail size={18} style={{ color: 'var(--text-light)' }} />
            {profile?.email}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text)' }}>
            <Shield size={18} style={{ color: 'var(--text-light)' }} />
            {profile?.role ? ROLE_LABELS[profile.role] : '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text)' }}>
            <MapPin size={18} style={{ color: 'var(--text-light)' }} />
            {profile?.cras || '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
