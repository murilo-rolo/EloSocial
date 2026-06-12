import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import { ROLE_LABELS } from '../utils/roles'
import { formatDateTime } from '../utils/format'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [tab, setTab] = useState('users')
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', password: '', role: 'tecnico' })
  const [saving, setSaving] = useState(false)

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
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

  useEffect(() => { loadUsers() }, [])

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
      setForm({ nome: '', email: '', password: '', role: 'tecnico' })
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
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
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

      {/* Modal Novo Usuário */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20,
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'white', borderRadius: 12, padding: 24,
            width: '100%', maxWidth: 450,
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>Novo Usuário</h3>
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
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
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
