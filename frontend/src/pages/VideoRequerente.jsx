import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import VideoCall from '../components/video/VideoCall'
import { Video, X } from 'lucide-react'

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
  const [invitationAccepted, setInvitationAccepted] = useState(false)
  const [showInvitationModal, setShowInvitationModal] = useState(false)

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

    if (caso.status === 'em_atendimento' && caso.daily_room_url) {
      setInvitationAccepted(false)
      setShowInvitationModal(true)
    }

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
            setInvitationAccepted(false)
            setShowInvitationModal(true)
          }

          if (updated.status === 'em_acompanhamento' && !updated.daily_room_url) {
            setInvitationAccepted(false)
            setShowInvitationModal(false)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [caso?.id])

  const handleLeave = useCallback(() => {
    setInvitationAccepted(false)
    setShowInvitationModal(false)
  }, [])

  const handleEnterCall = useCallback(() => {
    setInvitationAccepted(true)
    setShowInvitationModal(false)
  }, [])

  const handleDismissInvitation = useCallback(() => {
    setShowInvitationModal(false)
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

  const hasActiveRoom = caso.status === 'em_atendimento' && caso.daily_room_url

  if (hasActiveRoom && invitationAccepted) {
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

      {hasActiveRoom && !showInvitationModal ? (
        <div className="empty-state">
          <div className="icon" style={{ color: '#22c55e' }}>
            <Video size={48} />
          </div>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            Chamada disponivel
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Seu assistente social criou uma sala de videoconferencia.
          </p>
          <button
            onClick={handleEnterCall}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              fontSize: 15,
            }}
          >
            <Video size={18} />
            Entrar na sala
          </button>
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
          </p>
        </div>
      )}

      {showInvitationModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 3000, padding: 20, backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 28,
            width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', marginBottom: 8,
            }}>
              <button
                onClick={handleDismissInvitation}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, color: 'var(--text-light)',
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="icon pulse" style={{ marginBottom: 16 }}>
              <Video size={48} style={{ color: '#22c55e' }} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
              Chamada recebida
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Seu assistente social esta chamando para uma videoconferencia.
            </p>
            <button
              onClick={handleEnterCall}
              className="btn btn-primary"
              style={{
                width: '100%', justifyContent: 'center',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', fontSize: 16,
              }}
            >
              <Video size={18} />
              Entrar
            </button>
          </div>
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
