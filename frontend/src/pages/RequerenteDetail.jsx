import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import { formatCPF, formatDate, formatDateTime } from '../utils/format'
import { ROLE_LABELS } from '../utils/roles'
import SlideOver from '../components/SlideOver'
import ProntuarioView from './ProntuarioView'
import ChatLLM from '../components/ChatLLM'
import ReactMarkdown from 'react-markdown'

export default function RequerenteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [requerente, setRequerente] = useState(null)
  const [prontuarios, setProntuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProntuarioId, setSelectedProntuarioId] = useState(null)
  const [runningTriagem, setRunningTriagem] = useState(false)
  const [generatingResumo, setGeneratingResumo] = useState(false)
  const [resumoText, setResumoText] = useState(null)
  const [showResumo, setShowResumo] = useState(false)

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
      setLoading(false)
    }
    load()
  }, [id])

  const handleTriagem = async () => {
    setRunningTriagem(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/triagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prontuario_context: {
            applicant: requerente,
            prontuarios: prontuarios
          }
        })
      })
      
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`)
      }
      
      const data = await res.json()
      
      const { error: supaError } = await supabase.from('applicants').update({
        vulnerabilidade_score: data.score,
        vulnerabilidade_cor: data.cor,
        vulnerabilidade_motivo: data.motivo
      }).eq('id', id)
      
      if (supaError) {
        throw new Error(`Erro no Banco: As novas colunas existem? (${supaError.message})`)
      }
      
      setRequerente({
        ...requerente,
        vulnerabilidade_score: data.score,
        vulnerabilidade_cor: data.cor,
        vulnerabilidade_motivo: data.motivo
      })
    } catch (e) {
      console.error("Erro na triagem:", e)
      alert(e.message || "Erro ao realizar triagem com IA.")
    } finally {
      setRunningTriagem(false)
    }
  }

  const handleResumo = async () => {
    setGeneratingResumo(true)
    setShowResumo(true)
    setResumoText(null)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/resumo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prontuario_context: {
            applicant: requerente,
            prontuarios: prontuarios
          }
        })
      })
      
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`)
      }
      
      const data = await res.json()
      setResumoText(data.resumo)
    } catch (e) {
      console.error("Erro no resumo:", e)
      setResumoText("Ocorreu um erro ao gerar o resumo executivo. Verifique se o backend está rodando.")
    } finally {
      setGeneratingResumo(false)
    }
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

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', background: 'var(--bg)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Assistentes de IA:
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
          <button className="btn btn-sm btn-outline" onClick={handleTriagem} disabled={runningTriagem} style={{ borderRadius: 20, background: 'white' }}>
            {runningTriagem ? 'Analisando...' : '✨ Triagem IA'}
          </button>
          <button className="btn btn-sm btn-outline" onClick={handleResumo} disabled={generatingResumo} style={{ borderRadius: 20, background: 'white' }}>
            {generatingResumo ? 'Gerando...' : '📄 Resumo IA'}
          </button>
          
          <div style={{ flex: 1 }} />
          
          {requerente.vulnerabilidade_score ? (
            <span 
              className={`badge badge-risco-${requerente.vulnerabilidade_cor === 'vermelho' ? 'alto' : requerente.vulnerabilidade_cor === 'amarelo' ? 'medio' : 'baixo'}`} 
              title={requerente.vulnerabilidade_motivo}
              style={{ cursor: 'help' }}
            >
              {requerente.vulnerabilidade_cor === 'vermelho' ? '🔴' : requerente.vulnerabilidade_cor === 'amarelo' ? '🟡' : '🟢'} {requerente.vulnerabilidade_score}
            </span>
          ) : (
            <span className="badge" style={{ background: '#f8fafc', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>⚪ Triagem Pendente</span>
          )}
        </div>
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

      <SlideOver 
        isOpen={!!selectedProntuarioId} 
        onClose={() => setSelectedProntuarioId(null)}
        title="Detalhes do Prontuário"
      >
        {selectedProntuarioId && (
          <ProntuarioView id={selectedProntuarioId} isDrawer={true} />
        )}
      </SlideOver>

      <SlideOver 
        isOpen={showResumo} 
        onClose={() => setShowResumo(false)}
        title="Resumo Executivo"
      >
        <div style={{ padding: 24, fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>
          {generatingResumo ? (
            <div className="loading">A IA está lendo o histórico e gerando o resumo executivo...</div>
          ) : (
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p style={{margin: '0 0 16px 0'}} {...props} />,
                h3: ({node, ...props}) => <h3 style={{margin: '24px 0 12px 0', color: 'var(--text-primary)', fontSize: 16}} {...props} />,
                ul: ({node, ...props}) => <ul style={{paddingLeft: 20, marginBottom: 16}} {...props} />,
                li: ({node, ...props}) => <li style={{marginBottom: 8}} {...props} />
              }}
            >
              {resumoText}
            </ReactMarkdown>
          )}
        </div>
      </SlideOver>

      <ChatLLM prontuarioContext={{ applicant: requerente, prontuarios: prontuarios }} />
    </Layout>
  )
}
