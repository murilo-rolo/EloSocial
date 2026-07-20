import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'

export default function Welcome() {
  const { profile } = useAuth()

  return (
    <Layout title="Início">
      <h1 className="page-title font-serif">
        Bem vindo, <em>{profile?.nome}</em>!
      </h1>
    </Layout>
  )
}
