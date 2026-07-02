import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import { useAuth } from '../hooks/useAuth'
import { ROLE_LABELS, CRAS_LIST } from '../utils/roles'
import { formatDateTime } from '../utils/format'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Admin() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [tab, setTab] = useState('users')
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', password: '', role: 'tecnico', cras: '' })
  const [saving, setSaving] = useState(false)

  async function loadUsers() {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profile?.role === 'gerente') {
      query = query.eq('cras', profile.cras)
    }

    const { data } = await query
    setUsers(data || [])
    setLoading(false)
  }

  async function loadLogs() {
    const { data } = await supabase
      .from('audit_logs')
      .select('*, profiles(nome)')
      .order('created_at', { ascending: false })
      .limit(50)
    setLogs(data || [])
  }

  useEffect(() => { if (profile) loadUsers() }, [profile])

  async function toggleUserStatus(userId, currentStatus) {
    const { error } = await supabase
      .from('profiles')
      .update({ ativo: !currentStatus })
      .eq('id', userId)
    if (!error) loadUsers()
  }

  async function changeRole(userId, newRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (!error) loadUsers()
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const resp = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.detail || 'Erro ao criar usuário')
      }
      setShowAddModal(false)
      setForm({ nome: '', email: '', password: '', role: 'tecnico', cras: '' })
      loadUsers()
    } catch (err) {
      alert('Erro: ' + err.message)
    }
    setSaving(false)
  }

  async function handleDeleteUser(userId, nome) {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"? Esta ação não pode ser desfeita.`)) return
    try {
      const resp = await fetch(`${API_URL}/api/users/${userId}`, { method: 'DELETE' })
      if (!resp.ok) throw new Error('Erro ao excluir usuário')
      loadUsers()
    } catch (err) {
      alert('Erro: ' + err.message)
    }
  }

  return (
    <Layout title="Administração">
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title font-serif">
          Administração <em>do Sistema</em>.
        </h1>
        <p className="page-subtitle">
          Gerencie usuários, permissões e consulte o registro de auditoria.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        <button
          className={`btn btn-sm ${tab === 'users' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setTab('users')}
        >
          Usuários
        </button>
        <button
          className={`btn btn-sm ${tab === 'logs' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setTab('logs'); loadLogs() }}
        >
          Auditoria
        </button>
      </div>

      {tab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h3>Usuários ({users.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => {
              setForm({ nome: '', email: '', password: '', role: 'tecnico', cras: profile?.role === 'gerente' ? profile.cras : '' })
              setShowAddModal(true)
            }}>
              + Novo Usuário
            </button>
          </div>
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>CRAS</th>
                    <th>Perfil</th>
                    <th>Status</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.nome}</strong></td>
                      <td>{u.email}</td>
                      <td><span className="badge badge-outline">{u.cras}</span></td>
                      <td>
                        <select
                          className="form-control"
                          style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                        >
                          {Object.entries(ROLE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                          background: u.ativo ? '#2ecc71' : '#e74c3c', marginRight: 6,
                        }} />
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </td>
                      <td>{formatDateTime(u.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className={`btn btn-sm ${u.ativo ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => toggleUserStatus(u.id, u.ativo)}
                          >
                            {u.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteUser(u.id, u.nome)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div className="card">
          <div className="card-header">
            <h3>Registro de Atividades</h3>
          </div>
          {logs.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <p>Nenhum registro de atividade ainda.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Usuário</th>
                    <th>Ação</th>
                    <th>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.created_at)}</td>
                      <td>{log.profiles?.nome || '—'}</td>
                      <td>{log.acao}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-light)' }}>
                        {log.detalhes ? JSON.stringify(log.detalhes).slice(0, 60) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20, backdropFilter: 'blur(4px)'
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 32,
            width: '100%', maxWidth: 450, maxHeight: '90vh', overflow: 'auto',
            boxShadow: 'var(--shadow-lg)'
          }} onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow">NOVO ACESSO</div>
            <h2 className="font-serif" style={{ marginBottom: 24, fontSize: 24, color: 'var(--text-primary)' }}>
              Criar <em>Usuário</em>
            </h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Nome completo *</label>
                <input className="form-control" value={form.nome}
                  onChange={(e) => setForm({...form, nome: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email institucional *</label>
                <input type="email" className="form-control" value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Senha *</label>
                <input type="password" className="form-control" value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})} required minLength={6} />
              </div>
              <div className="form-group">
                <label>Perfil *</label>
                <select className="form-control" value={form.role}
                  onChange={(e) => setForm({...form, role: e.target.value})}>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>CRAS *</label>
                <select className="form-control" value={form.cras}
                  onChange={(e) => setForm({...form, cras: e.target.value})}
                  disabled={profile?.role === 'gerente'}
                  required>
                  <option value="">Selecione o CRAS</option>
                  {CRAS_LIST.map((cras) => (
                    <option key={cras} value={cras}>{cras}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)} style={{ borderRadius: 20 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 20, paddingLeft: 24, paddingRight: 24 }}>
                  {saving ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
