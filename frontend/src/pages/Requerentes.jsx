import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import { formatCPF, formatDate } from '../utils/format'
import { Search, Plus, Eye } from 'lucide-react'

export default function Requerentes() {
  const navigate = useNavigate()
  const [requerentes, setRequerentes] = useState([])
  const [search, setSearch] = useState('')
  const [filtroLocal, setFiltroLocal] = useState('')
  const [filtroSexo, setFiltroSexo] = useState('')
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
    if (filtroLocal) query = query.eq('localizacao', filtroLocal)
    if (filtroSexo) query = query.eq('sexo', filtroSexo)
    const { data } = await query
    setRequerentes(data || [])
    setLoading(false)
  }

  useEffect(() => { loadRequerentes() }, [search, filtroLocal, filtroSexo])

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
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">
          Requerentes <em>& Famílias</em>.
        </h1>
        <p className="page-subtitle">
          Gerencie os cadastros do município. Use a busca ou os filtros rápidos para encontrar as famílias.
        </p>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="filter-pills">
          <button className={`pill ${!filtroLocal && !filtroSexo ? 'active' : ''}`} onClick={() => { setFiltroLocal(''); setFiltroSexo('') }}>
            Todos
          </button>
          <button className={`pill ${filtroLocal === 'urbano' ? 'active' : ''}`} onClick={() => setFiltroLocal(filtroLocal === 'urbano' ? '' : 'urbano')}>
            Zona Urbana
          </button>
          <button className={`pill ${filtroLocal === 'rural' ? 'active' : ''}`} onClick={() => setFiltroLocal(filtroLocal === 'rural' ? '' : 'rural')}>
            Zona Rural
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginLeft: 8, padding: '8px 16px', borderRadius: 24 }}>
            <Plus size={18} /> Novo Requerente
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading" style={{ padding: 40 }}>Carregando...</div>
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
                  <th style={{ paddingLeft: 24 }}>Requerente Principal</th>
                  <th>Contato</th>
                  <th>Triagem</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {requerentes.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/requerentes/${r.id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ paddingLeft: 24 }}>
                      <div className="cell-inline">
                        <div className="cell-avatar">{r.nome.charAt(0).toUpperCase()}</div>
                        <div className="cell-text">
                          <span className="name">{r.nome}</span>
                          <span className="meta">{formatCPF(r.cpf) || 'Sem CPF'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-text">
                        <span>{r.telefone || '—'}</span>
                        <span className="meta">{formatDate(r.data_nascimento)}</span>
                      </div>
                    </td>
                    <td>
                      {r.vulnerabilidade_score ? (
                        <span className={`badge badge-risco-${r.vulnerabilidade_cor === 'vermelho' ? 'alto' : r.vulnerabilidade_cor === 'amarelo' ? 'medio' : 'baixo'}`}>
                          {r.vulnerabilidade_score}
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>Triagem Pendente</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '8px', borderRadius: '50%', background: 'transparent', border: 'none', color: 'var(--text-light)' }} 
                        title="Ver Perfil"
                        onClick={(e) => { e.stopPropagation(); navigate(`/requerentes/${r.id}`) }}
                      >
                        <Eye size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-light)' }}>
              {requerentes.length} requerentes listados
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20, backdropFilter: 'blur(4px)'
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 32,
            width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto',
            boxShadow: 'var(--shadow-lg)'
          }} onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow">NOVO CADASTRO</div>
            <h2 className="font-serif" style={{ marginBottom: 24, fontSize: 24, color: 'var(--primary)' }}>
              Cadastrar <em>Requerente</em>
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome completo *</label>
                  <input className="form-control" value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} required placeholder="Ex: Maria da Silva" />
                </div>
                <div className="form-group">
                  <label>CPF</label>
                  <input className="form-control" value={form.cpf} onChange={(e) => setForm({...form, cpf: e.target.value})} placeholder="000.000.000-00" />
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
                  <input className="form-control" value={form.telefone} onChange={(e) => setForm({...form, telefone: e.target.value})} placeholder="(00) 00000-0000" />
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
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} style={{ borderRadius: 20 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 20, paddingLeft: 24, paddingRight: 24 }}>
                  {saving ? 'Salvando...' : 'Salvar cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
