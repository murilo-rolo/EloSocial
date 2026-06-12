import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import { SECOES } from '../utils/prontuarioSchema'
import { ROLE_LABELS } from '../utils/roles'
import { formatDate, formatDateTime } from '../utils/format'

export default function ProntuarioView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prontuario, setProntuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('prontuarios')
        .select('*, applicants(*), profiles!prontuarios_created_by_fkey(nome, role), atendimentos(*, profiles!atendimentos_profissional_id_fkey(nome))')
        .eq('id', id)
        .single()
      setProntuario(data)
      setLoading(false)
    }
    load()
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
          atendimentos: (prontuario.atendimentos || []).map(a => ({
            ...a,
            profissional_nome: a.profiles?.nome || '',
          })),
        }),
      })
      if (!resp.ok) throw new Error('Erro ao gerar PDF')
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prontuario_${prontuario.applicants?.nome?.replace(/\s+/g, '_')}.pdf`
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
      atendimentos: prontuario.atendimentos,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prontuario_${prontuario.applicants?.nome?.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <Layout title="Prontuário"><div className="loading">Carregando...</div></Layout>
  if (!prontuario) return <Layout title="Prontuário"><div className="empty-state">Prontuário não encontrado.</div></Layout>

  const dados = prontuario.dados_json || {}

  return (
    <Layout title={`Prontuário - ${prontuario.applicants?.nome || ''}`}>
      <div className="card">
        <div className="card-header">
          <div>
            <h3>{prontuario.applicants?.nome}</h3>
            <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
              Profissional: {prontuario.profiles?.nome}
              <span className={`badge badge-${prontuario.profiles?.role}`} style={{ marginLeft: 8 }}>
                {prontuario.profiles?.role ? ROLE_LABELS[prontuario.profiles.role] : ''}
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success btn-sm" onClick={exportPDF} disabled={downloading}>
              {downloading ? 'Gerando...' : '📄 Exportar PDF'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={exportJSON}>
              📥 Exportar JSON
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

      {prontuario.atendimentos?.length > 0 && (
        <div className="card">
          <div className="card-header"><h3>📅 Histórico de Atendimentos</h3></div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Profissional</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {prontuario.atendimentos.map((a) => (
                  <tr key={a.id}>
                    <td>{formatDateTime(a.data_atendimento)}</td>
                    <td>{a.tipo_atendimento}</td>
                    <td>{a.profiles?.nome || '—'}</td>
                    <td>{a.descricao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {prontuario.hash_assinatura && (
        <div className="card" style={{ background: '#f8f9fa' }}>
          <p style={{ fontSize: 12, color: 'var(--text-light)', wordBreak: 'break-all' }}>
            <strong>Assinatura digital:</strong> {prontuario.hash_assinatura}<br />
            <strong>Assinado por:</strong> {prontuario.profiles?.nome}<br />
            <strong>Em:</strong> {formatDateTime(prontuario.assinado_em)}
          </p>
        </div>
      )}
    </Layout>
  )
}
