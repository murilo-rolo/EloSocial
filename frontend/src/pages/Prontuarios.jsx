import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import { ROLE_LABELS } from '../utils/roles'
import { formatDateTime } from '../utils/format'

export default function Prontuarios() {
  const navigate = useNavigate()
  const [prontuarios, setProntuarios] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('prontuarios')
      .select('id, created_at, created_by, applicant_id, versao')
      .order('created_at', { ascending: false })

    const enriched = await Promise.all(
      (data || []).map(async (p) => {
        const [req, pro] = await Promise.all([
          supabase.from('applicants').select('nome, cpf').eq('id', p.applicant_id).single(),
          supabase.from('profiles').select('nome, role').eq('id', p.created_by).single(),
        ])
        return { ...p, applicants: req.data, profiles: pro.data }
      })
    )

    const filtered = search
      ? enriched.filter((p) =>
          p.applicants?.nome?.toLowerCase().includes(search.toLowerCase()) ||
          p.applicants?.cpf?.includes(search)
        )
      : enriched

    setProntuarios(filtered)
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  return (
    <Layout title="Prontuários">
      <div className="card">
        <div className="card-header">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nome do requerente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : prontuarios.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>Nenhum prontuário encontrado.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Requerente</th>
                  <th>CPF</th>
                  <th>Profissional</th>
                  <th>Data</th>
                  <th>Versão</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {prontuarios.map((p) => (
                  <tr key={p.id} onClick={() => navigate(`/prontuarios/${p.id}`)} style={{ cursor: 'pointer' }}>
                    <td><strong>{p.applicants?.nome || '—'}</strong></td>
                    <td>{p.applicants?.cpf || '—'}</td>
                    <td>
                      {p.profiles?.nome || '—'}
                      <span className={`badge badge-${p.profiles?.role}`} style={{ marginLeft: 8 }}>
                        {p.profiles?.role ? ROLE_LABELS[p.profiles.role] : ''}
                      </span>
                    </td>
                    <td>{formatDateTime(p.created_at)}</td>
                    <td>v{p.versao}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); navigate(`/prontuarios/${p.id}`) }}>
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
