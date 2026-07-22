import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import { formatCPF, formatDate, formatDateTime } from '../utils/format'
import { ROLE_LABELS, isRequerente } from '../utils/roles'
import SlideOver from '../components/SlideOver'
import ProntuarioView from './ProntuarioView'
import ChatLLM from '../components/ChatLLM'
import MensagensCaso from '../components/caso/MensagensCaso'
import PlanoAcaoCaso from '../components/caso/PlanoAcaoCaso'
import DocumentosCaso from '../components/caso/DocumentosCaso'
import { MessageSquare, ClipboardList, Pencil, FileText } from 'lucide-react'

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: '#f59e0b', bg: '#fef3c7' },
  em_analise: { label: 'Em Analise', color: '#3b82f6', bg: '#dbeafe' },
  em_atendimento: { label: 'Em Atendimento', color: '#22c55e', bg: '#d1fae5' },
  em_acompanhamento: { label: 'Em Acompanhamento', color: '#6366f1', bg: '#e0e7ff' },
  concluido: { label: 'Concluido', color: '#6b7280', bg: '#f3f4f6' },
  cancelado: { label: 'Cancelado', color: '#ef4444', bg: '#fee2e2' },
}

export default function RequerenteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [requerente, setRequerente] = useState(null)
  const [prontuarios, setProntuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProntuarioId, setSelectedProntuarioId] = useState(null)
  const [caso, setCaso] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: req } = await supabase.from('applicants').select('*').eq('id', id).single()
      const { data: pro } = await supabase
        .from('prontuarios')
        .select('id, created_at, created_by, versao, dados_json, profiles!prontuarios_created_by_fkey(nome, role)')
        .eq('applicant_id', id)
        .order('created_at', { ascending: false })
      setRequerente(req)
      setProntuarios(pro || [])

      const { data: casoData } = await supabase
        .from('triagens')
        .select('*')
        .eq('applicant_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setCaso(casoData)

      setLoading(false)
    }
    load()
  }, [id])

  useRealtime(`requerente-detail-triagem-${id}`, 'triagens', '*', (payload) => {
    if (payload.new?.applicant_id === id) {
      setCaso(payload.new)
    }
  })

  useRealtime(`requerente-detail-applicant-${id}`, 'applicants', 'UPDATE', (payload) => {
    if (payload.new?.id === id) {
      setRequerente(payload.new)
    }
  })

  const { profile } = useAuth()
  const isProfessional = profile && !isRequerente(profile.role)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [assigning, setAssigning] = useState(false)

  async function handleUpdateStatus(newStatus) {
    if (newStatus === caso?.status) {
      setShowStatusDropdown(false)
      return
    }
    if (newStatus === 'concluido' || newStatus === 'cancelado') {
      setConfirmAction({ type: 'status', value: newStatus })
      setShowStatusDropdown(false)
      return
    }
    setShowStatusDropdown(false)
    setUpdating(true)
    const { error } = await supabase.from('triagens').update({ status: newStatus }).eq('id', caso.id)
    if (error) console.error('Erro ao atualizar status:', error)
    setUpdating(false)
  }

  async function handleAssumirCaso() {
    setAssigning(true)
    const { error } = await supabase.from('triagens').update({ assistente_social_id: profile.id }).eq('id', caso.id)
    if (error) console.error('Erro ao assumir caso:', error)
    setAssigning(false)
  }

  async function handleSoltarCaso() {
    setAssigning(true)
    const { error } = await supabase.from('triagens').update({ assistente_social_id: null }).eq('id', caso.id)
    if (error) console.error('Erro ao soltar caso:', error)
    setAssigning(false)
  }

  async function confirmUpdate() {
    if (!confirmAction) return
    setUpdating(true)
    const { error } = await supabase.from('triagens').update({ status: confirmAction.value }).eq('id', caso.id)
    if (error) console.error('Erro ao confirmar atualizacao:', error)
    setUpdating(false)
    setConfirmAction(null)
  }

  if (loading) return <Layout title="Requerente"><div className="loading">Carregando...</div></Layout>
  if (!requerente) return <Layout title="Requerente"><div className="empty-state">Requerente não encontrado.</div></Layout>

  return (
    <Layout title={requerente.nome}>
      <div style={{ marginBottom: 32 }}>
        <span className="eyebrow">Dossiê do Requerente</span>
        <h1 className="page-title font-serif">
          {requerente.nome.split(' ')[0]} <em>& Família</em>.
        </h1>
        <p className="page-subtitle">
          Visão geral do histórico socioassistencial e prontuários vinculados.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Dados do Requerente</h3>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/prontuarios/novo/${id}`)}>
            + Novo Prontuário
          </button>
        </div>
        <div className="form-row">
          <div><strong>Nome:</strong> {requerente.nome}</div>
          <div><strong>CPF:</strong> {formatCPF(requerente.cpf)}</div>
          <div><strong>NIS:</strong> {requerente.nis || '—'}</div>
          <div><strong>RG:</strong> {requerente.rg || '—'}</div>
          <div><strong>Nascimento:</strong> {formatDate(requerente.data_nascimento)}</div>
          <div><strong>Sexo:</strong> {requerente.sexo || '—'}</div>
          <div><strong>Telefone:</strong> {requerente.telefone || '—'}</div>
        </div>
        {requerente.observacoes && (
          <div style={{ marginTop: 12 }}>
            <strong>Observações:</strong> {requerente.observacoes}
          </div>
        )}
        {requerente.vulnerabilidade_motivo && (
          <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8, borderLeft: `4px solid ${requerente.vulnerabilidade_cor === 'vermelho' ? '#ef4444' : requerente.vulnerabilidade_cor === 'amarelo' ? '#f59e0b' : '#10b981'}` }}>
            <strong style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-light)' }}>PARECER DA TRIAGEM IA:</strong>
            {requerente.vulnerabilidade_motivo}
          </div>
        )}
        {caso && (
          <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span className="badge" style={{
                background: (STATUS_CONFIG[caso.status] || STATUS_CONFIG.pendente).bg,
                color: (STATUS_CONFIG[caso.status] || STATUS_CONFIG.pendente).color,
              }}>
                {(STATUS_CONFIG[caso.status] || STATUS_CONFIG.pendente).label}
              </span>
              {isProfessional && (
                <button
                  onClick={() => { setShowStatusDropdown(!showStatusDropdown) }}
                  style={{ marginLeft: 4, padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', verticalAlign: 'middle' }}
                  title="Alterar status"
                >
                  <Pencil size={14} />
                </button>
              )}
              {showStatusDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, zIndex: 100,
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 8, boxShadow: 'var(--shadow-lg)', padding: 4, minWidth: 160, marginTop: 4,
                }}>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleUpdateStatus(key)}
                      style={{
                        display: 'block', width: '100%', padding: '6px 12px', textAlign: 'left',
                        background: key === caso.status ? '#f1f5f9' : 'none', border: 'none',
                        borderRadius: 4, cursor: 'pointer', fontSize: 13, color: cfg.color,
                      }}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {profile?.role === 'assistente_social' && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {caso.assistente_social_id === profile.id ? (
                  <button className="btn btn-outline btn-sm" onClick={handleSoltarCaso} disabled={assigning}>
                    {assigning ? 'Soltando...' : '✕ Soltar Caso'}
                  </button>
                ) : caso.assistente_social_id ? (
                  <span className="badge" style={{ background: '#f1f5f9', color: '#94a3b8', fontSize: 12 }}>
                    Vinculado a outro profissional
                  </span>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={handleAssumirCaso} disabled={assigning}>
                    {assigning ? 'Atribuindo...' : '⊕ Assumir Caso'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {caso && caso.dados_acolhimento && (
        <div className="card">
          <div className="card-header">
            <h3>Dados da Triagem</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Motivo
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                {caso.dados_acolhimento?.motivo?.demanda_principal || caso.dados_acolhimento?.motivo || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Urgência
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                {caso.dados_acolhimento?.urgencia?.nivel || caso.dados_acolhimento?.urgencia || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Telefone
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                {caso.dados_acolhimento?.contato?.telefone || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Bairro
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                {caso.dados_acolhimento?.contato?.bairro_localidade || '—'}
              </div>
            </div>
          </div>
          {caso.sintomas && caso.sintomas.length > 0 && (
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Sintomas / Demandas
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {caso.sintomas.map((s, i) => (
                  <span key={i} className="badge" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', fontSize: 11, padding: '3px 8px' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {caso && !caso.dados_acolhimento && (
        <div className="card">
          <div className="empty-state">
            <p>Nenhuma triagem realizada.</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Linha do Tempo (Prontuários)</h3>
        </div>
        {prontuarios.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>Nenhum prontuário registrado para este requerente.</p>
          </div>
        ) : (
          <div className="timeline">
            {prontuarios.map((p) => (
              <div key={p.id} className="timeline-item">
                <div className="timeline-content" onClick={() => setSelectedProntuarioId(p.id)}>
                  <div className="timeline-header">
                    <strong>Prontuário v{p.versao}</strong>
                    <span className="timeline-date">{formatDateTime(p.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                    Atualizado por: {p.profiles?.nome || '—'}
                    <span className={`badge badge-${p.profiles?.role}`} style={{ marginLeft: 8 }}>
                      {p.profiles?.role ? ROLE_LABELS[p.profiles.role] : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3><ClipboardList size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Plano de Ação</h3>
        </div>
        {caso ? (
          <PlanoAcaoCaso casoId={caso.id} modo="assistente" applicantId={id} />
        ) : (
          <div className="empty-state">
            <p>Nenhum caso vinculado a este requerente.</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Crie um caso na triagem para gerenciar o plano de ação.
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3><FileText size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Documentos</h3>
        </div>
        {caso ? (
          <div style={{ padding: 16 }}>
            <DocumentosCaso casoId={caso.id} modo="assistente" filtroTipo="requerente" />
          </div>
        ) : (
          <div className="empty-state">
            <p>Nenhum caso vinculado a este requerente.</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3><MessageSquare size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Mensagens</h3>
        </div>
        {caso ? (
          <div style={{ padding: 0, height: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <MensagensCaso casoId={caso.id} modo="assistente" applicantUserId={caso.user_id} />
          </div>
        ) : (
          <div className="empty-state">
            <p>Nenhum caso vinculado a este requerente.</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Crie um caso na triagem para iniciar o chat.
            </p>
          </div>
        )}
      </div>

      {confirmAction && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20,
        }} onClick={() => { if (!updating) setConfirmAction(null) }}>
          <div style={{
            background: 'var(--card)', borderRadius: 12, padding: 24, maxWidth: 400, width: '100%',
            boxShadow: 'var(--shadow-lg)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Confirmar alteração</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Deseja alterar o status para "{confirmAction.value}"?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setConfirmAction(null)} disabled={updating}>
                Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={confirmUpdate} disabled={updating}>
                {updating ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SlideOver 
        isOpen={!!selectedProntuarioId} 
        onClose={() => setSelectedProntuarioId(null)}
        title="Detalhes do Prontuário"
      >
        {selectedProntuarioId && (
          <ProntuarioView id={selectedProntuarioId} isDrawer={true} />
        )}
      </SlideOver>

      <ChatLLM prontuarioContext={{ applicant: requerente, prontuarios: prontuarios }} />
    </Layout>
  )
}
