import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import { formatCPF, formatDate, formatDateTime } from '../utils/format'
import { ROLE_LABELS } from '../utils/roles'
import SlideOver from '../components/SlideOver'
import ProntuarioView from './ProntuarioView'
import ChatLLM from '../components/ChatLLM'
import MensagensCaso from '../components/caso/MensagensCaso'
import PlanoAcaoCaso from '../components/caso/PlanoAcaoCaso'
import { MessageSquare, ClipboardList } from 'lucide-react'

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
      </div>

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
          <h3><MessageSquare size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Mensagens</h3>
        </div>
        {caso ? (
          <div style={{ padding: 0, height: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <MensagensCaso casoId={caso.id} modo="assistente" />
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
