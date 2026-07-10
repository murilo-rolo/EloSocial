import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import { ETAPAS } from '../utils/triagemOptions'
import { calcularPrioridade, gerarSintomas, gerarDetalhes } from '../utils/triagemScoring'
import EtapaContato from '../components/triagem/EtapaContato'
import EtapaFamilia from '../components/triagem/EtapaFamilia'
import EtapaMotivo from '../components/triagem/EtapaMotivo'
import EtapaUrgencia from '../components/triagem/EtapaUrgencia'
import EtapaRelato from '../components/triagem/EtapaRelato'

const INITIAL_DATA = {
  contato: {
    telefone: '',
    idade: '',
    cartao_sus_nis: '',
    bairro_localidade: '',
    ponto_referencia: '',
    territorio_cras: '',
  },
  familia: {
    composicao_familiar: '',
    renda_familiar: '',
    beneficios_sociais: [],
    outros_beneficios: '',
  },
  motivo: {
    demanda_principal: '',
    outra_demanda: '',
  },
  urgencia: {
    nivel: '',
    situacoes: [],
    outra_situacao: '',
  },
  relato: '',
}

const STEP_COMPONENTS = [EtapaContato, EtapaFamilia, EtapaMotivo, EtapaUrgencia, EtapaRelato]

export default function TriagemSocial() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditing = searchParams.get('editar') === '1'

  const [step, setStep] = useState(0)
  const [data, setData] = useState(INITIAL_DATA)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [triagemId, setTriagemId] = useState(null)

  useEffect(() => {
    if (isEditing && profile?.id) {
      loadExisting()
    } else {
      setInitialLoad(false)
    }
  }, [isEditing, profile?.id])

  async function loadExisting() {
    const { data: existing } = await supabase
      .from('triagens')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing?.dados_acolhimento && Object.keys(existing.dados_acolhimento).length > 0) {
      setData({
        ...INITIAL_DATA,
        ...existing.dados_acolhimento,
        contato: { ...INITIAL_DATA.contato, ...(existing.dados_acolhimento.contato || {}) },
        familia: { ...INITIAL_DATA.familia, ...(existing.dados_acolhimento.familia || {}) },
        motivo: { ...INITIAL_DATA.motivo, ...(existing.dados_acolhimento.motivo || {}) },
        urgencia: { ...INITIAL_DATA.urgencia, ...(existing.dados_acolhimento.urgencia || {}) },
      })
      setTriagemId(existing.id)
    }
    setInitialLoad(false)
  }

  function validate(stepIndex) {
    const newErrors = {}

    if (stepIndex === 0) {
      if (!data.contato.telefone?.trim()) newErrors.telefone = 'Telefone e obrigatorio'
      if (!data.contato.idade?.trim()) newErrors.idade = 'Idade e obrigatoria'
      if (!data.contato.bairro_localidade?.trim()) newErrors.bairro_localidade = 'Bairro e obrigatorio'
      if (!data.contato.territorio_cras) newErrors.territorio_cras = 'Selecione o CRAS'
    }

    if (stepIndex === 2) {
      if (!data.motivo.demanda_principal) newErrors.demanda_principal = 'Selecione o motivo da busca'
    }

    if (stepIndex === 3) {
      if (!data.urgencia.nivel) newErrors.nivel = 'Selecione o nivel de urgencia'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (!validate(step)) return
    setErrors({})
    setStep(prev => Math.min(prev + 1, ETAPAS.length - 1))
  }

  function handlePrev() {
    setErrors({})
    setStep(prev => Math.max(prev - 1, 0))
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const { prioridade } = calcularPrioridade(data)
      const sintomas = gerarSintomas(data)
      const detalhes = gerarDetalhes(data)

      const payload = {
        user_id: profile.id,
        dados_acolhimento: data,
        detalhes,
        sintomas,
        prioridade,
        status: 'pendente',
      }

      if (triagemId) {
        await supabase.from('triagens').update(payload).eq('id', triagemId)
      } else {
        await supabase.from('triagens').insert(payload)
      }

      navigate('/acompanhamento', { replace: true })
    } catch (err) {
      alert('Erro ao salvar triagem: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (initialLoad) {
    return (
      <Layout title="Triagem Social">
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Carregando...
        </div>
      </Layout>
    )
  }

  const StepComponent = STEP_COMPONENTS[step]
  const isLastStep = step === ETAPAS.length - 1
  const progress = ((step + 1) / ETAPAS.length) * 100

  return (
    <Layout title="Triagem Social">
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title font-serif">
          Triagem <em>Social</em>.
        </h1>
        <p className="page-subtitle">
          {isEditing ? 'Edite os dados da sua triagem.' : 'Preencha os dados para iniciar seu atendimento.'}
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Etapa {step + 1} de {ETAPAS.length}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {ETAPAS[step].nome}
          </span>
        </div>
        <div style={{
          height: 6,
          background: 'var(--bg-surface-hover)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'var(--accent)',
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {ETAPAS.map((e, i) => (
            <span
              key={e.id}
              style={{
                fontSize: 11,
                fontWeight: i === step ? 600 : 400,
                color: i <= step ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {e.nome}
            </span>
          ))}
        </div>
      </div>

      <div className="card" style={{ minHeight: 300 }}>
        <StepComponent data={data} onChange={setData} errors={errors} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <button
          className="btn btn-outline"
          onClick={handlePrev}
          disabled={step === 0}
          style={{ opacity: step === 0 ? 0.5 : 1 }}
        >
          Voltar
        </button>

        {isLastStep ? (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Salvando...' : isEditing ? 'Salvar Alteracoes' : 'Enviar Triagem'}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleNext}
          >
            Proximo
          </button>
        )}
      </div>
    </Layout>
  )
}
