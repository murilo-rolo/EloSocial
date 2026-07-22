import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { canManageUsers, isRequerente } from '../../utils/roles'
import { LayoutDashboard, Users, MessageSquare, Video, Settings, BookOpen, FolderOpen, HelpCircle } from 'lucide-react'

export default function Sidebar({ open, onClose }) {
  const { profile } = useAuth()

  const links = isRequerente(profile?.role)
    ? [
        { to: '/acompanhamento', label: 'Acompanhamento', icon: <LayoutDashboard size={20} />, end: true },
        { to: '/chat-atendimento', label: 'Mensagens', icon: <MessageSquare size={20} /> },
        { to: '/video-atendimento', label: 'Video', icon: <Video size={20} /> },
        { to: '/documentos', label: 'Documentos', icon: <FolderOpen size={20} /> },
        { to: '/ajuda', label: 'Ajuda', icon: <HelpCircle size={20} /> },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true },
        { to: '/requerentes', label: 'Usuários', icon: <Users size={20} /> },
        { to: '/conhecimento', label: 'Conhecimento IA', icon: <BookOpen size={20} /> },
        { to: '/chat', label: 'Mensagens', icon: <MessageSquare size={20} /> },
        { to: '/videoconferencia', label: 'Video', icon: <Video size={20} /> },
        { to: '/ajuda', label: 'Ajuda', icon: <HelpCircle size={20} /> },
      ]

  if (!isRequerente(profile?.role) && canManageUsers(profile?.role)) {
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
      </aside>
    </>
  )
}
