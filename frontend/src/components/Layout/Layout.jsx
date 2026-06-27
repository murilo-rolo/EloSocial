import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import GlobalChat from '../GlobalChat'

export default function Layout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-content">
        <Topbar
          title={title}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="page-content">
          {children}
        </main>
      </div>
      <GlobalChat />
    </div>
  )
}
