import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import ReactMarkdown from 'react-markdown'
import { FileText, Users, Bot } from 'lucide-react'

export default function ChatIA() {
  const [applicants, setApplicants] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loadingApplicants, setLoadingApplicants] = useState(true)
  
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [prontuarioContext, setProntuarioContext] = useState(null)
  
  const messagesEndRef = useRef(null)

  // 1. Carregar lista de requerentes
  useEffect(() => {
    async function loadApplicants() {
      const { data, error } = await supabase
        .from('applicants')
        .select('id, nome, cpf')
        .order('nome')
        
      if (!error && data) {
        setApplicants(data)
      }
      setLoadingApplicants(false)
    }
    loadApplicants()
  }, [])

  // 2. Carregar contexto completo do requerente selecionado
  useEffect(() => {
    if (!selectedId) return

    async function loadContext() {
      // Busca requerente
      const { data: applicant } = await supabase
        .from('applicants')
        .select('*')
        .eq('id', selectedId)
        .single()
        
      // Busca prontuários
      const { data: prontuarios } = await supabase
        .from('prontuarios')
        .select('*')
        .eq('applicant_id', selectedId)
        .order('data_atendimento', { ascending: false })

      setProntuarioContext({
        applicants: applicant,
        prontuarios: prontuarios || []
      })
      
      // Reseta o chat quando muda de requerente
      setMessages([
        { 
          role: 'model', 
          content: `Olá! Sou o **Copiloto SUAS**. Estou conectado aos dados de **${applicant.nome}**. O que você gostaria de analisar ou saber sobre este caso?` 
        }
      ])
    }
    loadContext()
  }, [selectedId])

  // 3. Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 4. Enviar mensagem para a IA
  async function handleSend(e) {
    if (e) e.preventDefault()
    if (!input.trim() || loading || !selectedId) return

    const userMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/chat-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: newMessages.slice(1, -1), // Remove a msg inicial e a atual
          prontuario_context: prontuarioContext,
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
      setMessages(prev => [...prev, { role: 'model', content: `**Erro:** ${error.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const selectedApplicant = applicants.find(a => a.id === selectedId)

  return (
    <Layout title="Chat IA">
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title font-serif">
          Chat <em>IA</em>.
        </h1>
        <p className="page-subtitle">
          Selecione um requerente para iniciar a análise assistida por Inteligência Artificial.
        </p>
      </div>

      <div className="chat-container">
        {/* Coluna da Esquerda: Lista de Requerentes */}
        <div className="chat-list" style={{ width: 320 }}>
          <div className="chat-list-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} /> Pacientes / Requerentes ({applicants.length})
          </div>
          <div className="chat-list-items">
            {applicants.map((a) => (
              <div
                key={a.id}
                className={`chat-list-item ${selectedId === a.id ? 'active' : ''}`}
                onClick={() => setSelectedId(a.id)}
              >
                <div className="name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {a.nome}
                </div>
                <div className="preview">
                  {a.cpf ? `CPF: ${a.cpf}` : 'Sem CPF'}
                </div>
              </div>
            ))}
            {applicants.length === 0 && !loadingApplicants && (
              <div className="empty-state">
                <p>Nenhum paciente cadastrado.</p>
              </div>
            )}
            {loadingApplicants && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-light)', fontSize: 14 }}>
                Carregando...
              </div>
            )}
          </div>
        </div>

        {/* Coluna da Direita: Chat com a IA */}
        <div className="chat-window">
          {selectedApplicant ? (
            <>
              <div className="chat-window-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Bot size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>Copiloto SUAS</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                      Foco: <strong style={{ color: 'var(--text-primary)' }}>{selectedApplicant.nome}</strong>
                    </div>
                  </div>
                </div>
                <div className="badge badge-outline" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                  Conectado ao Dossiê
                </div>
              </div>
              
              <div className="chat-messages" style={{ background: '#fafafa' }}>
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <p>Iniciando inteligência artificial...</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`chat-message ${msg.role === 'user' ? 'sent' : 'received'}`}
                      style={{ 
                        maxWidth: '80%', 
                        boxShadow: 'var(--shadow-sm)',
                        padding: '12px 16px',
                        border: msg.role === 'model' ? '1px solid var(--border)' : 'none'
                      }}
                    >
                      {msg.role === 'model' ? (
                        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                          <ReactMarkdown
                            components={{
                              p: ({node, ...props}) => <p style={{margin: '0 0 10px 0'}} {...props} />,
                              ul: ({node, ...props}) => <ul style={{margin: '0 0 10px 20px'}} {...props} />,
                              li: ({node, ...props}) => <li style={{marginBottom: 4}} {...props} />,
                              strong: ({node, ...props}) => <strong style={{color: 'var(--text-primary)'}} {...props} />,
                              a: ({node, ...props}) => <a style={{color: 'var(--secondary)', textDecoration: 'underline'}} target="_blank" {...props} />
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  ))
                )}
                
                {loading && (
                  <div className="chat-message received" style={{ padding: '12px 16px', border: '1px solid var(--border)', background: 'white' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-light)', fontSize: 14 }}>
                      Analisando dados do paciente
                      <span style={{ animation: 'blink 1.4s infinite both' }}>.</span>
                      <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}>.</span>
                      <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}>.</span>
                      <style>{`@keyframes blink { 0% {opacity:.2} 20% {opacity:1} 100% {opacity:.2} }`}</style>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-area" style={{ background: 'white', padding: '16px 20px' }}>
                <input
                  type="text"
                  placeholder={`Pergunte ao Copiloto sobre ${selectedApplicant.nome.split(' ')[0]}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  style={{ borderRadius: 24, padding: '12px 20px', background: 'var(--bg)' }}
                />
                <button 
                  onClick={handleSend} 
                  disabled={!input.trim() || loading}
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: '50%',
                    opacity: input.trim() && !loading ? 1 : 0.5,
                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div className="icon" style={{ fontSize: 56, color: 'var(--secondary)', opacity: 0.8, marginBottom: 16 }}>
                <Bot size={56} />
              </div>
              <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>Selecione um Paciente</h3>
              <p style={{ maxWidth: 300, margin: '0 auto', lineHeight: 1.6 }}>
                Para a IA acessar corretamente os dados, histórico e documentos aplicáveis, selecione o paciente no menu à esquerda.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
