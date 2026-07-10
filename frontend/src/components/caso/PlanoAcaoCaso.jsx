import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useRealtime } from '../../hooks/useRealtime'
import { formatDate } from '../../utils/format'
import { Plus, Trash2, CheckCircle2, Clock, PlayCircle } from 'lucide-react'

const STATUS_CYCLE = ['pendente', 'em_andamento', 'concluido']

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: '#d97706', bg: '#fef3c7', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: '#2563eb', bg: '#dbeafe', icon: PlayCircle },
  concluido: { label: 'Concluido', color: '#16a34a', bg: '#dcfce7', icon: CheckCircle2 },
}

const RESPONSAVEL_LABELS = {
  requerente: 'Requerente',
  assistente: 'Assistente',
  ambos: 'Ambos',
}

function nextStatus(current) {
  const idx = STATUS_CYCLE.indexOf(current)
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
}

export default function PlanoAcaoCaso({ casoId, modo }) {
  const { profile } = useAuth()
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    responsavel: 'ambos',
    data_limite: '',
  })

  useEffect(() => {
    if (!casoId) return
    loadItens()
  }, [casoId])

  async function loadItens() {
    setLoading(true)
    const { data } = await supabase
      .from('planos_acao')
      .select('*')
      .eq('caso_id', casoId)
      .order('created_at', { ascending: true })
    setItens(data || [])
    setLoading(false)
  }

  useRealtime(`planos-caso-${casoId}`, 'planos_acao', '*', (payload) => {
    if (payload.eventType === 'INSERT') {
      setItens(prev => [...prev, payload.new])
    } else if (payload.eventType === 'UPDATE') {
      setItens(prev => prev.map(i => i.id === payload.new.id ? payload.new : i))
    } else if (payload.eventType === 'DELETE') {
      setItens(prev => prev.filter(i => i.id !== payload.old?.id))
    }
  })

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.titulo.trim()) return

    setCreating(true)
    try {
      const { error } = await supabase.from('planos_acao').insert({
        caso_id: casoId,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        responsavel: form.responsavel,
        data_limite: form.data_limite || null,
        created_by: profile?.id,
        created_by_tipo: modo,
      })
      if (error) throw error

      setForm({ titulo: '', descricao: '', responsavel: 'ambos', data_limite: '' })
      setShowForm(false)
    } catch (err) {
      alert('Erro ao criar item: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleStatus(item) {
    const newStatus = nextStatus(item.status)
    try {
      const { error } = await supabase
        .from('planos_acao')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', item.id)
      if (error) throw error
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Excluir "${item.titulo}"?`)) return
    try {
      const { error } = await supabase.from('planos_acao').delete().eq('id', item.id)
      if (error) throw error
    } catch (err) {
      alert('Erro ao excluir item: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Carregando plano de acao...
      </div>
    )
  }

  return (
    <div>
      {modo === 'assistente' && (
        <div style={{ marginBottom: 16 }}>
          {!showForm ? (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} style={{ marginRight: 6 }} />
              Nova Tarefa
            </button>
          ) : (
            <form onSubmit={handleCreate} className="card" style={{ padding: 20 }}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Titulo *</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.titulo}
                  onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Buscar documentos"
                  autoFocus
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Descricao</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.descricao}
                  onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Detalhes da tarefa..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Responsavel</label>
                  <select
                    className="form-control"
                    value={form.responsavel}
                    onChange={e => setForm(prev => ({ ...prev, responsavel: e.target.value }))}
                  >
                    <option value="requerente">Requerente</option>
                    <option value="assistente">Assistente</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Prazo</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.data_limite}
                    onChange={e => setForm(prev => ({ ...prev, data_limite: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setShowForm(false); setForm({ titulo: '', descricao: '', responsavel: 'ambos', data_limite: '' }) }}
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Criando...' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {itens.length === 0 ? (
        <div className="empty-state" style={{ padding: 24 }}>
          <CheckCircle2 size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Nenhum item no plano de acao.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {itens.map(item => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pendente
            const Icon = cfg.icon

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  opacity: item.status === 'concluido' ? 0.7 : 1,
                }}
              >
                <button
                  onClick={() => handleToggleStatus(item)}
                  title={`Clique para mudar para: ${STATUS_CONFIG[nextStatus(item.status)]?.label}`}
                  style={{
                    background: cfg.bg,
                    border: 'none',
                    borderRadius: 8,
                    padding: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} style={{ color: cfg.color }} />
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    textDecoration: item.status === 'concluido' ? 'line-through' : 'none',
                  }}>
                    {item.titulo}
                  </div>

                  {item.descricao && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {item.descricao}
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: cfg.bg,
                      color: cfg.color,
                    }}>
                      {cfg.label}
                    </span>
                    {item.responsavel && (
                      <span>Responsavel: {RESPONSAVEL_LABELS[item.responsavel] || item.responsavel}</span>
                    )}
                    {item.data_limite && (
                      <span>Prazo: {new Date(item.data_limite + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    )}
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>

                {modo === 'assistente' && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleDelete(item)}
                    title="Excluir"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)', flexShrink: 0 }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
