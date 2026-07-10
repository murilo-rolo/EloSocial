import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import MensagensCaso from '../components/caso/MensagensCaso'
import { MessageSquare } from 'lucide-react'

export default function ChatCaso() {
  const { profile } = useAuth()
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

  if (loading) {
    return (
      <Layout title="Mensagens">
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Carregando...
        </div>
      </Layout>
    )
  }

  if (!caso) {
    return (
      <Layout title="Mensagens">
        <div style={{ marginBottom: 32 }}>
          <h1 className="page-title font-serif">
            Mensagens <em>do Caso</em>.
          </h1>
          <p className="page-subtitle">
            Comunique-se com seu assistente social.
          </p>
        </div>

        <div className="empty-state">
          <div className="icon">
            <MessageSquare size={48} />
          </div>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            Nenhum caso em andamento.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Inicie uma triagem para poder conversar com seu assistente social.
          </p>
        </div>
      </Layout>
    )
  }

  const statusLabel = {
    pendente: 'Pendente',
    em_analise: 'Em Analise',
    em_atendimento: 'Em Atendimento',
    em_acompanhamento: 'Em Acompanhamento',
    concluido: 'Concluido',
    cancelado: 'Cancelado',
  }

  return (
    <Layout title="Mensagens">
      <div style={{ marginBottom: 16 }}>
        <h1 className="page-title font-serif">
          Mensagens <em>do Caso</em>.
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Caso #{caso.id.slice(0, 8)}
          </span>
          <span
            className="badge"
            style={{
              fontSize: 11,
              padding: '2px 8px',
              background: caso.status === 'concluido' ? '#f3f4f6' : '#dbeafe',
              color: caso.status === 'concluido' ? '#6b7280' : '#1d4ed8',
            }}
          >
            {statusLabel[caso.status] || caso.status}
          </span>
          {caso.prioridade && (
            <span
              className="badge"
              style={{
                fontSize: 11,
                padding: '2px 8px',
                background: caso.prioridade === 'ALTA' ? '#fee2e2' : caso.prioridade === 'MEDIA' ? '#fef3c7' : '#d1fae5',
                color: caso.prioridade === 'ALTA' ? '#dc2626' : caso.prioridade === 'MEDIA' ? '#d97706' : '#16a34a',
              }}
            >
              {caso.prioridade}
            </span>
          )}
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: 0,
          height: 'calc(100vh - 220px)',
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <MensagensCaso casoId={caso.id} modo="requerente" />
      </div>
    </Layout>
  )
}
