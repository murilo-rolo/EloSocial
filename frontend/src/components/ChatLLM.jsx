import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

export default function ChatLLM({ prontuarioContext }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [useRag, setUseRag] = useState(false)
  const endOfMessagesRef = useRef(null)

  // Scroll para a última mensagem
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Limpa o chat se mudar o contexto (ex: usuário diferente)
  useEffect(() => {
    setMessages([{ role: 'model', content: 'Olá! Sou seu assistente de Inteligência Artificial. Como posso ajudar com os dados deste requerente?' }])
  }, [prontuarioContext])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      let finalContext = { ...prontuarioContext }

      if (useRag) {
        // Query the vector DB first
        const ragRes = await fetch(`${apiUrl}/api/rag/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userMessage.content, match_threshold: 0.5, match_count: 3 })
        })
        if (ragRes.ok) {
          const ragData = await ragRes.json()
          if (ragData.matches && ragData.matches.length > 0) {
            finalContext.base_conhecimento = ragData.matches.map(m => m.chunk_text)
          }
        }
      }

      const response = await fetch(`${apiUrl}/api/chat-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: newMessages.slice(1, -1),
          prontuario_context: finalContext,
        }),
      })

      if (!response.ok) {
        let errorMsg = 'Falha ao comunicar com a IA'
        try {
          const errData = await response.json()
          errorMsg = errData.detail || errorMsg
        } catch(e) {}
        throw new Error(errorMsg)
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'model', content: data.response }])
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { role: 'model', content: `Erro: ${error.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            fontSize: 24,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s'
          }}
          title="Falar com IA"
        >
          ✨
        </button>
      )}

      {isOpen && (
        <div className="slide-over-overlay" onClick={() => setIsOpen(false)}>
          <div 
            className={`slide-over-panel ${isOpen ? 'open' : ''}`}
            style={{ width: '450px', maxWidth: '100vw', background: '#f8f9fa' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              background: 'var(--primary)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 10
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                  ✨ Copiloto SUAS
                </h3>
                {prontuarioContext?.applicants && (
                  <span style={{ fontSize: 12, opacity: 0.8, display: 'block', marginTop: 4 }}>
                    Contexto: {prontuarioContext.applicants.nome}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: 28 }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ padding: '8px 24px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input 
                type="checkbox" 
                id="use-rag-toggle" 
                checked={useRag}
                onChange={(e) => setUseRag(e.target.checked)}
              />
              <label htmlFor="use-rag-toggle" style={{ color: 'var(--text-light)', cursor: 'pointer' }}>
                Consultar Manuais do SUAS (Base de Conhecimento)
              </label>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'var(--primary)' : 'white',
                  color: msg.role === 'user' ? 'white' : 'var(--text)',
                  padding: '12px 16px',
                  borderRadius: 12,
                  borderBottomRightRadius: msg.role === 'user' ? 2 : 12,
                  borderBottomLeftRadius: msg.role === 'model' ? 2 : 12,
                  maxWidth: '90%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: msg.role === 'model' ? '1px solid var(--border)' : 'none',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}>
                  {msg.role === 'model' ? (
                    <ReactMarkdown 
                      components={{
                        p: ({node, ...props}) => <p style={{margin: '0 0 8px 0'}} {...props} />,
                        a: ({node, ...props}) => <a style={{color: 'var(--secondary)'}} target="_blank" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', background: 'white', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text-light)', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ animation: 'blink 1.4s infinite both' }}>.</span>
                  <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}>.</span>
                  <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}>.</span>
                  <style>{`@keyframes blink { 0% {opacity:.2} 20% {opacity:1} 100% {opacity:.2} }`}</style>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              background: 'white',
              display: 'flex',
              gap: 12,
              boxShadow: '0 -2px 10px rgba(0,0,0,0.02)'
            }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Faça uma pergunta sobre o histórico..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 24,
                  border: '1px solid var(--border)',
                  outline: 'none',
                  fontSize: 14,
                  background: 'var(--bg)'
                }}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                style={{
                  background: 'var(--secondary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  opacity: input.trim() && !loading ? 1 : 0.5,
                  transition: 'background 0.2s'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
