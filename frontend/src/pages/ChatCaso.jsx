import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useRealtime } from '../hooks/useRealtime'
import Layout from '../components/Layout/Layout'
import { ROLE_LABELS } from '../utils/roles'
import { timeAgo } from '../utils/format'
import { MessageSquare } from 'lucide-react'

export default function ChatCaso() {
  const { profile } = useAuth()
  const [caso, setCaso] = useState(null)
  const [contacts, setContacts] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const sentIdsRef = useRef(new Set())

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
    loadContacts()
  }, [caso?.id])

  async function loadContacts() {
    const { data: msgs } = await supabase
      .from('mensagens_caso')
      .select('remetente_id')
      .eq('caso_id', caso.id)
      .neq('remetente_id', profile?.id)

    if (!msgs || msgs.length === 0) {
      setContacts([])
      return
    }

    const uniqueIds = [...new Set(msgs.map(m => m.remetente_id))]

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', uniqueIds)

    setContacts(profiles || [])
  }

  useEffect(() => {
    if (!selectedId || !caso?.id) return
    loadMessages()
  }, [selectedId, caso?.id])

  async function loadMessages() {
    sentIdsRef.current = new Set()
    const { data } = await supabase
      .from('mensagens_caso')
      .select('*, profiles!mensagens_caso_remetente_id_fkey(role, nome)')
      .eq('caso_id', caso.id)
      .or(`remetente_id.eq.${selectedId},and(remetente_id.eq.${profile?.id},destinatario_id.eq.${selectedId})`)
      .order('created_at', { ascending: true })

    setMessages(data || [])
    sentIdsRef.current = new Set((data || []).map(m => m.id))
    setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100)
  }

  useRealtime(`chat-caso-${caso?.id}`, 'mensagens_caso', 'INSERT', (payload) => {
    const msg = payload.new
    if (msg.caso_id !== caso?.id) return
    if (sentIdsRef.current.has(msg.id)) return
    sentIdsRef.current.add(msg.id)

    if (msg.remetente_id === selectedId) {
      setMessages(prev => [...prev, msg])
      setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100)
    }

    if (msg.remetente_id !== profile?.id && !contacts.find(c => c.id === msg.remetente_id)) {
      supabase.from('profiles').select('*').eq('id', msg.remetente_id).single()
        .then(({ data }) => {
          if (data) setContacts(prev => [...prev, data])
        })
    }
  })

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedId || !caso?.id) return

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      caso_id: caso.id,
      remetente_id: profile?.id,
      remetente_nome: profile?.nome,
      remetente_tipo: 'requerente',
      destinatario_id: selectedId,
      conteudo: newMessage.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, optimisticMsg])
    sentIdsRef.current.add(optimisticMsg.id)
    setNewMessage('')
    setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100)

    const { data, error } = await supabase.from('mensagens_caso').insert({
      caso_id: caso.id,
      remetente_id: profile?.id,
      remetente_nome: profile?.nome,
      remetente_tipo: 'requerente',
      destinatario_id: selectedId,
      conteudo: newMessage.trim(),
    }).select().single()

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      sentIdsRef.current.delete(optimisticMsg.id)
      return
    }

    sentIdsRef.current.delete(optimisticMsg.id)
    sentIdsRef.current.add(data.id)
    setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data : m))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const selectedContact = contacts.find(c => c.id === selectedId)

  const statusLabel = {
    pendente: 'Pendente',
    em_analise: 'Em Analise',
    em_atendimento: 'Em Atendimento',
    em_acompanhamento: 'Em Acompanhamento',
    concluido: 'Concluido',
    cancelado: 'Cancelado',
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

      <div className="chat-container">
        <div className="chat-list">
          <div className="chat-list-header">Contatos</div>
          <div className="chat-list-items">
            {contacts.map((c) => (
              <div
                key={c.id}
                className={`chat-list-item ${selectedId === c.id ? 'active' : ''}`}
                onClick={() => setSelectedId(c.id)}
              >
                <div className="name">{c.nome}</div>
                <div className="preview">
                  <span className={`badge badge-${c.role}`}>{ROLE_LABELS[c.role]}</span>
                </div>
              </div>
            ))}
            {contacts.length === 0 && !loading && (
              <div className="empty-state">
                <p>Nenhum contato ainda.</p>
              </div>
            )}
          </div>
        </div>

        <div className="chat-window">
          {selectedContact ? (
            <>
              <div className="chat-window-header">
                {selectedContact.nome}
                <span className={`badge badge-${selectedContact.role}`} style={{ marginLeft: 8 }}>
                  {ROLE_LABELS[selectedContact.role]}
                </span>
              </div>
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <p>Nenhuma mensagem ainda. Envie uma mensagem!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.remetente_id === profile?.id
                    const senderProfile = msg.profiles
                    return (
                      <div
                        key={msg.id}
                        className={`chat-message ${isOwn ? 'sent' : 'received'}`}
                      >
                        {!isOwn && msg.remetente_nome && (
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 2 }}>
                            {msg.remetente_nome}
                            {senderProfile?.role && (
                              <span style={{ fontWeight: 400, marginLeft: 6, opacity: 0.7 }}>
                                · {ROLE_LABELS[senderProfile.role] || senderProfile.role}
                              </span>
                            )}
                          </div>
                        )}
                        <div>{msg.conteudo}</div>
                        <div className="time">{timeAgo(msg.created_at)}</div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-area">
                <textarea
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  style={{
                    flex: 1,
                    resize: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 14,
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="btn btn-primary btn-sm"
                >
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="icon" style={{ fontSize: 48 }}>💬</div>
              <p>Selecione um contato para comecar a conversar.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
