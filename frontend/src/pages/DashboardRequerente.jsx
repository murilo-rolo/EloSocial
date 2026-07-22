import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useRealtime } from '../hooks/useRealtime'
import Layout from '../components/Layout/Layout'
import PlanoAcaoCaso from '../components/caso/PlanoAcaoCaso'
import { ClipboardList } from 'lucide-react'

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: '#f59e0b', bg: '#fef3c7' },
  em_analise: { label: 'Em Analise', color: '#3b82f6', bg: '#dbeafe' },
  em_atendimento: { label: 'Em Atendimento', color: '#22c55e', bg: '#d1fae5' },
  em_acompanhamento: { label: 'Em Acompanhamento', color: '#6366f1', bg: '#e0e7ff' },
  concluido: { label: 'Concluido', color: '#6b7280', bg: '#f3f4f6' },
  cancelado: { label: 'Cancelado', color: '#ef4444', bg: '#fee2e2' },
}


function getDados(dados_acolhimento, detalhes) {
  if (dados_acolhimento && Object.keys(dados_acolhimento).length > 0) {
    return dados_acolhimento
  }
  if (detalhes) {
    try {
      return JSON.parse(detalhes)
    } catch {
      return { relato: detalhes }
    }
  }
  return null
}

export default function DashboardRequerente() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [caso, setCaso] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    loadCaso()
  }, [profile?.id])

  async function loadCaso() {
    const { data } = await supabase
      .from('triagens')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setCaso(data)
    setLoading(false)
  }

  useRealtime('dashboard-requerente', 'triagens', '*', (payload) => {
    if (payload.new?.user_id === profile?.id) {
      setCaso(prev => {
        if (!prev || payload.new.id === prev.id) {
          return payload.new
        }
        return prev
      })
    }
  })

  if (loading) {
    return (
      <Layout title="Acompanhamento">
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Carregando...
        </div>
      </Layout>
    )
  }

  if (!caso) {
    return (
      <Layout title="Acompanhamento">
        <div style={{ marginBottom: 32 }}>
          <h1 className="page-title font-serif">
            Acompanhamento <em>do Caso</em>.
          </h1>
          <p className="page-subtitle">
            Acompanhe o status do seu atendimento no CRAS.
          </p>
        </div>

        <div className="empty-state">
          <div className="icon">
            <ClipboardList size={48} />
          </div>
          <p style={{ fontSize: 16, marginBottom: 16 }}>Nenhum caso em andamento.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/acompanhamento/triagem')}
          >
            Iniciar Triagem
          </button>
        </div>
      </Layout>
    )
  }

  const status = STATUS_CONFIG[caso.status] || STATUS_CONFIG.pendente
  const dados = getDados(caso.dados_acolhimento, caso.detalhes)
  const isConcluido = caso.status === 'concluido'
  const isCancelado = caso.status === 'cancelado'
  const showEditarTriagem = !isConcluido && !isCancelado

  const motivo = dados?.motivo?.demanda_principal || dados?.motivo || '—'
  const urgencia = dados?.urgencia?.nivel || dados?.urgencia || '—'
  const telefone = dados?.contato?.telefone || '—'
  const bairro = dados?.contato?.bairro_localidade || '—'

  return (
    <Layout title="Acompanhamento">
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title font-serif">
          Acompanhamento <em>do Caso</em>.
        </h1>
        <p className="page-subtitle">
          Acompanhe o status do seu atendimento no CRAS.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <span
            className="badge"
            style={{ background: status.bg, color: status.color, fontSize: 12, padding: '4px 12px' }}
          >
            {status.label}
          </span>
          {showEditarTriagem && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/acompanhamento/triagem?editar=1')}
              style={{ marginLeft: 'auto', fontSize: 12, padding: '4px 12px' }}
            >
              Editar Triagem
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Motivo
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{motivo}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Urgencia
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{urgencia}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Telefone
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{telefone}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Bairro
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{bairro}</div>
          </div>
        </div>

        {caso.sintomas && caso.sintomas.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Sintomas
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {caso.sintomas.map((s, i) => (
                <span
                  key={i}
                  className="badge"
                  style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', fontSize: 11, padding: '3px 8px' }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
          Plano de Ação
        </h2>
        <PlanoAcaoCaso casoId={caso.id} modo="requerente" applicantId={caso.applicant_id} />
      </div>
    </Layout>
  )
}
