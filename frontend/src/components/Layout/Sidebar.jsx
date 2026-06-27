import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_LABELS, canManageUsers } from '../../utils/roles'
import { LayoutDashboard, Calendar, Users, FileText, MessageSquare, Video, Settings, BookOpen } from 'lucide-react'

export default function Sidebar({ open, onClose }) {
  const { profile } = useAuth()

  const links = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true },
    { to: '/agenda', label: 'Agenda', icon: <Calendar size={20} /> },
    { to: '/requerentes', label: 'Requerentes', icon: <Users size={20} /> },
    { to: '/conhecimento', label: 'Conhecimento IA', icon: <BookOpen size={20} /> },
    { to: '/chat', label: 'Mensagens', icon: <MessageSquare size={20} /> },
    { to: '/videoconferencia', label: 'Video', icon: <Video size={20} /> },
  ]

  if (canManageUsers(profile?.role)) {
    links.push({ to: '/admin', label: 'Admin', icon: <Settings size={20} /> })
  }

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="font-serif">EloSocial</h2>
          <span style={{ letterSpacing: 1 }}>PRONTUÁRIO SUAS</span>
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
              <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {link.icon}
              </span>
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
