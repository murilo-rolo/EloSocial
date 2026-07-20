import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'

export default function Welcome() {
  const { profile } = useAuth()

  return (
    <Layout title="Início">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
      }}>
        <h1 className="page-title font-serif" style={{ fontSize: 36 }}>
          Bem vindo, <em>{profile?.nome}</em>!
        </h1>
      </div>
    </Layout>
  )
}
