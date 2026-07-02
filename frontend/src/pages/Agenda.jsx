import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import { formatDateTime } from '../utils/format'

export default function Agenda() {
  const { profile } = useAuth()
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [applicants, setApplicants] = useState([])

  const [formData, setFormData] = useState({
    applicant_id: '',
    data_hora: '',
    tipo: 'Sessão de Terapia',
    observacoes: ''
  })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    // Fetch agendamentos
    const { data: agData } = await supabase
      .from('agendamentos')
      .select('*, applicants(nome)')
      .order('data_hora', { ascending: true })
    
    // Fetch applicants for the select dropdown
    const { data: appData } = await supabase
      .from('applicants')
      .select('id, nome')
      .order('nome', { ascending: true })
    
    setAgendamentos(agData || [])
    setApplicants(appData || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const { error } = await supabase.from('agendamentos').insert({
        profissional_id: profile.id,
        applicant_id: formData.applicant_id,
        data_hora: new Date(formData.data_hora).toISOString(),
        tipo: formData.tipo,
        observacoes: formData.observacoes,
        created_by: profile.id
      })
      
      if (error) throw error
      
      alert('Agendamento criado com sucesso!')
      setIsModalOpen(false)
      load()
    } catch (err) {
      alert('Erro ao criar agendamento: ' + err.message)
    }
  }

  async function updateStatus(id, newStatus) {
    try {
      const { error } = await supabase.from('agendamentos').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      load()
    } catch (err) {
      alert('Erro ao atualizar: ' + err.message)
    }
  }

  if (loading) return <Layout title="Agenda"><div className="loading">Carregando...</div></Layout>

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pendente': return <span className="badge badge-warning" style={{ background: 'var(--warning)', color: '#fff' }}>Pendente</span>
      case 'Concluído': return <span className="badge badge-success" style={{ background: 'var(--accent)', color: '#fff' }}>Concluído</span>
      case 'Cancelado': return <span className="badge badge-danger" style={{ background: 'var(--danger)', color: '#fff' }}>Cancelado</span>
      case 'Faltou': return <span className="badge badge-danger" style={{ background: '#34495e', color: '#fff' }}>Faltou</span>
      default: return <span className="badge">{status}</span>
    }
  }

  return (
    <Layout title="Agenda">
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title font-serif">
            Agenda <em>de Atendimentos</em>.
          </h1>
          <p className="page-subtitle">
            Gerencie suas consultas, visitas domiciliares e reuniões.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ borderRadius: 24, padding: '8px 20px' }}>
          + Novo Agendamento
        </button>
      </div>

      <div className="card">
        {agendamentos.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📅</div>
            <p>Sua agenda está vazia.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data e Hora</th>
                  <th>Requerente</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {agendamentos.map(ag => {
                  const isLate = ag.status === 'Pendente' && new Date(ag.data_hora) < new Date()
                  return (
                    <tr key={ag.id} style={{ background: isLate ? '#fff5f5' : 'transparent' }}>
                      <td style={{ fontWeight: 600, color: isLate ? 'var(--danger)' : 'inherit' }}>
                        {formatDateTime(ag.data_hora)}
                        {isLate && <span style={{ marginLeft: 8, fontSize: 12 }}>⚠️ Atrasado</span>}
                      </td>
                      <td>{ag.applicants?.nome}</td>
                      <td>{ag.tipo}</td>
                      <td>{getStatusBadge(ag.status)}</td>
                      <td>
                        {ag.status === 'Pendente' && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => updateStatus(ag.id, 'Concluído')}>Concluir</button>
                            <button className="btn btn-sm btn-outline" style={{ borderColor: '#34495e', color: '#34495e' }} onClick={() => updateStatus(ag.id, 'Faltou')}>Faltou</button>
                            <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => updateStatus(ag.id, 'Cancelado')}>Cancelar</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20, backdropFilter: 'blur(4px)'
        }} onClick={() => setIsModalOpen(false)}>
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 32,
            width: '100%', maxWidth: 450, maxHeight: '90vh', overflow: 'auto',
            boxShadow: 'var(--shadow-lg)'
          }} onClick={e => e.stopPropagation()}>
            <div className="eyebrow">NOVO EVENTO</div>
            <h2 className="font-serif" style={{ marginBottom: 24, fontSize: 24, color: 'var(--text-primary)' }}>
              Agendar <em>Atendimento</em>
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Requerente *</label>
                <select 
                  className="form-control" 
                  required 
                  value={formData.applicant_id}
                  onChange={e => setFormData({...formData, applicant_id: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {applicants.map(app => (
                    <option key={app.id} value={app.id}>{app.nome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Data e Hora *</label>
                <input 
                  type="datetime-local" 
                  className="form-control" 
                  required 
                  value={formData.data_hora}
                  onChange={e => setFormData({...formData, data_hora: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Tipo de Atendimento *</label>
                <select 
                  className="form-control" 
                  value={formData.tipo}
                  onChange={e => setFormData({...formData, tipo: e.target.value})}
                >
                  <option value="Sessão de Terapia">Sessão de Terapia</option>
                  <option value="Visita Domiciliar">Visita Domiciliar</option>
                  <option value="Acompanhamento">Acompanhamento</option>
                  <option value="Reunião Familiar">Reunião Familiar</option>
                </select>
              </div>
              <div className="form-group">
                <label>Observações Iniciais</label>
                <textarea 
                  className="form-control" 
                  value={formData.observacoes}
                  onChange={e => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Ex: Levar documentos para assinar"
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ borderRadius: 20 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: 20, paddingLeft: 24, paddingRight: 24 }}>Agendar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
