import { useState } from 'react'
import Layout from '../components/Layout/Layout'
import { useAuth } from '../hooks/useAuth'
import { isRequerente } from '../utils/roles'
import { HelpCircle, ChevronDown, ChevronRight, LayoutDashboard, Calendar, Users, FileText, Bot, MessageSquare, Video, BookOpen, User, Settings, ClipboardList, ListTodo, FolderOpen, Video as VideoIcon } from 'lucide-react'

const professionalSections = [
  { title: 'Dashboard', icon: LayoutDashboard, description: 'Visão geral do sistema com estatísticas de atendimentos, prontuários recentes e gráficos de desempenho. Acesse rapidamente os dados mais importantes do seu dia a dia.' },
  { title: 'Agenda', icon: Calendar, description: 'Gerencie seus atendimentos, sessões e visitas domiciliares. Visualize sua agenda do dia, semana ou mês e registre novos compromissos.' },
  { title: 'Requerentes', icon: Users, description: 'Busque, cadastre e gerencie requerentes. Acesse o histórico completo de atendimentos e prontuários de cada pessoa atendida.' },
  { title: 'Prontuário', icon: FileText, description: 'Fichas de atendimento com 13 seções detalhadas (identificação, composição familiar, habitacional, educação, trabalho, saúde, benefícios, convivência, participação, violência, encaminhamentos, observações). Exporte em PDF ou JSON.' },
  { title: 'Chat IA', icon: Bot, description: 'Assistente inteligente que responde perguntas sobre o prontuário do requerente, sugere encaminhamentos e ajuda na análise de vulnerabilidade.' },
  { title: 'Mensagens', icon: MessageSquare, description: 'Chat em tempo real entre profissionais da equipe. Comunique-se sobre casos, compartilhe informações e coordene atendimentos.' },
  { title: 'Videoconferência', icon: VideoIcon, description: 'Realize atendimentos por vídeo com requerentes ou equipe técnica. Salas públicas ou privadas com código de acesso.' },
  { title: 'Base de Conhecimento', icon: BookOpen, description: 'Upload e gestão de documentos (PDFs) para a base de conhecimento da IA. Quanto mais documentos, melhor as respostas do Copiloto.' },
  { title: 'Perfil', icon: User, description: 'Visualize e edite seus dados pessoais, senha e informações de perfil.' },
  { title: 'Admin', icon: Settings, description: '(Apenas Gerente) Gerencie usuários do sistema, crie novas contas, atribua CRAS e monitore a auditoria de ações.' },
]

const requesterSections = [
  { title: 'Dashboard', icon: LayoutDashboard, description: 'Acompanhe o status do seu atendimento, veja próximas ações e receba notificações importantes da equipe técnica.' },
  { title: 'Triagem', icon: ClipboardList, description: 'Visualize sua avaliação de vulnerabilidade. A IA analisa suas respostas e indica o nível de prioridade do seu caso.' },
  { title: 'Mensagens', icon: MessageSquare, description: 'Converse em tempo real com a equipe técnica responsável pelo seu atendimento. Envie dúvidas, documentos e atualizações.' },
  { title: 'Video', icon: VideoIcon, description: 'Participe de videochamadas com profissionais. Acesse salas de atendimento por vídeo de forma segura e simples.' },
  { title: 'Plano de Ação', icon: ListTodo, description: 'Acompanhe as etapas do seu plano de ação social. Veja tarefas, prazos e progresso do seu acompanhamento.' },
  { title: 'Cofre Digital', icon: FolderOpen, description: 'Armazene e acesse seus documentos de forma segura. Anexe RG, CPF, comprovantes e outros arquivos importantes ao seu prontuário.' },
]

function AccordionItem({ title, icon: Icon, description, isOpen, onToggle }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left', color: 'var(--text)',
          fontSize: 16, fontWeight: 600,
        }}
      >
        <Icon size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{title}</span>
        {isOpen ? <ChevronDown size={18} style={{ color: 'var(--text-light)' }} /> : <ChevronRight size={18} style={{ color: 'var(--text-light)' }} />}
      </button>
      {isOpen && (
        <div style={{ padding: '0 20px 20px 52px' }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-light)' }}>
            {description}
          </p>
          <div style={{
            marginTop: 16, border: '2px dashed var(--border)', borderRadius: 8,
            padding: 32, textAlign: 'center', color: 'var(--text-light)', fontSize: 13,
          }}>
            Screenshot da página aqui
          </div>
        </div>
      )}
    </div>
  )
}

export default function Ajuda() {
  const { profile } = useAuth()
  const [openIndex, setOpenIndex] = useState(null)

  const sections = isRequerente(profile?.role) ? requesterSections : professionalSections

  const handleToggle = (index) => {
    setOpenIndex(prev => prev === index ? null : index)
  }

  return (
    <Layout title="Ajuda">
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title font-serif">
          <HelpCircle size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent)' }} />
          Central de <em>Ajuda</em>.
        </h1>
        <p className="page-subtitle">
          Confira abaixo a descrição de cada página do sistema. Clique em uma seção para expandir.
        </p>
      </div>

      <div>
        {sections.map((section, index) => (
          <AccordionItem
            key={section.title}
            title={section.title}
            icon={section.icon}
            description={section.description}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>
    </Layout>
  )
}
