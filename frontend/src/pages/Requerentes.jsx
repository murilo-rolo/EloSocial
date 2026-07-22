import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import { formatCPF } from '../utils/format'
import { Search, Plus, Eye, UploadCloud } from 'lucide-react'

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: '#f59e0b', bg: '#fef3c7' },
  em_analise: { label: 'Em Analise', color: '#3b82f6', bg: '#dbeafe' },
  em_atendimento: { label: 'Em Atendimento', color: '#22c55e', bg: '#d1fae5' },
  em_acompanhamento: { label: 'Em Acompanhamento', color: '#6366f1', bg: '#e0e7ff' },
  concluido: { label: 'Concluido', color: '#6b7280', bg: '#f3f4f6' },
  cancelado: { label: 'Cancelado', color: '#ef4444', bg: '#fee2e2' },
}

export default function Requerentes() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [requerentes, setRequerentes] = useState([])
  const [triagensMap, setTriagensMap] = useState({})
  const [search, setSearch] = useState('')
  const [filtroSexo, setFiltroSexo] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    nome: '', cpf: '', rg: '', data_nascimento: '', telefone: '',
    nis: '', nome_mae: '', sexo: '', observacoes: '',
  })
  const [saving, setSaving] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const fileInputRef = useRef(null)

  async function loadRequerentes() {
    setLoading(true)
    let query = supabase.from('applicants').select('*').order('created_at', { ascending: false })
    if (search) {
      query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`)
    }
    if (filtroSexo) query = query.eq('sexo', filtroSexo)
    const { data } = await query
    const list = data || []
    setRequerentes(list)

    if (list.length > 0) {
      const ids = list.map(r => r.id)
      const { data: triagens } = await supabase
        .from('triagens')
        .select('*, profiles!triagens_assistente_social_id_fkey(nome)')
        .in('applicant_id', ids)
      const map = {}
      for (const t of triagens || []) {
        if (!map[t.applicant_id] || new Date(t.created_at) > new Date(map[t.applicant_id].created_at)) {
          map[t.applicant_id] = t
        }
      }
      setTriagensMap(map)
    }
    setLoading(false)
  }

  useEffect(() => { loadRequerentes() }, [search, filtroSexo])

  useRealtime('requerentes-list', 'applicants', 'UPDATE', (payload) => {
    setRequerentes(prev => prev.map(r =>
      r.id === payload.new.id ? { ...r, ...payload.new } : r
    ))
  })

  useRealtime('requerentes-list-triagens', 'triagens', '*', (payload) => {
    const t = payload.new
    if (t?.applicant_id) {
      setTriagensMap(prev => ({ ...prev, [t.applicant_id]: t }))
    }
  })

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
      setForm({ nome: '', cpf: '', rg: '', data_nascimento: '', telefone: '', nis: '', nome_mae: '', sexo: '', observacoes: '' })
      loadRequerentes()
    }
  }

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setOcrLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/ocr/extract_requerente`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error('Falha ao ler o documento com IA.')
      
      const data = await res.json()
      
      // Auto-preencher o formulário
      setForm(prev => ({
        ...prev,
        nome: data.nome || prev.nome,
        cpf: data.cpf || prev.cpf,
        rg: data.rg || prev.rg,
        data_nascimento: data.data_nascimento || prev.data_nascimento,
        nome_mae: data.nome_mae || prev.nome_mae,
        sexo: data.sexo === 'Masculino' ? 'M' : (data.sexo === 'Feminino' ? 'F' : prev.sexo)
      }))

    } catch (error) {
      alert(error.message)
      console.error(error)
    } finally {
      setOcrLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Layout title="Usuários">
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">
          Usuários <em>& Famílias</em>.
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
          <button className={`pill ${!filtroSexo ? 'active' : ''}`} onClick={() => { setFiltroSexo('') }}>
            Todos
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginLeft: 8, padding: '8px 16px', borderRadius: 24 }}>
            <Plus size={18} /> Novo Usuário
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading" style={{ padding: 40 }}>Carregando...</div>
        ) : requerentes.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👥</div>
            <p>Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>Usuário</th>
                  <th>Contato</th>
                  <th>Status</th>
                  <th>Assistente Social</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {requerentes.map((r) => {
                  const t = triagensMap[r.id]
                  const statusCfg = t ? STATUS_CONFIG[t.status] : null
                  const assistenteNome = t?.profiles?.nome || 'Ausente'
                  return (
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
                        <span>{r.telefone || '—'}</span>
                      </td>
                      <td>
                        {statusCfg ? (
                          <span className="badge" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                            {statusCfg.label}
                          </span>
                        ) : (
                          <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>Triagem Pendente</span>
                        )}
                      </td>
                      <td>
                        <span style={{ color: assistenteNome === 'Ausente' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {assistenteNome}
                        </span>
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
                  )
                })}
              </tbody>
            </table>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-light)' }}>
              {requerentes.length} usuários listados
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
            background: 'var(--card)', borderRadius: 16, padding: 32,
            width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto',
            boxShadow: 'var(--shadow-lg)'
          }} onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow">NOVO CADASTRO</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <h2 className="font-serif" style={{ margin: 0, fontSize: 24, color: 'var(--text-primary)' }}>
                Cadastrar <em>Usuário</em>
              </h2>
              <button 
                type="button" 
                className="btn btn-sm btn-outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                style={{ borderRadius: 20, background: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {ocrLoading ? (
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ animation: 'blink 1.4s infinite both' }}>.</span>
                    <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}>.</span>
                    <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}>.</span>
                    Lendo documento...
                  </span>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    🪄 Preencher com CNH/RG (OCR)
                  </>
                )}
              </button>
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp,application/pdf" 
                ref={fileInputRef} 
                onChange={handleOcrUpload} 
                style={{ display: 'none' }} 
              />
            </div>
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
