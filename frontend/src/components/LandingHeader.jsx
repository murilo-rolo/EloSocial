import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ChevronDown, Heart, Shield, Brain, Video, FolderLock, Calendar } from 'lucide-react'

const menuItems = [
  {
    label: 'Funcionalidades',
    children: [
      { label: 'Prontuário Eletrônico', icon: Heart, desc: 'Gestão completa de prontuários digitais' },
      { label: 'Triagem Social', icon: Shield, desc: 'Classificação inteligente de demandas' },
      { label: 'Chat com IA', icon: Brain, desc: 'Assistente virtual para profissionais' },
      { label: 'Videoconferência', icon: Video, desc: 'Atendimentos remotos integrados' },
      { label: 'Cofre Digital', icon: FolderLock, desc: 'Armazenamento seguro de documentos' },
      { label: 'Agenda', icon: Calendar, desc: 'Gerenciamento de agendamentos' },
    ],
  },
  {
    label: 'Quem Somos',
    href: '#quem-somos',
  },
  {
    label: 'Contato',
    href: '#contato',
  },
]

export default function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)

  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <Link to="/" className="landing-logo">
          <Heart size={24} style={{ color: 'var(--accent)' }} />
          <span>EloSocial</span>
        </Link>

        <nav className="landing-nav-desktop">
          {menuItems.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="landing-nav-item"
                onMouseEnter={() => setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="landing-nav-btn">
                  {item.label}
                  <ChevronDown size={14} style={{
                    transform: activeDropdown === item.label ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                  }} />
                </button>
                {activeDropdown === item.label && (
                  <div className="landing-dropdown">
                    {item.children.map((child) => (
                      <div key={child.label} className="landing-dropdown-item">
                        <child.icon size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <div>
                          <div className="landing-dropdown-label">{child.label}</div>
                          <div className="landing-dropdown-desc">{child.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a key={item.label} href={item.href} className="landing-nav-link">
                {item.label}
              </a>
            )
          )}
        </nav>

        <Link to="/login" className="landing-btn-login">
          Acessar Sistema
        </Link>

        <button
          className="landing-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="landing-mobile-menu">
          {menuItems.map((item) =>
            item.children ? (
              <div key={item.label}>
                <button
                  className="landing-mobile-section"
                  onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                >
                  {item.label}
                  <ChevronDown size={16} style={{
                    transform: activeDropdown === item.label ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                  }} />
                </button>
                {activeDropdown === item.label && (
                  <div className="landing-mobile-sub">
                    {item.children.map((child) => (
                      <div key={child.label} className="landing-mobile-sub-item">
                        <child.icon size={16} style={{ color: 'var(--accent)' }} />
                        <span>{child.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a key={item.label} href={item.href} className="landing-mobile-link" onClick={() => setMobileOpen(false)}>
                {item.label}
              </a>
            )
          )}
          <Link to="/login" className="landing-btn-login" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
            Acessar Sistema
          </Link>
        </div>
      )}
    </header>
  )
}
