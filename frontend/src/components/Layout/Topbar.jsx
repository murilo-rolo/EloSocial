import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ROLE_LABELS } from '../../utils/roles'
import { Bell, Menu, Calendar, AlertTriangle, Settings } from 'lucide-react'

export default function Topbar({ title, onMenuToggle }) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const profileDropdownRef = useRef(null)

  useEffect(() => {
    if (!profile) return

    const loadNotifications = async () => {
      const { data } = await supabase
        .from('agendamentos')
        .select('*, applicants(nome)')
        .eq('profissional_id', profile.id)
        .eq('status', 'Pendente')

      if (data) {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        
        const alerts = data.map(ag => {
          const agDate = new Date(ag.data_hora)
          const isLate = agDate < now
          const isToday = agDate.toDateString() === now.toDateString()
          
          if (isLate) return { id: ag.id, type: 'danger', msg: `Agendamento atrasado: ${ag.applicants?.nome}` }
          if (isToday) return { id: ag.id, type: 'warning', msg: `Hoje: ${ag.applicants?.nome}` }
          return null
        }).filter(Boolean)

        setNotifications(alerts)
      }
    }

    loadNotifications()
    
    // Check every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [profile])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setShowProfileDropdown(false)
    localStorage.removeItem('rememberMe')
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="topbar">
      <button className="menu-toggle" onClick={onMenuToggle}>
        <Menu size={24} />
      </button>
      <div className="topbar-title font-serif" style={{ fontSize: 18 }}>{title}</div>
      <div className="topbar-actions">
        
        <div className="notifications-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
          <button 
            className="btn btn-outline" 
            style={{ padding: '6px', borderRadius: '50%', position: 'relative', border: 'none', background: 'transparent' }}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: 'var(--danger)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {notifications.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '40px',
              right: 0,
              width: '280px',
              background: 'var(--card)',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '13px' }}>
                Notificações
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-light)', fontSize: '13px' }}>
                    Nenhuma notificação no momento.
                  </div>
                ) : (
                  notifications.map(n => (
                    <Link to="/agenda" key={n.id} style={{
                      display: 'block',
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '13px',
                      color: 'var(--text)',
                      background: n.type === 'danger' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                      textDecoration: 'none'
                    }} onClick={() => setShowDropdown(false)}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span>{n.type === 'danger' ? <AlertTriangle size={16} color="#ef4444" /> : <Calendar size={16} color="#f59e0b" />}</span>
                        <span>{n.msg}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="topbar-profile" ref={profileDropdownRef} style={{ position: 'relative', marginLeft: 8 }}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 8, padding: 4, borderRadius: 8, color: 'inherit'
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', 
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: 14
            }}>
              {profile?.nome?.charAt(0)}
            </div>
            <span style={{ fontWeight: 500 }}>{profile?.nome?.split(' ')[0]}</span>
          </button>

          {showProfileDropdown && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              width: 220, background: 'var(--card)',
              boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', zIndex: 1000, overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{profile?.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{profile?.email}</div>
                {profile?.role && (
                  <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {ROLE_LABELS[profile.role]}
                  </div>
                )}
              </div>
              <Link to="/perfil" onClick={() => setShowProfileDropdown(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                  color: 'var(--text)', textDecoration: 'none', fontSize: 13,
                  transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <Settings size={16} /> Configurações
              </Link>
              <button onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                  width: '100%', color: 'var(--danger)', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 13, textAlign: 'left',
                  borderTop: '1px solid var(--border)', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
