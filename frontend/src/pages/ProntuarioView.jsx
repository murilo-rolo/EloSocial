import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import { SECOES, migrarSchemaAntigo } from '../utils/prontuarioSchema'
import { ROLE_LABELS } from '../utils/roles'
import { formatDate, formatDateTime } from '../utils/format'

export default function ProntuarioView({ id: propId, isDrawer = false }) {
  const { id: paramId } = useParams()
  const id = propId || paramId
  const navigate = useNavigate()
  const [prontuario, setProntuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [uploadingAnexo, setUploadingAnexo] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // IA
  const [generatingParecer, setGeneratingParecer] = useState(false)
  const [parecerText, setParecerText] = useState(null)
  const [showParecerModal, setShowParecerModal] = useState(false)
  const [parecerFormat, setParecerFormat] = useState('padrao_suas')

  const fileInputRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('prontuarios')
        .select('*, applicants(*), profiles!prontuarios_created_by_fkey(nome, role), prontuario_anexos(*, profiles!prontuario_anexos_created_by_fkey(nome))')
        .eq('id', id)
        .single()
      if (data) {
        data.dados_json = migrarSchemaAntigo(data.dados_json || {})
      }
      setProntuario(data)
      setLoading(false)
    }
    if (id) load()
  }, [id])

  async function exportPDF() {
    setDownloading(true)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    try {
      const resp = await fetch(`${apiUrl}/api/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prontuario: prontuario.dados_json,
          requerente: prontuario.applicants,
          profissional_nome: prontuario.profiles?.nome || 'Profissional',
        }),
      })
      if (!resp.ok) {
        let detail = 'Erro ao gerar PDF'
        try { const err = await resp.json(); detail = err.detail || detail } catch (e) {}
        throw new Error(detail)
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prontuario_${prontuario.applicants?.nome?.replace(/\\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Erro ao gerar PDF: ' + err.message)
    }
    setDownloading(false)
  }

  function exportJSON() {
    const data = {
      requerente: prontuario.applicants,
      prontuario: prontuario.dados_json,
      profissional: prontuario.profiles?.nome,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prontuario_${prontuario.applicants?.nome?.replace(/\\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFileUpload(file) {
    if (!file) return
    if (file.type !== 'application/pdf') {
      return alert('Apenas arquivos PDF são permitidos.')
    }
    
    setUploadingAnexo(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      const fileExt = file.name.split('.').pop()
      const fileName = `${id}/${crypto.randomUUID()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('prontuario_anexos')
        .upload(fileName, file)
        
      if (uploadError) throw uploadError
      
      const { error: dbError } = await supabase.from('prontuario_anexos').insert({
        prontuario_id: id,
        nome_arquivo: file.name,
        caminho_storage: fileName,
        tamanho: file.size,
        created_by: user.id
      })
      
      if (dbError) throw dbError
      
      const { data } = await supabase
        .from('prontuarios')
        .select('*, applicants(*), profiles!prontuarios_created_by_fkey(nome, role), prontuario_anexos(*, profiles!prontuario_anexos_created_by_fkey(nome))')
        .eq('id', id)
        .single()
      setProntuario(data)
      alert('Anexo enviado com sucesso!')
    } catch (err) {
      alert('Erro ao enviar anexo: ' + err.message)
    } finally {
      setUploadingAnexo(false)
      if (fileInputRef.current) fileInputRef.current.value = null
    }
  }

  const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true) }
  const onDragLeave = () => setIsDragOver(false)
  const onDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  async function handleGenerateParecer() {
    setShowParecerModal(false)
    setGeneratingParecer(true)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    try {
      const resp = await fetch(`${apiUrl}/api/generate-parecer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prontuario_context: prontuario, formato: parecerFormat }),
      })
      if (!resp.ok) {
        let errorMsg = 'Erro na resposta da API'
        try { const errData = await resp.json(); errorMsg = errData.detail || errorMsg } catch(e) {}
        throw new Error(errorMsg)
      }
      const result = await resp.json()
      setParecerText(result.report)
    } catch (err) {
      alert('Erro ao gerar parecer com IA: ' + err.message)
    } finally {
      setGeneratingParecer(false)
    }
  }

  async function handleDownloadAnexo(caminho, nome) {
    try {
      const { data, error } = await supabase.storage.from('prontuario_anexos').createSignedUrl(caminho, 60)
      if (error) throw error
      
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = nome
      a.target = '_blank'
      a.click()
    } catch (err) {
      alert('Erro ao baixar anexo: ' + err.message)
    }
  }

  async function handleDeleteAnexo(anexoId, caminho) {
    if (!window.confirm('Tem certeza que deseja excluir este anexo?')) return
    try {
      await supabase.storage.from('prontuario_anexos').remove([caminho])
      await supabase.from('prontuario_anexos').delete().eq('id', anexoId)
      
      setProntuario(prev => ({
        ...prev,
        prontuario_anexos: prev.prontuario_anexos.filter(a => a.id !== anexoId)
      }))
    } catch (err) {
      alert('Erro ao excluir anexo: ' + err.message)
    }
  }

  if (loading) return isDrawer ? <div className="loading">Carregando...</div> : <Layout title="Prontuário"><div className="loading">Carregando...</div></Layout>
  if (!prontuario) return isDrawer ? <div className="empty-state">Prontuário não encontrado.</div> : <Layout title="Prontuário"><div className="empty-state">Prontuário não encontrado.</div></Layout>

  const dados = prontuario.dados_json || {}

  const content = (
    <>
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>{prontuario.applicants?.nome}</h3>
            <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
              Profissional: {prontuario.profiles?.nome}
              <span className={`badge badge-${prontuario.profiles?.role}`} style={{ marginLeft: 8 }}>
                {prontuario.profiles?.role ? ROLE_LABELS[prontuario.profiles.role] : ''}
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowParecerModal(true)} disabled={generatingParecer}>
              {generatingParecer ? '✨ Analisando...' : '✨ Documento (IA)'}
            </button>
            <button className="btn btn-success btn-sm" onClick={exportPDF} disabled={downloading}>
              {downloading ? 'Gerando...' : '📄 PDF'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={exportJSON}>
              📥 JSON
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Dados do Requerente</h3>
        </div>
        <div className="form-row">
          <div><strong>Nome:</strong> {prontuario.applicants?.nome}</div>
          <div><strong>CPF:</strong> {prontuario.applicants?.cpf || '—'}</div>
          <div><strong>NIS:</strong> {prontuario.applicants?.nis || '—'}</div>
          <div><strong>Nascimento:</strong> {formatDate(prontuario.applicants?.data_nascimento)}</div>
          <div><strong>Telefone:</strong> {prontuario.applicants?.telefone || '—'}</div>
        </div>
      </div>

      {SECOES.map((secao) => {
        const dadosSecao = dados[secao.key]
        if (!dadosSecao || (typeof dadosSecao === 'object' && !Array.isArray(dadosSecao) && Object.values(dadosSecao).every(v => !v)) ||
            (Array.isArray(dadosSecao) && dadosSecao.length === 0)) {
          return null
        }

        return (
          <div key={secao.key} className="card">
            <div className="card-header">
              <h3>{secao.icon} {secao.title}</h3>
            </div>
            {secao.key === 'composicao_familiar' ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Parentesco</th>
                      <th>Sexo</th>
                      <th>Data Nasc.</th>
                      <th>Documentação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosSecao.map((m, i) => (
                      <tr key={i}>
                        <td>{m.nome}</td>
                        <td>{m.parentesco}</td>
                        <td>{m.sexo}</td>
                        <td>{m.data_nascimento}</td>
                        <td>{m.documentacao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : secao.key === 'encaminhamentos' ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Destino</th>
                      <th>Motivo</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosSecao.map((e, i) => (
                      <tr key={i}>
                        <td>{e.destino}</td>
                        <td>{e.motivo}</td>
                        <td>{e.data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : secao.key === 'observacoes' ? (
              <p style={{ whiteSpace: 'pre-wrap' }}>{dadosSecao}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 8 }}>
                {Object.entries(dadosSecao).map(([k, v]) => (
                  v ? <div key={k}><strong>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</strong> {v}</div> : null
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="card">
        <div className="card-header">
          <h3>📎 Anexos (PDF)</h3>
        </div>
        
        <div 
          className={`drop-zone ${isDragOver ? 'dragover' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ marginBottom: 16 }}
        >
          {uploadingAnexo ? (
            <span>Enviando arquivo...</span>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <b>Arraste o PDF aqui ou clique para escolher</b>
              <p style={{ fontSize: 12, marginTop: 4 }}>Apenas arquivos PDF são permitidos</p>
            </>
          )}
          <input 
            type="file" 
            accept="application/pdf" 
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e.target.files[0])}
            disabled={uploadingAnexo}
          />
        </div>

        {prontuario.prontuario_anexos && prontuario.prontuario_anexos.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome do Arquivo</th>
                  <th>Tamanho</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {prontuario.prontuario_anexos.map((a) => (
                  <tr key={a.id}>
                    <td>{a.nome_arquivo}</td>
                    <td>{(a.tamanho / 1024 / 1024).toFixed(2)} MB</td>
                    <td>{formatDateTime(a.created_at)}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => handleDownloadAnexo(a.caminho_storage, a.nome_arquivo)} style={{ marginRight: 8 }}>Baixar</button>
                      <button className="btn btn-sm btn-outline" onClick={() => handleDeleteAnexo(a.id, a.caminho_storage)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-light)', padding: 16, textAlign: 'center' }}>Nenhum anexo encontrado.</p>
        )}
      </div>

      {prontuario.hash_assinatura && (
        <div className="card" style={{ background: '#f8f9fa' }}>
          <p style={{ fontSize: 12, color: 'var(--text-light)', wordBreak: 'break-all', margin: 0 }}>
            <strong>Assinatura digital:</strong> {prontuario.hash_assinatura}<br />
            <strong>Assinado por:</strong> {prontuario.profiles?.nome}<br />
            <strong>Em:</strong> {formatDateTime(prontuario.assinado_em)}
          </p>
        </div>
      )}

      {/* Modal de Escolha de Formato do Parecer */}
      {showParecerModal && (
        <div className="modal-overlay" onClick={() => setShowParecerModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✨ Gerar Relatório/Ofício</h3>
              <button className="modal-close" onClick={() => setShowParecerModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Qual o formato/objetivo do documento?</label>
                <select className="form-control" value={parecerFormat} onChange={(e) => setParecerFormat(e.target.value)}>
                  <option value="padrao_suas">Parecer Social Padrão (Interno)</option>
                  <option value="juridico">Ofício para Justiça (Jurídico)</option>
                  <option value="saude">Encaminhamento Médico/SUS (Saúde)</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowParecerModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleGenerateParecer}>Gerar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Parecer */}
      {parecerText && (
        <div className="modal-overlay" onClick={() => setParecerText(null)}>
          <div className="modal" style={{ maxWidth: 800 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✨ Parecer Social Gerado (IA)</h3>
              <button className="modal-close" onClick={() => setParecerText(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>
                Lembre-se: Este é um documento gerado automaticamente por Inteligência Artificial baseado no histórico do prontuário. Revise-o cuidadosamente antes de assinar.
              </p>
              <textarea 
                className="form-control" 
                style={{ height: '400px', fontSize: '14px', lineHeight: 1.6 }}
                defaultValue={parecerText}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setParecerText(null)}>Fechar</button>
              <button className="btn btn-primary" onClick={() => {
                navigator.clipboard.writeText(parecerText)
                alert('Parecer copiado para a área de transferência!')
              }}>Copiar Texto</button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  if (isDrawer) return content
  
  return (
    <Layout title={`Prontuário - ${prontuario.applicants?.nome || ''}`}>
      {content}
    </Layout>
  )
}
