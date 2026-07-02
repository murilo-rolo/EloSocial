import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [applicantsContext, setApplicantsContext] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && applicantsContext.length === 0) {
      // Fetch data for context
      const fetchData = async () => {
        const { data } = await supabase
          .from('applicants')
          .select('id, nome, bairro:endereco->>bairro, composicao_familiar')
        if (data) {
          setApplicantsContext(data)
        }
      }
      fetchData()
    }
  }, [isOpen, applicantsContext.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/search-global`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.content,
          all_applicants_context: applicantsContext,
          chat_history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })

      if (!response.ok) {
        let errorMsg = 'Falha na comunicação com a IA'
        try { const errData = await response.json(); errorMsg = errData.detail || errorMsg } catch(e) {}
        throw new Error(errorMsg)
      }
      
      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'model',
        content: data.response,
        timestamp: new Date()
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'model',
        content: `Desculpe, ocorreu um erro: ${err.message}`,
        timestamp: new Date(),
        isError: true
      }])
    } finally {
      setLoading(false)
    }
  }

  const formatText = (text) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}
        <br />
      </span>
    ))
  }

  return (
    <>
      <button 
        className="global-chat-position"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          backgroundColor: 'var(--accent)',
          color: 'white',
          border: 'none',
          boxShadow: 'var(--shadow-lg)',
          cursor: 'pointer',
          fontSize: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(0)' : 'scale(1)'
        }}
      >
        🤖
      </button>

      <div className="global-chat-position" style={{
        position: 'fixed',
        bottom: '24px',
        width: '380px',
        height: '600px',
        maxWidth: '90vw',
        maxHeight: 'calc(100vh - 48px)',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-lg)',
        display: isOpen ? 'flex' : 'none',
        flexDirection: 'column',
        zIndex: 9999,
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px',
          background: 'var(--accent)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤖 EloBot Global
            </h3>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>IA Assistente do Sistema</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '40px', fontSize: '13px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>👋</div>
              Olá! Eu sou o EloBot. Posso analisar todos os requerentes do sistema para você.<br/><br/>
              Ex: "Quais requerentes têm 3 ou mais filhos?"
            </div>
          )}
          {messages.map((m, i) => (
            <div 
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user' ? 'var(--secondary)' : 'var(--bg)',
                color: m.role === 'user' ? 'white' : 'var(--text)',
                padding: '10px 14px',
                borderRadius: '12px',
                borderBottomRightRadius: m.role === 'user' ? '4px' : '12px',
                borderBottomLeftRadius: m.role === 'model' ? '4px' : '12px',
                fontSize: '13px',
                lineHeight: '1.5',
                boxShadow: m.role === 'user' ? 'none' : 'var(--shadow-sm)',
                border: m.isError ? '1px solid var(--danger)' : 'none'
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
              <div style={{ 
                fontSize: '9px', 
                opacity: 0.7, 
                marginTop: '4px',
                textAlign: 'right'
              }}>
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-light)', fontSize: '12px', padding: '8px' }}>
              Analisando base de dados...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} style={{
          padding: '12px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '8px',
          background: 'var(--bg)'
        }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pergunte sobre os requerentes..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '24px',
              border: '1px solid var(--border)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              border: 'none',
              background: 'var(--secondary)',
              color: 'white',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !input.trim() ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ➤
          </button>
        </form>
      </div>
    </>
  )
}
