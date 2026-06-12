import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import { formatCPF, formatDate } from '../utils/format'

export default function Requerentes() {
  const navigate = useNavigate()
  const [requerentes, setRequerentes] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    nome: '', cpf: '', rg: '', data_nascimento: '', telefone: '',
    nis: '', nome_mae: '', sexo: '', localizacao: '', observacoes: '',
  })
  const [saving, setSaving] = useState(false)

  async function loadRequerentes() {
    setLoading(true)
    let query = supabase.from('applicants').select('*').order('created_at', { ascending: false })
    if (search) {
      query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`)
    }
    const { data } = await query
    setRequerentes(data || [])
    setLoading(false)
  }

  useEffect(() => { loadRequerentes() }, [search])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('applicants').insert({
      ...form,
      created_by: user.id,
    })
    setSaving(false)
    if (!error) {
      setShowModal(false)
      setForm({ nome: '', cpf: '', rg: '', data_nascimento: '', telefone: '', nis: '', nome_mae: '', sexo: '', localizacao: '', observacoes: '' })
      loadRequerentes()
    }
  }

  return (
    <Layout title="Requerentes">
      <div className="card">
        <div className="card-header">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Novo Requerente
          </button>
        </div>

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : requerentes.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👥</div>
            <p>Nenhum requerente encontrado.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Nascimento</th>
                  <th>Telefone</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requerentes.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/requerentes/${r.id}`)} style={{ cursor: 'pointer' }}>
                    <td><strong>{r.nome}</strong></td>
                    <td>{formatCPF(r.cpf)}</td>
                    <td>{formatDate(r.data_nascimento)}</td>
                    <td>{r.telefone || '—'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); navigate(`/requerentes/${r.id}`) }}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20,
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: 'white', borderRadius: 12, padding: 24,
            width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>Novo Requerente</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome completo *</label>
                  <input className="form-control" value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>CPF</label>
                  <input className="form-control" value={form.cpf} onChange={(e) => setForm({...form, cpf: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>NIS</label>
                  <input className="form-control" value={form.nis} onChange={(e) => setForm({...form, nis: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>RG</label>
                  <input className="form-control" value={form.rg} onChange={(e) => setForm({...form, rg: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Data de Nascimento</label>
                  <input type="date" className="form-control" value={form.data_nascimento} onChange={(e) => setForm({...form, data_nascimento: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Sexo</label>
                  <select className="form-control" value={form.sexo} onChange={(e) => setForm({...form, sexo: e.target.value})}>
                    <option value="">Selecione</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome da Mãe</label>
                  <input className="form-control" value={form.nome_mae} onChange={(e) => setForm({...form, nome_mae: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Telefone</label>
                  <input className="form-control" value={form.telefone} onChange={(e) => setForm({...form, telefone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Localização</label>
                <select className="form-control" value={form.localizacao} onChange={(e) => setForm({...form, localizacao: e.target.value})}>
                  <option value="">Selecione</option>
                  <option value="urbano">Urbano</option>
                  <option value="rural">Rural</option>
                </select>
              </div>
              <div className="form-group">
                <label>Observações</label>
                <textarea className="form-control" value={form.observacoes} onChange={(e) => setForm({...form, observacoes: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
