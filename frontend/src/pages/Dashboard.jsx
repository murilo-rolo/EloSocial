import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import { formatDateTime } from '../utils/format'
import { ROLE_LABELS } from '../utils/roles'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ requerentes: 0, prontuarios: 0, atendimentos: 0 })
  const [recentes, setRecentes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [req, pro, ate] = await Promise.all([
        supabase.from('applicants').select('*', { count: 'exact', head: true }),
        supabase.from('prontuarios').select('*', { count: 'exact', head: true }),
        supabase.from('atendimentos').select('*', { count: 'exact', head: true }),
      ])
      const { data: rec } = await supabase
        .from('prontuarios')
        .select('id, created_at, created_by, applicant_id')
        .order('created_at', { ascending: false })
        .limit(5)
      const prontuariosComNomes = await Promise.all(
        (rec || []).map(async (p) => {
          const [reqRes, proRes] = await Promise.all([
            supabase.from('applicants').select('nome').eq('id', p.applicant_id).single(),
            supabase.from('profiles').select('nome, role').eq('id', p.created_by).single(),
          ])
          return { ...p, applicants: reqRes.data, profiles: proRes.data }
        })
      )

      setStats({
        requerentes: req.count || 0,
        prontuarios: pro.count || 0,
        atendimentos: ate.count || 0,
      })
      setRecentes(prontuariosComNomes)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Layout title="Dashboard"><div className="loading">Carregando...</div></Layout>

  return (
    <Layout title="Dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.requerentes}</div>
          <div className="stat-label">Requerentes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.prontuarios}</div>
          <div className="stat-label">Prontuários</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.atendimentos}</div>
          <div className="stat-label">Atendimentos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile?.nome?.split(' ')[0]}</div>
          <div className="stat-label">{profile?.role ? ROLE_LABELS[profile.role] : ''}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Prontuários Recentes</h3>
        </div>
        {recentes.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>Nenhum prontuário registrado ainda.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Requerente</th>
                  <th>Profissional</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {recentes.map((r) => (
                  <tr key={r.id}>
                    <td>{r.applicants?.nome || '—'}</td>
                    <td>
                      {r.profiles?.nome || '—'}
                      <span className={`badge badge-${r.profiles?.role}`} style={{ marginLeft: 8 }}>
                        {r.profiles?.role ? ROLE_LABELS[r.profiles.role] : ''}
                      </span>
                    </td>
                    <td>{formatDateTime(r.created_at)}</td>
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
