import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import App from './App'
import './index.css'

// Se "Salvar Login" não foi marcado, limpa sessão ao abrir
const rememberMe = localStorage.getItem('rememberMe') === 'true'
if (!rememberMe) {
  localStorage.removeItem('supabase.auth.token')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
