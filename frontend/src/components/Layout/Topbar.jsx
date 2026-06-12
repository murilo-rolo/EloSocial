import { useAuth } from '../../hooks/useAuth'

export default function Topbar({ title, onMenuToggle }) {
  const { profile } = useAuth()

  return (
    <header className="topbar">
      <button className="menu-toggle" onClick={onMenuToggle}>
        ☰
      </button>
      <div className="topbar-title">{title}</div>
      <div className="topbar-actions">
        <div className="topbar-profile">
          <span>{profile?.nome?.split(' ')[0]}</span>
        </div>
      </div>
    </header>
  )
}
