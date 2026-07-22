import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import PlanoAcaoCaso from '../components/caso/PlanoAcaoCaso'
import { ClipboardList } from 'lucide-react'

export default function PlanoAcao() {
  const { profile } = useAuth()
  const [caso, setCaso] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    loadCaso()
  }, [profile?.id])

  async function loadCaso() {
    const { data } = await supabase
      .from('triagens')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setCaso(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <Layout title="Plano de Acao">
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Carregando...
        </div>
      </Layout>
    )
  }

  if (!caso) {
    return (
      <Layout title="Plano de Acao">
        <div style={{ marginBottom: 32 }}>
          <h1 className="page-title font-serif">
            Plano de <em>Acao</em>.
          </h1>
          <p className="page-subtitle">
            Acompanhe as tarefas do seu caso.
          </p>
        </div>

        <div className="empty-state">
          <div className="icon">
            <ClipboardList size={48} />
          </div>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            Nenhum caso em andamento.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Inicie uma triagem para ver o plano de acao do seu caso.
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Plano de Acao">
      <div style={{ marginBottom: 16 }}>
        <h1 className="page-title font-serif">
          Plano de <em>Acao</em>.
        </h1>
        <p className="page-subtitle">
          Acompanhe e atualize as tarefas do seu caso.
        </p>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <PlanoAcaoCaso casoId={caso.id} modo="requerente" applicantId={caso.applicant_id} />
      </div>
    </Layout>
  )
}
