import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import DocumentosCaso from '../components/caso/DocumentosCaso'
import { FolderOpen } from 'lucide-react'

export default function CofreDigital() {
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
      <Layout title="Cofre Digital">
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Carregando...
        </div>
      </Layout>
    )
  }

  if (!caso) {
    return (
      <Layout title="Cofre Digital">
        <div style={{ marginBottom: 32 }}>
          <h1 className="page-title font-serif">
            Cofre <em>Digital</em>.
          </h1>
          <p className="page-subtitle">
            Envie e gerencie documentos do seu caso.
          </p>
        </div>

        <div className="empty-state">
          <div className="icon">
            <FolderOpen size={48} />
          </div>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            Nenhum caso em andamento.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Inicie uma triagem para enviar documentos ao seu caso.
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Cofre Digital">
      <div style={{ marginBottom: 16 }}>
        <h1 className="page-title font-serif">
          Cofre <em>Digital</em>.
        </h1>
        <p className="page-subtitle">
          Envie e gerencie documentos vinculados ao seu caso.
        </p>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <DocumentosCaso casoId={caso.id} modo="requerente" />
      </div>
    </Layout>
  )
}
