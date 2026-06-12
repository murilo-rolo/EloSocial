import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import { formatCPF, formatDate, formatDateTime } from '../utils/format'
import { ROLE_LABELS } from '../utils/roles'

export default function RequerenteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [requerente, setRequerente] = useState(null)
  const [prontuarios, setProntuarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: req } = await supabase.from('applicants').select('*').eq('id', id).single()
      const { data: pro } = await supabase
        .from('prontuarios')
        .select('id, created_at, created_by, versao, profiles!prontuarios_created_by_fkey(nome, role)')
        .eq('applicant_id', id)
        .order('created_at', { ascending: false })
      setRequerente(req)
      setProntuarios(pro || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <Layout title="Requerente"><div className="loading">Carregando...</div></Layout>
  if (!requerente) return <Layout title="Requerente"><div className="empty-state">Requerente não encontrado.</div></Layout>

  return (
    <Layout title={requerente.nome}>
      <div className="card">
        <div className="card-header">
          <h3>Dados do Requerente</h3>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/prontuarios/novo/${id}`)}>
            + Novo Prontuário
          </button>
        </div>
        <div className="form-row">
          <div><strong>Nome:</strong> {requerente.nome}</div>
          <div><strong>CPF:</strong> {formatCPF(requerente.cpf)}</div>
          <div><strong>NIS:</strong> {requerente.nis || '—'}</div>
          <div><strong>RG:</strong> {requerente.rg || '—'}</div>
          <div><strong>Nascimento:</strong> {formatDate(requerente.data_nascimento)}</div>
          <div><strong>Sexo:</strong> {requerente.sexo || '—'}</div>
          <div><strong>Telefone:</strong> {requerente.telefone || '—'}</div>
          <div><strong>Localização:</strong> {requerente.localizacao || '—'}</div>
        </div>
        {requerente.observacoes && (
          <div style={{ marginTop: 12 }}>
            <strong>Observações:</strong> {requerente.observacoes}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Prontuários</h3>
        </div>
        {prontuarios.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>Nenhum prontuário registrado para este requerente.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Profissional</th>
                  <th>Data</th>
                  <th>Versão</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {prontuarios.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.profiles?.nome || '—'}
                      <span className={`badge badge-${p.profiles?.role}`} style={{ marginLeft: 8 }}>
                        {p.profiles?.role ? ROLE_LABELS[p.profiles.role] : ''}
                      </span>
                    </td>
                    <td>{formatDateTime(p.created_at)}</td>
                    <td>v{p.versao}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => navigate(`/prontuarios/${p.id}`)}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
