import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import { formatDateTime } from '../utils/format'
import { ROLE_LABELS } from '../utils/roles'
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ requerentes: 0, prontuarios: 0, atendimentos: 0 })
  const [recentes, setRecentes] = useState([])
  const [locData, setLocData] = useState([])
  const [loading, setLoading] = useState(true)

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  useEffect(() => {
    async function load() {
      // Basic counts
      const [req, pro, ate] = await Promise.all([
        supabase.from('applicants').select('*', { count: 'exact', head: true }),
        supabase.from('prontuarios').select('*', { count: 'exact', head: true }),
        supabase.from('atendimentos').select('*', { count: 'exact', head: true }),
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

      // Get location distribution (urbano vs rural)
      const { data: applicantsData } = await supabase.from('applicants').select('localizacao')
      const locCounts = (applicantsData || []).reduce((acc, curr) => {
        const loc = curr.localizacao || 'Não informado'
        acc[loc] = (acc[loc] || 0) + 1
        return acc
      }, {})
      
      const pieData = Object.keys(locCounts).map(k => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        value: locCounts[k]
      }))

      setStats({
        requerentes: req.count || 0,
        prontuarios: pro.count || 0,
        atendimentos: ate.count || 0,
      })
      setRecentes(prontuariosComNomes)
      setLocData(pieData)
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
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white' }}>
          <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Atendimentos Realizados</div>
          <div className="stat-value" style={{ color: 'white' }}>{stats.atendimentos}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--card)' }}>
          <div className="stat-label">Sua Função</div>
          <div className="stat-value" style={{ fontSize: '20px', marginTop: '8px' }}>
            {profile?.role ? ROLE_LABELS[profile.role] : 'Usuário'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Gráfico */}
        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3>Distribuição por Localização</h3>
          </div>
          <div style={{ flex: 1, minHeight: '250px' }}>
            {locData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={locData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {locData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} pessoas`, 'Total']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '20px' }}>Sem dados suficientes</div>
            )}
          </div>
          {locData.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
              {locData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></div>
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

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
