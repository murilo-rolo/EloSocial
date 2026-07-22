import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import { formatDateTime } from '../utils/format'
import { ROLE_LABELS } from '../utils/roles'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ requerentes: 0, prontuarios: 0 })
  const [recentes, setRecentes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Basic counts
      const [req, pro] = await Promise.all([
        supabase.from('applicants').select('*', { count: 'exact', head: true }),
        supabase.from('prontuarios').select('*', { count: 'exact', head: true }),
      ])
      
      // Recent prontuarios
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
      })
      setRecentes(prontuariosComNomes)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Layout title="Dashboard"><div className="loading">Carregando métricas...</div></Layout>

  return (
    <Layout title="Dashboard Analítico">
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title font-serif">
          Dashboard <em>Analítico</em>.
        </h1>
        <p className="page-subtitle">
          Visão geral do sistema e principais métricas. Bem-vindo(a) de volta, {profile?.nome?.split(' ')[0]}!
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white' }}>
          <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Requerentes Cadastrados</div>
          <div className="stat-value" style={{ color: 'white' }}>{stats.requerentes}</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
          <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Prontuários Ativos</div>
          <div className="stat-value" style={{ color: 'white' }}>{stats.prontuarios}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--card)' }}>
          <div className="stat-label">Sua Função</div>
          <div className="stat-value" style={{ fontSize: '20px', marginTop: '8px' }}>
            {profile?.role ? ROLE_LABELS[profile.role] : 'Usuário'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Tabela de Recentes */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3>Últimos Prontuários</h3>
          </div>
          {recentes.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <div className="icon">📋</div>
              <p>Nenhum prontuário registrado.</p>
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
                      <td style={{ fontWeight: 500 }}>{r.applicants?.nome || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {r.profiles?.nome?.split(' ')[0] || '—'}
                          <span className={`badge badge-${r.profiles?.role}`}>
                            {r.profiles?.role ? ROLE_LABELS[r.profiles.role] : ''}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-light)', fontSize: '12px' }}>{formatDateTime(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}
