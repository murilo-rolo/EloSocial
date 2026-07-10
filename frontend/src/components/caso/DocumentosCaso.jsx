import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useRealtime } from '../../hooks/useRealtime'
import { formatDate } from '../../utils/format'
import { Upload, Download, Trash2, FileText, File } from 'lucide-react'

const MAX_SIZE = 10 * 1024 * 1024

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_')
}

function getFileIcon(tipo) {
  if (tipo?.startsWith('image/')) return <File size={20} style={{ color: '#3b82f6' }} />
  if (tipo?.includes('pdf')) return <FileText size={20} style={{ color: '#ef4444' }} />
  return <File size={20} style={{ color: 'var(--text-secondary)' }} />
}

export default function DocumentosCaso({ casoId, modo }) {
  const { profile } = useAuth()
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!casoId) return
    loadDocuments()
  }, [casoId])

  async function loadDocuments() {
    setLoading(true)
    const { data } = await supabase
      .from('documentos_caso')
      .select('*')
      .eq('caso_id', casoId)
      .order('created_at', { ascending: false })
    setDocumentos(data || [])
    setLoading(false)
  }

  useRealtime(`docs-caso-${casoId}`, 'documentos_caso', '*', (payload) => {
    if (payload.eventType === 'INSERT') {
      setDocumentos(prev => [payload.new, ...prev])
    } else if (payload.eventType === 'DELETE') {
      setDocumentos(prev => prev.filter(d => d.id !== payload.old?.id))
    }
  })

  async function handleUpload(file) {
    if (!file) return
    if (file.size > MAX_SIZE) {
      alert('Arquivo muito grande. Limite: 10MB.')
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const safeName = sanitizeName(file.name)
      const storagePath = `${casoId}/${timestamp}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('documentos-caso')
        .upload(storagePath, file)

      if (uploadError) throw uploadError

      const { error: dbError } = await supabase.from('documentos_caso').insert({
        caso_id: casoId,
        nome: file.name,
        tipo: file.type || 'application/octet-stream',
        tamanho: file.size,
        storage_path: storagePath,
        uploaded_by: profile?.id,
        uploaded_by_tipo: modo,
        descricao: descricao.trim() || null,
      })

      if (dbError) throw dbError

      setDescricao('')
      if (fileInputRef.current) fileInputRef.current.value = null
    } catch (err) {
      alert('Erro ao enviar documento: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true) }
  const onDragLeave = () => setIsDragOver(false)
  const onDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files?.length > 0) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  async function handleDownload(doc) {
    try {
      const { data, error } = await supabase.storage
        .from('documentos-caso')
        .createSignedUrl(doc.storage_path, 60)
      if (error) throw error

      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = doc.nome
      a.target = '_blank'
      a.click()
    } catch (err) {
      alert('Erro ao baixar documento: ' + err.message)
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Excluir "${doc.nome}"?`)) return
    try {
      await supabase.storage.from('documentos-caso').remove([doc.storage_path])
      await supabase.from('documentos_caso').delete().eq('id', doc.id)
      setDocumentos(prev => prev.filter(d => d.id !== doc.id))
    } catch (err) {
      alert('Erro ao excluir documento: ' + err.message)
    }
  }

  function canDelete(doc) {
    if (modo === 'assistente') return true
    return doc.uploaded_by === profile?.id
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Carregando documentos...
      </div>
    )
  }

  return (
    <div>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          background: isDragOver ? 'var(--accent-muted)' : 'transparent',
          marginBottom: 16,
        }}
      >
        <Upload size={24} style={{ color: 'var(--text-secondary)', marginBottom: 8 }} />
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
          {uploading ? 'Enviando...' : 'Arraste um arquivo ou clique para selecionar'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Maximo 10MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => handleUpload(e.target.files?.[0])}
          disabled={uploading}
        />
      </div>

      <div className="form-group" style={{ marginBottom: 16 }}>
        <input
          type="text"
          className="form-control"
          placeholder="Descricao do documento (opcional)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          disabled={uploading}
        />
      </div>

      {documentos.length === 0 ? (
        <div className="empty-state" style={{ padding: 24 }}>
          <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Nenhum documento enviado.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {documentos.map(doc => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
              }}
            >
              {getFileIcon(doc.tipo)}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.nome}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>{formatSize(doc.tamanho)}</span>
                  <span>{formatDate(doc.created_at)}</span>
                  <span style={{ textTransform: 'capitalize' }}>{doc.uploaded_by_tipo || '—'}</span>
                  {doc.descricao && <span style={{ fontStyle: 'italic' }}>"{doc.descricao}"</span>}
                </div>
              </div>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleDownload(doc)}
                title="Baixar"
              >
                <Download size={14} />
              </button>

              {canDelete(doc) && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleDelete(doc)}
                  title="Excluir"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
