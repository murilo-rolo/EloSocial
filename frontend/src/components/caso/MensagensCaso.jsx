import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useRealtime } from '../../hooks/useRealtime'
import { timeAgo } from '../../utils/format'

export default function MensagensCaso({ casoId, modo }) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const sentIdsRef = useRef(new Set())

  useEffect(() => {
    if (!casoId) return
    loadMessages()
  }, [casoId])

  async function loadMessages() {
    setLoading(true)
    const { data } = await supabase
      .from('mensagens_caso')
      .select('*')
      .eq('caso_id', casoId)
      .order('created_at', { ascending: true })

    setMessages(data || [])
    sentIdsRef.current = new Set((data || []).map(m => m.id))
    setLoading(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100)
  }

  useRealtime(`chat-caso-${casoId}`, 'mensagens_caso', 'INSERT', (payload) => {
    const msg = payload.new
    if (msg.caso_id !== casoId) return
    if (sentIdsRef.current.has(msg.id)) return
    sentIdsRef.current.add(msg.id)
    setMessages(prev => [...prev, msg])
    setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100)
  })

  const sendMessage = async () => {
    if (!newMessage.trim() || !casoId) return

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      caso_id: casoId,
      remetente_id: profile?.id,
      remetente_nome: profile?.nome,
      remetente_tipo: modo,
      conteudo: newMessage.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, optimisticMsg])
    sentIdsRef.current.add(optimisticMsg.id)
    setNewMessage('')
    setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100)

    const { data, error } = await supabase.from('mensagens_caso').insert({
      caso_id: casoId,
      remetente_id: profile?.id,
      remetente_nome: profile?.nome,
      remetente_tipo: modo,
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

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Carregando mensagens...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma mensagem ainda. Envie uma mensagem!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.remetente_id === profile?.id
            return (
              <div
                key={msg.id}
                className={`chat-message ${isOwn ? 'sent' : 'received'}`}
              >
                {!isOwn && msg.remetente_nome && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 2 }}>
                    {msg.remetente_nome}
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
    </div>
  )
}
