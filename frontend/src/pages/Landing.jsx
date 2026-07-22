import { Link } from 'react-router-dom'
import { Heart, Shield, Brain, Video, FolderLock, Calendar, ArrowRight, Users } from 'lucide-react'
import LandingHeader from '../components/LandingHeader'

const features = [
  {
    icon: Heart,
    title: 'Prontuário Eletrônico',
    desc: 'Registro digital completo com histórico, documentos e evolução do atendimento.',
  },
  {
    icon: Shield,
    title: 'Triagem Social',
    desc: 'Classificação inteligente de demandas com wizard guiado para profissionais.',
  },
  {
    icon: Brain,
    title: 'Chat com IA',
    desc: 'Assistente virtual que responde dúvidas sobre a legislação e práticas do SUAS.',
  },
  {
    icon: Video,
    title: 'Videoconferência',
    desc: 'Atendimentos remotos integrados para acompanhamento de famílias.',
  },
  {
    icon: FolderLock,
    title: 'Cofre Digital',
    desc: 'Armazenamento seguro e criptografado de documentos sensíveis.',
  },
  {
    icon: Calendar,
    title: 'Agenda',
    desc: 'Gerenciamento de agendamentos com notificações e acompanhamento.',
  },
]

export default function Landing() {
  return (
    <div className="landing-page">
      <LandingHeader />

      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-badge">Prontuário Eletrônico SUAS</div>
          <h1 className="landing-hero-title font-serif">
            Gestão inteligente para<br />
            <span style={{ color: 'var(--accent)' }}>assistência social</span>
          </h1>
          <p className="landing-hero-subtitle">
            O EloSocial conecta profissionais, famílias e dados em uma plataforma segura
            e intuitiva para o atendimento do Serviço Único de Assistência Social.
          </p>
          <div className="landing-hero-actions">
            <Link to="/login" className="landing-btn-primary">
              Acessar Sistema
              <ArrowRight size={18} />
            </Link>
            <a href="#funcionalidades" className="landing-btn-secondary">
              Conheça as funcionalidades
            </a>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="landing-features">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <h2 className="landing-section-title font-serif">Funcionalidades</h2>
            <p className="landing-section-subtitle">
              Tudo que sua equipe precisa em um só lugar.
            </p>
          </div>
          <div className="landing-features-grid">
            {features.map((f) => (
              <div key={f.title} className="landing-feature-card">
                <div className="landing-feature-icon">
                  <f.icon size={28} />
                </div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="quem-somos" className="landing-about">
        <div className="landing-section-inner">
          <div className="landing-about-content">
            <div className="landing-about-text">
              <h2 className="landing-section-title font-serif">Quem Somos</h2>
              <p>
                O EloSocial é uma plataforma open-source desenvolvida para fortalecer
                a capacidade tecnológica do SUAS (Serviço Único de Assistência Social).
              </p>
              <p>
                Nosso objetivo é facilitar o trabalho dos assistentes sociais, psicólogos
                e demais profissionais que atuam na proteção social, oferecendo ferramentas
                digitais que respeitam a rotina do CREAS e CRAS.
              </p>
              <p>
                Com prontuário eletrônico, triagem assistida por IA, videoconferência
                e armazenamento seguro de documentos, o EloSocial promove atendimentos
                mais eficientes e humanizados.
              </p>
            </div>
            <div className="landing-about-visual">
              <div className="landing-about-card">
                <Users size={32} style={{ color: 'var(--accent)' }} />
                <div>
                  <div className="landing-about-stat">CRAS & CREAS</div>
                  <div className="landing-about-label">Atendimentos integrados</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contato" className="landing-footer">
        <div className="landing-section-inner">
          <div className="landing-footer-inner">
            <div className="landing-footer-brand">
              <Heart size={20} style={{ color: 'var(--accent)' }} />
              <span>EloSocial</span>
            </div>
            <p className="landing-footer-text">
              Prontuário Eletrônico SUAS — Gestão inteligente para assistência social.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
