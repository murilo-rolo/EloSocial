import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import VideoCall from '../components/video/VideoCall'
import { Video, PhoneOff } from 'lucide-react'

const STATUS_LABELS = {
  pendente: 'Pendente',
  em_analise: 'Em Analise',
  em_atendimento: 'Em Atendimento',
  em_acompanhamento: 'Em Acompanhamento',
  concluido: 'Concluido',
  cancelado: 'Cancelado',
}

export default function VideoRequerente() {
  const { profile } = useAuth()
  const [caso, setCaso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ended, setEnded] = useState(false)

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

  useEffect(() => {
    if (!caso?.id) return

    const channel = supabase
      .channel(`video-caso-${caso.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'triagens',
          filter: `id=eq.${caso.id}`,
        },
        (payload) => {
          const updated = payload.new
          setCaso(updated)

          if (updated.status === 'em_atendimento' && updated.daily_room_url) {
            setEnded(false)
          }

          if (updated.status === 'em_acompanhamento' && !updated.daily_room_url) {
            setEnded(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [caso?.id])

  const handleLeave = useCallback(() => {
    setEnded(true)
  }, [])

  if (loading) {
    return (
      <Layout title="Video Atendimento">
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Carregando...
        </div>
      </Layout>
    )
  }

  if (!caso) {
    return (
      <Layout title="Video Atendimento">
        <div style={{ marginBottom: 32 }}>
          <h1 className="page-title font-serif">
            Video <em>Atendimento</em>.
          </h1>
          <p className="page-subtitle">
            Aguarde o link de videochamada do seu assistente social.
          </p>
        </div>

        <div className="empty-state">
          <div className="icon">
            <Video size={48} />
          </div>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            Nenhum caso em andamento.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Inicie uma triagem para poder participar de uma videochamada.
          </p>
        </div>
      </Layout>
    )
  }

  const isInCall = caso.status === 'em_atendimento' && caso.daily_room_url && !ended

  if (isInCall) {
    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
            Video Atendimento
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Caso #{caso.id.slice(0, 8)}
          </span>
        </div>
        <VideoCall roomUrl={caso.daily_room_url} onLeave={handleLeave} />
      </div>
    )
  }

  return (
    <Layout title="Video Atendimento">
      <div style={{ marginBottom: 16 }}>
        <h1 className="page-title font-serif">
          Video <em>Atendimento</em>.
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
              background: caso.status === 'em_atendimento' ? '#dcfce7' : caso.status === 'pendente' ? '#fef3c7' : '#dbeafe',
              color: caso.status === 'em_atendimento' ? '#166534' : caso.status === 'pendente' ? '#92400e' : '#1e40af',
            }}
          >
            {STATUS_LABELS[caso.status] || caso.status}
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

      {ended ? (
        <div className="empty-state">
          <div className="icon">
            <PhoneOff size={48} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            Chamada encerrada.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Sua videochamada foi finalizada. Aguarde um novo convite do seu assistente social.
          </p>
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon pulse">
            <Video size={48} />
          </div>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            Aguardando atendimento...
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Seu assistente social ira iniciar a videochamada em breve.
            <br />
            Voce sera conectado automaticamente.
          </p>
        </div>
      )}

      <style>{`
        .pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </Layout>
  )
}
