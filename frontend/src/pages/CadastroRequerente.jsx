import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { CRAS_LIST } from '../utils/roles'

export default function CadastroRequerente() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    telefone: '',
    cras: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  function formatarTelefone(valor) {
    const digitos = valor.replace(/\D/g, '').slice(0, 11)
    if (digitos.length <= 2) return digitos.replace(/(\d{0,2})/, '($1')
    if (digitos.length <= 7) return digitos.replace(/(\d{2})(\d{0,5})/, '($1) $2')
    return digitos.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  }

  function formatarCpf(valor) {
    const digitos = valor.replace(/\D/g, '').slice(0, 11)
    if (digitos.length <= 3) return digitos
    if (digitos.length <= 6) return digitos.replace(/(\d{3})(\d{0,3})/, '$1.$2')
    if (digitos.length <= 9) return digitos.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3')
    return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4')
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (!form.cras) {
      setError('Selecione um CRAS.')
      return
    }

    setLoading(true)
    try {
      await signup(form.email, form.password, form.nome, 'requerente', form.cras, form.telefone)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#x2705;</div>
            <h1 style={{ marginBottom: 8 }}>Conta Criada!</h1>
            <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
              Sua conta foi criada com sucesso.
              <br />Agora você pode fazer login com suas credenciais.
            </p>
            <button
              className="btn btn-primary btn-block"
              onClick={() => navigate('/login')}
            >
              Ir para o Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 460 }}>
        <h1>Cadastro de Requerente</h1>
        <p>Preencha seus dados para se cadastrar</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome completo *</label>
            <input
              type="text"
              name="nome"
              className="form-control"
              placeholder="Seu nome completo"
              value={form.nome}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="seu@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Senha *</label>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Min. 6 caracteres"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Confirmar Senha *</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                placeholder="Repita a senha"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="form-group">
            <label>CPF</label>
            <input
              type="text"
              name="cpf"
              className="form-control"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: formatarCpf(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label>Telefone</label>
            <input
              type="text"
              name="telefone"
              className="form-control"
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label>CRAS *</label>
            <select
              name="cras"
              className="form-control"
              value={form.cras}
              onChange={handleChange}
              required
            >
              <option value="">Selecione o CRAS</option>
              {CRAS_LIST.map((cras) => (
                <option key={cras} value={cras}>{cras}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          Ja tem uma conta?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  )
}
