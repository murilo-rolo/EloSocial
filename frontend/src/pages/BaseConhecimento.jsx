import { useState, useEffect } from 'react'
import Layout from '../components/Layout/Layout'
import { BookOpen, Upload, Search, FileText, Trash2, FileUp } from 'lucide-react'
import { useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function BaseConhecimento() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
      const res = await fetch(`${apiUrl}/api/rag/documents`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      alert("Por favor, selecione ou arraste um arquivo PDF/TXT.")
      return
    }
    if (!title) return
    setUploading(true)

    try {
      const storagePath = `${Date.now()}-${file.name}`
      const { error: storageError } = await supabase.storage
        .from('conhecimento_uploads')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      if (storageError) {
        console.error(storageError)
        throw new Error('Falha ao enviar arquivo para o storage.')
      }

      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
      const res = await fetch(`${apiUrl}/api/rag/upload_from_storage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          storage_path: storagePath,
          user_id: user?.id || null
        })
      })
      if (!res.ok) {
        throw new Error('Falha no upload')
      }
      
      setTitle('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setShowModal(false)
      fetchDocuments()
      alert('Documento processado, vetorizado e salvo com sucesso!')
    } catch (e) {
      alert('Erro ao fazer upload do documento.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id, titleStr) => {
    if (!window.confirm(`Tem certeza que deseja apagar o documento "${titleStr}"? Esta ação excluirá todos os vetores associados.`)) return
    
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
      const res = await fetch(`${apiUrl}/api/rag/documents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao deletar')
      fetchDocuments()
    } catch (e) {
      alert('Erro ao deletar documento.')
    }
  }

  return (
    <Layout title="Base de Conhecimento">
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">
          Base de <em>Conhecimento IA</em>.
        </h1>
        <p className="page-subtitle">
          Alimente a IA com manuais, leis e normativas do SUAS. O Assistente usará esses documentos para embasar suas respostas.
        </p>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar documentos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ padding: '8px 16px', borderRadius: 24 }}>
          <Upload size={18} style={{ marginRight: 8 }} /> Adicionar Documento
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading" style={{ padding: 40 }}>Carregando documentos...</div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><BookOpen size={40} strokeWidth={1} /></div>
            <p>Nenhum documento na base de conhecimento.</p>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 8 }}>Faça o upload do primeiro manual para alimentar o cérebro da IA.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>Documento</th>
                  <th>Data de Inclusão</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase())).map((d) => (
                  <tr key={d.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <div className="cell-inline">
                        <div className="cell-avatar" style={{ background: '#eff6ff', color: '#3b82f6' }}><FileText size={20} /></div>
                        <div className="cell-text">
                          <span className="name">{d.title}</span>
                          <span className="meta">ID: {d.id.split('-')[0]}...</span>
                        </div>
                      </div>
                    </td>
                    <td>{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
                        <span className="badge badge-risco-baixo" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>Vetorizado</span>
                        <button 
                          onClick={() => handleDelete(d.id, d.title)} 
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                          title="Remover documento"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20, backdropFilter: 'blur(4px)'
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 32,
            width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto',
            boxShadow: 'var(--shadow-lg)'
          }} onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow">UPLOAD PARA A IA</div>
            <h2 className="font-serif" style={{ marginBottom: 24, fontSize: 24, color: 'var(--text-primary)' }}>
              Novo Documento de <em>Referência</em>
            </h2>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Título do Documento (Ex: Cartilha do BPC)</label>
                <input 
                  className="form-control" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Arquivo (PDF ou TXT)</label>
                <div 
                  style={{ 
                    border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`, 
                    borderRadius: 12, padding: 40, textAlign: 'center', 
                    background: isDragging ? '#eff6ff' : '#f8fafc', 
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    transition: 'all 0.2s'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f && (f.type === 'application/pdf' || f.type === 'text/plain')) {
                      setFile(f);
                      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
                    } else {
                      alert("Apenas arquivos PDF ou TXT são suportados.");
                    }
                  }}
                >
                  <FileUp size={32} color="var(--accent)" opacity={0.7} />
                  {file ? (
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{file.name}</strong>
                      <span style={{ fontSize: 13, color: 'var(--text-light)' }}>Arquivo selecionado ({Math.round(file.size / 1024)} KB)</span>
                    </div>
                  ) : (
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text)' }}>Clique para selecionar ou arraste o arquivo aqui</strong>
                      <span style={{ fontSize: 13, color: 'var(--text-light)' }}>Suporta .PDF e .TXT</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="application/pdf,text/plain"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files[0]
                    if (f) {
                      setFile(f)
                      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, "")) // auto-fill title
                    }
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} style={{ borderRadius: 20 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={uploading} style={{ borderRadius: 20, paddingLeft: 24, paddingRight: 24 }}>
                  {uploading ? 'Processando e Vetorizando...' : 'Salvar Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
