import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [salvar, setSalvar] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    localStorage.setItem('rememberMe', salvar ? 'true' : 'false')
    try {
      const { data } = await login(email, password)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'requerente') {
        navigate('/acompanhamento', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>EloSocial</h1>
        <p>Prontuário Eletrônico SUAS</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email institucional</label>
            <input
              type="email"
              className="form-control"
              placeholder="seu@email.gov.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="remember" checked={salvar}
              onChange={(e) => setSalvar(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
            />
            <label htmlFor="remember" style={{ margin: 0, cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
              Salvar Login
            </label>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-light)' }}>
          Nao tem uma conta?{' '}
          <Link to="/cadastro" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
            Criar conta
          </Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text-light)' }}>
          E usuario?{' '}
          <Link to="/cadastro-requerente" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Cadastre-se aqui
          </Link>
        </div>
      </div>
    </div>
  )
}

