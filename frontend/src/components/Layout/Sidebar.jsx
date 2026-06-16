import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_LABELS, canManageUsers } from '../../utils/roles'

export default function Sidebar({ open, onClose }) {
  const { profile } = useAuth()
  const location = useLocation()

  const links = [
    { to: '/', label: 'Dashboard', icon: '📊', end: true },
    { to: '/requerentes', label: 'Requerentes', icon: '👥' },
    { to: '/prontuarios', label: 'Prontuários', icon: '📋' },
    { to: '/chat', label: 'Chat', icon: '💬' },
    { to: '/videoconferencia', label: 'Videoconferência', icon: '📹' },
  ]

  if (canManageUsers(profile?.role)) {
    links.push({ to: '/admin', label: 'Admin', icon: '⚙️' })
  }

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>EloSocial</h2>
          <span>Prontuário SUAS</span>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={onClose}
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-name">{profile?.nome || 'Usuário'}</div>
          <div className="user-role">
            {profile?.role ? ROLE_LABELS[profile.role] : ''}
          </div>
        </div>
      </aside>
    </>
  )
}
