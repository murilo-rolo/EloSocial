import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useRealtime } from '../../hooks/useRealtime'
import { formatDate, formatDateTime } from '../../utils/format'
import { auditLog } from '../../utils/audit'
import { Plus, Trash2, CheckCircle2, Clock, PlayCircle, Calendar, Video, X } from 'lucide-react'

const STATUS_CYCLE = ['pendente', 'em_andamento', 'concluido']

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: '#d97706', bg: '#fef3c7', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: '#2563eb', bg: '#dbeafe', icon: PlayCircle },
  concluido: { label: 'Concluido', color: '#16a34a', bg: '#dcfce7', icon: CheckCircle2 },
}

const RESPONSAVEL_LABELS = {
  requerente: 'Usuário',
  assistente: 'Assistente',
  ambos: 'Ambos',
}

function nextStatus(current) {
  const idx = STATUS_CYCLE.indexOf(current)
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
}

function getStatusBadge(status) {
  switch(status) {
    case 'Pendente': return { bg: 'var(--warning)', color: '#fff', label: 'Pendente' }
    case 'Concluido': return { bg: 'var(--accent)', color: '#fff', label: 'Concluído' }
    case 'Cancelado': return { bg: 'var(--danger)', color: '#fff', label: 'Cancelado' }
    case 'Faltou': return { bg: '#34495e', color: '#fff', label: 'Faltou' }
    default: return { bg: '#94a3b8', color: '#fff', label: status }
  }
}

export default function PlanoAcaoCaso({ casoId, modo, applicantId }) {
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

  const [agendamentos, setAgendamentos] = useState([])
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(false)
  const [showAgendaModal, setShowAgendaModal] = useState(false)
  const [agendaForm, setAgendaForm] = useState({
    data_hora: '',
    tipo: 'Sessão de Terapia',
    observacoes: '',
  })
  const [creatingAgendamento, setCreatingAgendamento] = useState(false)

  const [showVideoModal, setShowVideoModal] = useState(false)
  const [creatingVideo, setCreatingVideo] = useState(false)
  const [videoRoom, setVideoRoom] = useState(null)
  const [videoForm, setVideoForm] = useState({
    data_hora: '',
    observacoes: '',
  })

  useEffect(() => {
    if (!casoId) return
    loadItens()
  }, [casoId])

  useEffect(() => {
    if (applicantId) {
      loadAgendamentos()
    }
  }, [applicantId])

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

  async function loadAgendamentos() {
    if (!applicantId) return
    setLoadingAgendamentos(true)
    const { data } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('applicant_id', applicantId)
      .order('data_hora', { ascending: true })
    setAgendamentos(data || [])
    setLoadingAgendamentos(false)
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
      if (newStatus === 'concluido') {
        auditLog(profile.id, 'concluiu_tarefa', { tarefa_id: item.id, titulo: item.titulo, caso_id: casoId })
      }
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

  async function handleCreateAgendamento(e) {
    e.preventDefault()
    if (!agendaForm.data_hora) return

    setCreatingAgendamento(true)
    try {
      const { error } = await supabase.from('agendamentos').insert({
        profissional_id: profile?.id,
        applicant_id: applicantId,
        data_hora: new Date(agendaForm.data_hora).toISOString(),
        tipo: agendaForm.tipo,
        observacoes: agendaForm.observacoes || null,
        created_by: profile?.id,
      })
      if (error) throw error

      setAgendaForm({ data_hora: '', tipo: 'Sessão de Terapia', observacoes: '' })
      setShowAgendaModal(false)
      loadAgendamentos()
    } catch (err) {
      alert('Erro ao criar agendamento: ' + err.message)
    } finally {
      setCreatingAgendamento(false)
    }
  }

  async function handleUpdateAgendamentoStatus(id, newStatus) {
    try {
      const { error } = await supabase.from('agendamentos').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      if (newStatus === 'Concluido') {
        auditLog(profile.id, 'concluiu_agendamento', { agendamento_id: id })
      }
      loadAgendamentos()
    } catch (err) {
      alert('Erro ao atualizar agendamento: ' + err.message)
    }
  }

  async function handleCreateVideoRoom(e) {
    e.preventDefault()
    setCreatingVideo(true)
    setVideoRoom(null)
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
      const res = await fetch(`${apiUrl}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privacy: 'private',
          ...(videoForm.observacoes ? { observacoes: videoForm.observacoes } : {}),
        }),
      })

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`)

      const room = await res.json()
      setVideoRoom(room)

      if (casoId) {
        const titulo = videoForm.data_hora
          ? `Videoconferência agendada para ${new Date(videoForm.data_hora).toLocaleString('pt-BR')}`
          : 'Videoconferência'
        await supabase.from('planos_acao').insert({
          caso_id: casoId,
          titulo,
          descricao: `Sala: ${room.room_url} | Código: ${room.access_code || 'N/A'}${videoForm.observacoes ? ' - ' + videoForm.observacoes : ''}`,
          responsavel: 'ambos',
          data_limite: videoForm.data_hora || null,
          created_by: profile?.id,
          created_by_tipo: modo,
        })
      }
    } catch (err) {
      alert('Erro ao criar sala: ' + err.message)
    } finally {
      setCreatingVideo(false)
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
                    <option value="requerente">Usuário</option>
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

                <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                  {item.status === 'pendente' && (
                    <button
                      className="btn btn-sm"
                      onClick={() => handleToggleStatus(item)}
                      style={{ fontSize: 11, padding: '2px 8px', borderColor: '#2563eb', color: '#2563eb' }}
                    >
                      Iniciar
                    </button>
                  )}
                  {item.status === 'em_andamento' && (
                    <button
                      className="btn btn-sm"
                      onClick={() => handleToggleStatus(item)}
                      style={{ fontSize: 11, padding: '2px 8px', borderColor: '#16a34a', color: '#16a34a' }}
                    >
                      Concluir
                    </button>
                  )}
                  {item.status === 'concluido' && (
                    <button
                      className="btn btn-sm"
                      onClick={() => handleToggleStatus(item)}
                      style={{ fontSize: 11, padding: '2px 8px', borderColor: '#d97706', color: '#d97706' }}
                    >
                      Reabrir
                    </button>
                  )}
                  {modo === 'assistente' && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDelete(item)}
                      title="Excluir"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {applicantId && (
        <>
          <div style={{ marginTop: 24, marginBottom: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Calendar size={18} style={{ color: 'var(--text-light)' }} />
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Agendamentos
              </h4>
              <div style={{ flex: 1 }} />
              {modo === 'assistente' && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAgendaModal(true)}>
                  <Plus size={14} style={{ marginRight: 4 }} />
                  Novo Agendamento
                </button>
              )}
            </div>

            {loadingAgendamentos ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)' }}>
                Carregando agendamentos...
              </div>
            ) : agendamentos.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Nenhum agendamento ou ação pendente.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {agendamentos.map(ag => {
                  const badge = getStatusBadge(ag.status)
                  const isLate = ag.status === 'Pendente' && new Date(ag.data_hora) < new Date()
                  return (
                    <div key={ag.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: isLate ? '#fff5f5' : 'var(--bg-surface)',
                      fontSize: 13,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, color: isLate ? 'var(--danger)' : 'var(--text-primary)' }}>
                          {formatDateTime(ag.data_hora)}
                          {isLate && <span style={{ marginLeft: 6, fontSize: 11 }}>⚠️ Atrasado</span>}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{ag.tipo}</div>
                        {ag.observacoes && (
                          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{ag.observacoes}</div>
                        )}
                      </div>
                      <span className="badge" style={{ background: badge.bg, color: badge.color, fontSize: 10, padding: '2px 8px' }}>
                        {badge.label}
                      </span>
                      {ag.status === 'Pendente' && (
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button className="btn btn-sm" style={{ fontSize: 11, padding: '2px 8px', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                            onClick={() => handleUpdateAgendamentoStatus(ag.id, 'Concluido')}>
                            Concluir
                          </button>
                          <button className="btn btn-sm" style={{ fontSize: 11, padding: '2px 8px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                            onClick={() => handleUpdateAgendamentoStatus(ag.id, 'Cancelado')}>
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {modo === 'assistente' && (
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-outline" onClick={() => setShowVideoModal(true)} style={{ width: '100%', justifyContent: 'center', gap: 8 }}>
                <Video size={16} />
                Agendar Video Chamada
              </button>
            </div>
          )}
        </>
      )}

      {showAgendaModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20, backdropFilter: 'blur(4px)',
        }} onClick={() => setShowAgendaModal(false)}>
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 28,
            width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Novo Agendamento</h3>
              <button className="btn" onClick={() => setShowAgendaModal(false)} style={{ padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateAgendamento} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Data e Hora *</label>
                <input type="datetime-local" className="form-control" required
                  value={agendaForm.data_hora}
                  onChange={e => setAgendaForm(prev => ({ ...prev, data_hora: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-control"
                  value={agendaForm.tipo}
                  onChange={e => setAgendaForm(prev => ({ ...prev, tipo: e.target.value }))}>
                  <option value="Sessão de Terapia">Sessão de Terapia</option>
                  <option value="Visita Domiciliar">Visita Domiciliar</option>
                  <option value="Acompanhamento">Acompanhamento</option>
                  <option value="Reunião Familiar">Reunião Familiar</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea className="form-control" rows={2}
                  value={agendaForm.observacoes}
                  onChange={e => setAgendaForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Ex: Levar documentos para assinar" />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn" onClick={() => setShowAgendaModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={creatingAgendamento}>
                  {creatingAgendamento ? 'Criando...' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVideoModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20, backdropFilter: 'blur(4px)',
        }} onClick={() => { setShowVideoModal(false); setVideoRoom(null) }}>
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 28,
            width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Agendar Video Chamada</h3>
              <button className="btn" onClick={() => { setShowVideoModal(false); setVideoRoom(null) }} style={{ padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {videoRoom ? (
              <div>
                <div style={{ padding: 16, background: '#d1fae5', borderRadius: 12, marginBottom: 16 }}>
                  <p style={{ color: '#065f46', fontWeight: 600, marginBottom: 8 }}> Sala criada com sucesso!</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label className="form-label">Link da Sala</label>
                    <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, wordBreak: 'break-all' }}>
                      <a href={videoRoom.room_url} target="_blank" rel="noopener noreferrer">{videoRoom.room_url}</a>
                    </div>
                  </div>
                  {videoRoom.access_code && (
                    <div>
                      <label className="form-label">Código de Acesso</label>
                      <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 18, fontWeight: 700, letterSpacing: 4, textAlign: 'center' }}>
                        {videoRoom.access_code}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button className="btn" onClick={() => { setShowVideoModal(false); setVideoRoom(null) }}>Fechar</button>
                  <a href={videoRoom.room_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    Entrar na Sala
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateVideoRoom} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Data (opcional)</label>
                  <input type="datetime-local" className="form-control"
                    value={videoForm.data_hora}
                    onChange={e => setVideoForm(prev => ({ ...prev, data_hora: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea className="form-control" rows={2}
                    value={videoForm.observacoes}
                    onChange={e => setVideoForm(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Ex: Chamada para revisão do caso" />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn" onClick={() => { setShowVideoModal(false); setVideoRoom(null) }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={creatingVideo}>
                    {creatingVideo ? 'Criando Sala...' : 'Criar Sala'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
