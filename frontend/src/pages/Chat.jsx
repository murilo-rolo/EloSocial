import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useRealtime } from '../hooks/useRealtime'
import Layout from '../components/Layout/Layout'
import { ROLE_LABELS } from '../utils/roles'
import { timeAgo } from '../utils/format'

export default function Chat() {
  const { profile } = useAuth()
  const [contacts, setContacts] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    async function loadContacts() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', profile?.id)
        .order('nome')
      setContacts(data || [])
      setLoading(false)
    }
    loadContacts()
  }, [profile?.id])

  useEffect(() => {
    if (!selectedId) return
    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(remetente_id.eq.${profile?.id},destinatario_id.eq.${selectedId}),and(remetente_id.eq.${selectedId},destinatario_id.eq.${profile?.id})`)
        .order('created_at', { ascending: true })
      setMessages(data || [])
      setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100)
    }
    loadMessages()
  }, [selectedId, profile?.id])

  useRealtime('chat', 'messages', 'INSERT', (payload) => {
    const msg = payload.new
    if (
      (msg.remetente_id === selectedId && msg.destinatario_id === profile?.id) ||
      (msg.remetente_id === profile?.id && msg.destinatario_id === selectedId)
    ) {
      setMessages(prev => [...prev, msg])
      setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100)
    }
  })

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedId) return
    const { error } = await supabase.from('messages').insert({
      remetente_id: profile?.id,
      destinatario_id: selectedId,
      conteudo: newMessage.trim(),
    })
    if (!error) setNewMessage('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const selectedContact = contacts.find(c => c.id === selectedId)

  return (
    <Layout title="Mensagens">
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title font-serif">
          Mensagens <em>da Equipe</em>.
        </h1>
        <p className="page-subtitle">
          Comunique-se com outros profissionais e gerentes do CRAS.
        </p>
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
                <p>Nenhum contato disponível.</p>
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
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`chat-message ${msg.remetente_id === profile?.id ? 'sent' : 'received'}`}
                    >
                      <div>{msg.conteudo}</div>
                      <div className="time">{timeAgo(msg.created_at)}</div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-area">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button onClick={sendMessage} disabled={!newMessage.trim()}>
                  ➤
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="icon" style={{ fontSize: 48 }}>💬</div>
              <p>Selecione um contato para começar a conversar.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
