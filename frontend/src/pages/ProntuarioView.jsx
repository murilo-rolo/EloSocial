import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import { SECOES, migrarSchemaAntigo } from '../utils/prontuarioSchema'
import { ROLE_LABELS } from '../utils/roles'
import { formatDate, formatDateTime } from '../utils/format'

function _hasEspecificidade(v) {
  if (typeof v === 'boolean') return v
  if (typeof v === 'object' && v) return v.ativo
  return false
}

function RenderSection({ secaoKey, dados, fullDados }) {
  if (secaoKey === 'composicao_familiar') {
    return (
      <div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Parentesco</th>
                <th>Sexo</th>
                <th>Data Nasc.</th>
                <th>Documentação</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((m, i) => (
                <tr key={i}>
                  <td>{m.nome}</td>
                  <td>{m.parentesco}</td>
                  <td>{m.sexo}</td>
                  <td>{m.data_nascimento}</td>
                  <td>{(m.documentacao || []).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {fullDados?.perfil_etario && (
          <div style={{ marginTop: 12 }}>
            <strong>Perfil Etário</strong>
            <div className="table-container" style={{ marginTop: 4 }}>
              <table>
                <thead>
                  <tr>
                    <th>0 a 6</th><th>7 a 14</th><th>15 a 17</th><th>18 a 29</th>
                    <th>30 a 59</th><th>60 a 64</th><th>65 a 69</th><th>70+</th><th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{fullDados.perfil_etario['0_a_6']}</td>
                    <td>{fullDados.perfil_etario['7_a_14']}</td>
                    <td>{fullDados.perfil_etario['15_a_17']}</td>
                    <td>{fullDados.perfil_etario['18_a_29']}</td>
                    <td>{fullDados.perfil_etario['30_a_59']}</td>
                    <td>{fullDados.perfil_etario['60_a_64']}</td>
                    <td>{fullDados.perfil_etario['65_a_69']}</td>
                    <td>{fullDados.perfil_etario['70_mais']}</td>
                    <td><strong>{fullDados.perfil_etario.total}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        {fullDados?.especificidades_sociais && Object.values(fullDados.especificidades_sociais).some(_hasEspecificidade) && (
          <div style={{ marginTop: 8 }}>
            <strong>Especificidades Sociais:</strong>
            <ul style={{ margin: '4px 0 0 16px' }}>
              {Object.entries(fullDados.especificidades_sociais).filter(([, v]) => typeof v === 'boolean' && v).map(([k]) => (
                <li key={k}>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</li>
              ))}
              {Object.entries(fullDados.especificidades_sociais).filter(([, v]) => typeof v === 'object' && v?.ativo).map(([k, v]) => (
                <li key={k}>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}{v.etnia ? ` — ${v.etnia}` : ''}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  if (secaoKey === 'identificacao') {
    const simpleFields = ['logradouro', 'numero', 'complemento', 'bairro', 'municipio', 'uf', 'cep', 'apelido', 'localizacao_domicilio', 'tipo_unidade', 'nome_unidade', 'forma_ingresso', 'motivo_primeiro_atendimento', 'orgao_encaminhador']
    const progs = dados.programas_sociais
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 8 }}>
          {simpleFields.map(k => dados[k] ? <div key={k}><strong>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</strong> {dados[k]}</div> : null)}
        </div>
        {progs && Object.values(progs).some(p => p?.ativo) && (
          <div style={{ marginTop: 8 }}>
            <strong>Programas Sociais:</strong>
            <ul style={{ margin: '4px 0 0 16px' }}>
              {Object.entries(progs).filter(([, v]) => v?.ativo).map(([k, v]) => (
                <li key={k}>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}{v.valor ? ` — R$ ${v.valor}` : ''}{k === 'outros' && v.descricao ? ` (${v.descricao})` : ''}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  if (secaoKey === 'habitacional') {
    const fields = [
      ['tipo_residencia', 'Tipo de Residência'],
      ['material_paredes', 'Material das Paredes'],
      ['energia_eletrica', 'Energia Elétrica'],
      ['agua_canalizada', 'Água Canalizada'],
      ['abastecimento_agua', 'Abastecimento de Água'],
      ['escoamento_sanitario', 'Escoamento Sanitário'],
      ['coleta_lixo', 'Coleta de Lixo'],
      ['total_comodos', 'Total de Cômodos'],
      ['dormitorios', 'Dormitórios'],
      ['pessoas_por_dormitorio', 'Pessoas por Dormitório'],
      ['area_risco', 'Área de Risco'],
      ['acesso_dificil', 'Acesso Difícil'],
      ['conflito_violencia', 'Conflito/Violência'],
    ]
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 8 }}>
        {fields.map(([k, label]) => {
          const v = dados[k]
          return v || v === 0 ? <div key={k}><strong>{label}:</strong> {v === 0 ? '0' : v}</div> : null
        })}
      </div>
    )
  }

  if (secaoKey === 'educacional') {
    return (
      <div>
        {dados.vulnerabilidades && Object.values(dados.vulnerabilidades).some(v => v) && (
          <div>
            <strong>Vulnerabilidades Educacionais</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginTop: 4 }}>
              {Object.entries(dados.vulnerabilidades).filter(([, v]) => v).map(([k, v]) => (
                <div key={k}><strong>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</strong> {v}</div>
              ))}
            </div>
          </div>
        )}
        {dados.membros?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <strong>Membros</strong>
            <div className="table-container">
              <table>
                <thead><tr><th>Nome</th><th>Idade</th><th>Sabe Ler</th><th>Frequenta Escola</th><th>Escolaridade</th></tr></thead>
                <tbody>
                  {dados.membros.map((m, i) => (
                    <tr key={i}>
                      <td>{m.nome}</td><td>{m.idade}</td><td>{m.sabe_ler || '—'}</td><td>{m.frequenta_escola || '—'}</td><td>{m.escolaridade || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {dados.condicionalidades_bf?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <strong>Condicionalidades Bolsa Família</strong>
            <div className="table-container">
              <table>
                <thead><tr><th>Mês/Ano</th><th>Efeito</th></tr></thead>
                <tbody>
                  {dados.condicionalidades_bf.map((c, i) => (
                    <tr key={i}><td>{c.mes_ano || '—'}</td><td>{c.efeito || '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (secaoKey === 'trabalho_renda') {
    const rendaFields = [
      ['renda_total_sem_programas', 'Renda Total sem Programas'],
      ['renda_per_capita_sem_programas', 'Renda Per Capita sem Programas'],
      ['renda_total_com_programas', 'Renda Total com Programas'],
      ['renda_per_capita_com_programas', 'Renda Per Capita com Programas'],
      ['aposentados', 'Aposentados'],
    ]
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 8 }}>
          {rendaFields.map(([k, label]) => dados[k] ? <div key={k}><strong>{label}:</strong> R$ {dados[k]}</div> : null)}
        </div>
        {dados.membros?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <strong>Membros</strong>
            <div className="table-container">
              <table>
                <thead><tr><th>Nome</th><th>Idade</th><th>CTPS</th><th>Ocupação</th><th>Qualificação</th><th>Renda</th></tr></thead>
                <tbody>
                  {dados.membros.map((m, i) => (
                    <tr key={i}>
                      <td>{m.nome}</td><td>{m.idade}</td>
                      <td>{m.possui_ctps || '—'}</td><td>{m.condicao_ocupacao || '—'}</td>
                      <td>{m.possui_qualificacao === 'S' ? (m.qualificacao || 'Sim') : (m.possui_qualificacao || '—')}</td>
                      <td>{m.renda_mensal ? `R$ ${m.renda_mensal}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (secaoKey === 'saude') {
    return (
      <div>
        {dados.deficiencias?.length > 0 && (
          <div>
            <strong>Deficiências</strong>
            <div className="table-container">
              <table>
                <thead><tr><th>Nome</th><th>Tipos</th><th>Cuidador</th></tr></thead>
                <tbody>
                  {dados.deficiencias.map((d, i) => (
                    <tr key={i}>
                      <td>{d.nome}</td>
                      <td>{(d.tipos || []).join(', ')}</td>
                      <td>{d.necessita_cuidador === 'Sim' ? `Sim — ${d.responsavel_cuidador || ''}` : (d.necessita_cuidador || '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {[
          { key: 'pessoa_necessita_cuidados', label: 'Pessoa que necessita de cuidados' },
          { key: 'inseguranca_alimentar', label: 'Insegurança Alimentar' },
          { key: 'doencas_graves', label: 'Doenças Graves' },
          { key: 'remedios_controlados', label: 'Remédios Controlados' },
          { key: 'uso_alcool', label: 'Uso de Álcool' },
          { key: 'uso_drogas', label: 'Uso de Drogas' },
        ].map(({ key, label }) => {
          const item = dados[key]
          if (!item || !item.resposta) return null
          return (
            <div key={key} style={{ marginTop: 4 }}>
              <strong>{label}:</strong> {item.resposta === 'Sim' ? 'Sim' : 'Não'}
              {item.resposta === 'Sim' && Object.entries(item).filter(([k]) => k !== 'resposta').filter(([, v]) => v).map(([k, v]) => (
                <span key={k}> — {k.replace(/_/g, ' ')}: {v}</span>
              ))}
            </div>
          )
        })}
        {dados.gestantes?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <strong>Gestantes</strong>
            <div className="table-container">
              <table>
                <thead><tr><th>Nome</th><th>Meses</th><th>Pré-natal</th><th>Data</th></tr></thead>
                <tbody>
                  {dados.gestantes.map((g, i) => (
                    <tr key={i}>
                      <td>{g.nome}</td><td>{g.meses_gestacao}</td>
                      <td>{g.pre_natal || '—'}</td><td>{g.data_anotacao || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (secaoKey === 'beneficios') {
    if (!dados.registros?.length) return null
    return (
      <div className="table-container">
        <table>
          <thead><tr><th>Data</th><th>Tipo</th><th>Observação</th></tr></thead>
          <tbody>
            {dados.registros.map((b, i) => (
              <tr key={i}>
                <td>{b.data || '—'}</td>
                <td>{b.tipo || '—'}</td>
                <td>{b.observacao || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (secaoKey === 'convivencia') {
    const simNaoKeys = [
      { key: 'dependentes_sozinhos', label: 'Dependentes ficam sozinhos' },
      { key: 'discriminacao', label: 'Discriminação na comunidade' },
      { key: 'rede_apoio_parentes', label: 'Rede de apoio (parentes)' },
      { key: 'rede_apoio_vizinhos', label: 'Rede de apoio (vizinhos)' },
      { key: 'grupos_religiosos_comunitarios', label: 'Grupos religiosos/comunitários' },
      { key: 'lazer_crianca', label: 'Lazer para crianças' },
      { key: 'lazer_idoso', label: 'Lazer para idosos' },
    ]
    return (
      <div>
        {simNaoKeys.map(({ key, label }) => {
          const item = dados[key]
          if (!item || !item.resposta) return null
          return (
            <div key={key} style={{ marginTop: 2 }}>
              <strong>{label}:</strong> {item.resposta}{item.observacao ? ` — ${item.observacao}` : ''}
            </div>
          )
        })}
        {dados.tempo_residencia && (
          <div style={{ marginTop: 8 }}>
            <strong>Tempo de Residência</strong>
            {['estado', 'municipio', 'bairro'].map(local => {
              const t = dados.tempo_residencia[local]
              if (!t || (!t.anos && !t.sempre)) return null
              return <div key={local}>{local.charAt(0).toUpperCase() + local.slice(1)}: {t.sempre ? 'Sempre morou' : `${t.anos} anos`}</div>
            })}
          </div>
        )}
        {['relacoes_conjugais', 'relacoes_pais_filhos', 'relacoes_irmaos'].map(section => {
          const items = dados[section]
          if (!items?.length) return null
          return (
            <div key={section} style={{ marginTop: 8 }}>
              <strong>{section.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</strong>
              <div className="table-container">
                <table>
                  <thead><tr><th>Técnico</th><th>Data</th><th>Avaliação</th></tr></thead>
                  <tbody>
                    {items.map((r, i) => (
                      <tr key={i}><td>{r.tecnico || '—'}</td><td>{r.data || '—'}</td><td>{r.avaliacao || '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
        {dados.outros_conflitos && <div style={{ marginTop: 4 }}><strong>Outros Conflitos:</strong> {dados.outros_conflitos}</div>}
      </div>
    )
  }

  if (secaoKey === 'violencia') {
    return (
      <div>
        {dados.quadro1?.length > 0 && (
          <div>
            <strong>Quadro 1 — Tipos de Violência</strong>
            <div className="table-container">
              <table>
                <thead><tr><th>Tipo</th><th>Persiste</th><th>Data</th></tr></thead>
                <tbody>
                  {dados.quadro1.map((q, i) => (
                    q.tipo || q.persiste ? <tr key={i}><td>{q.tipo || '—'}</td><td>{q.persiste || '—'}</td><td>{q.data_anotacao || '—'}</td></tr> : null
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {dados.quadro2_creas?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <strong>Quadro 2 — Acompanhamento CREAS</strong>
            <div className="table-container">
              <table>
                <thead><tr><th>Data Início</th><th>Data Fim</th><th>Identificação CREAS</th></tr></thead>
                <tbody>
                  {dados.quadro2_creas.map((q, i) => (
                    <tr key={i}><td>{q.data_inicio || '—'}</td><td>{q.data_fim || '—'}</td><td>{q.identificacao_creas || '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {dados.quadro3_creas?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <strong>Quadro 3 — Situações (CREAS)</strong>
            <div className="table-container">
              <table>
                <thead><tr><th>Ordem/Pessoa</th><th>Código</th><th>Tipo</th><th>Data</th></tr></thead>
                <tbody>
                  {dados.quadro3_creas.map((q, i) => (
                    <tr key={i}><td>{q.ordem_pessoa || '—'}</td><td>{q.codigo_situacao || '—'}</td><td>{q.tipo || '—'}</td><td>{q.data_registro || '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (secaoKey === 'encaminhamentos') {
    return (
      <div className="table-container">
        <table>
          <thead><tr><th>Área</th><th>Órgão Destino</th><th>Objetivo/Motivo</th><th>Data</th><th>Contra-Referência</th></tr></thead>
          <tbody>
            {dados.map((e, i) => (
              <tr key={i}>
                <td>{e.area || '—'}</td>
                <td>{e.orgao_destino || e.destino || '—'}</td>
                <td>{e.objetivo_motivo || e.motivo || '—'}</td>
                <td>{e.data || '—'}</td>
                <td>{e.contra_referencia || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (secaoKey === 'participacao') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 8 }}>
        {Object.entries(dados).filter(([, v]) => v).map(([k, v]) => (
          <div key={k}><strong>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</strong> {typeof v === 'object' ? JSON.stringify(v) : v}</div>
        ))}
      </div>
    )
  }

  if (secaoKey === 'observacoes') {
    return <p style={{ whiteSpace: 'pre-wrap' }}>{dados}</p>
  }

  if (secaoKey === 'medidas_socioeducativas') {
    return (
      <div className="table-container">
        <table>
          <thead><tr><th>Ordem</th><th>Nome</th><th>Tipo</th><th>Processo</th><th>Início</th><th>Fim</th><th>Acomp. CREAS</th></tr></thead>
          <tbody>
            {dados.map((m, i) => (
              <tr key={i}>
                <td>{m.ordem || i + 1}</td>
                <td>{m.nome || '—'}</td>
                <td>{m.tipo_medida || '—'}</td>
                <td>{m.numero_processo || '—'}</td>
                <td>{m.data_inicio || '—'}</td>
                <td>{m.data_fim || '—'}</td>
                <td>{m.acompanhamento_creas?.resposta || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (secaoKey === 'acolhimento_institucional') {
    return (
      <div>
        {dados.historico?.length > 0 && (
          <div>
            <strong>Histórico de Acolhimento</strong>
            <div className="table-container">
              <table>
                <thead><tr><th>Nome</th><th>Data Início</th><th>Data Fim</th><th>Motivo</th></tr></thead>
                <tbody>
                  {dados.historico.map((h, i) => (
                    <tr key={i}><td>{h.nome || '—'}</td><td>{h.data_inicio || '—'}</td><td>{h.data_fim || '—'}</td><td>{h.motivo || '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {dados.acolhimento_familia?.periodo && <div style={{ marginTop: 4 }}><strong>Acolhimento Família:</strong> {dados.acolhimento_familia.periodo}{dados.acolhimento_familia.motivo ? ` — ${dados.acolhimento_familia.motivo}` : ''}</div>}
        {dados.guarda_informal?.periodo && <div style={{ marginTop: 2 }}><strong>Guarda Informal:</strong> {dados.guarda_informal.periodo}{dados.guarda_informal.razao ? ` — ${dados.guarda_informal.razao}` : ''}</div>}
        {dados.membro_prisao && <div style={{ marginTop: 2 }}><strong>Membro Preso:</strong> Sim</div>}
        {dados.adolescente_internacao && <div style={{ marginTop: 2 }}><strong>Adolescente em Internação:</strong> Sim</div>}
      </div>
    )
  }

  if (secaoKey === 'planejamento_evolucao') {
    return (
      <div>
        {dados.inclusao_desligamento?.length > 0 && (
          <div>
            <strong>Inclusão/Desligamento</strong>
            <div className="table-container">
              <table>
                <thead><tr><th>Incluir</th><th>Data Inclusão</th><th>Desligar</th><th>Data Desligamento</th><th>Razão</th></tr></thead>
                <tbody>
                  {dados.inclusao_desligamento.map((r, i) => (
                    <tr key={i}>
                      <td>{r.incluir ? 'Sim' : 'Não'}</td>
                      <td>{r.data_inclusao || '—'}</td>
                      <td>{r.desligar ? 'Sim' : 'Não'}</td>
                      <td>{r.data_desligamento || '—'}</td>
                      <td>{r.razao_desligamento || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {dados.planejamento_inicial && <div style={{ marginTop: 8 }}><strong>Planejamento Inicial:</strong><p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{dados.planejamento_inicial}</p></div>}
        {dados.evolucao && <div style={{ marginTop: 8 }}><strong>Evolução:</strong><p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{dados.evolucao}</p></div>}
      </div>
    )
  }

  if (typeof dados === 'object' && !Array.isArray(dados)) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 8 }}>
        {Object.entries(dados).filter(([, v]) => v !== null && v !== '' && v !== false && !(typeof v === 'object' && !Array.isArray(v) && !Object.values(v).some(v2 => v2))).map(([k, v]) => (
          <div key={k}><strong>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
        ))}
      </div>
    )
  }

  return null
}

export default function ProntuarioView({ id: propId, isDrawer = false }) {
  const { id: paramId } = useParams()
  const id = propId || paramId
  const navigate = useNavigate()
  const [prontuario, setProntuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [uploadingAnexo, setUploadingAnexo] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // IA
  const [generatingParecer, setGeneratingParecer] = useState(false)
  const [parecerText, setParecerText] = useState(null)
  const [showParecerModal, setShowParecerModal] = useState(false)
  const [parecerFormat, setParecerFormat] = useState('padrao_suas')

  const fileInputRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('prontuarios')
        .select('*, applicants(*), profiles!prontuarios_created_by_fkey(nome, role), prontuario_anexos(*, profiles!prontuario_anexos_created_by_fkey(nome))')
        .eq('id', id)
        .single()
      if (data) {
        data.dados_json = migrarSchemaAntigo(data.dados_json || {})
      }
      setProntuario(data)
      setLoading(false)
    }
    if (id) load()
  }, [id])

  async function exportPDF() {
    setDownloading(true)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    try {
      const resp = await fetch(`${apiUrl}/api/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prontuario: prontuario.dados_json,
          requerente: prontuario.applicants,
          profissional_nome: prontuario.profiles?.nome || 'Profissional',
        }),
      })
      if (!resp.ok) {
        let detail = 'Erro ao gerar PDF'
        try { const err = await resp.json(); detail = err.detail || detail } catch (e) {}
        throw new Error(detail)
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prontuario_${prontuario.applicants?.nome?.replace(/\\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Erro ao gerar PDF: ' + err.message)
    }
    setDownloading(false)
  }

  function exportJSON() {
    const data = {
      requerente: prontuario.applicants,
      prontuario: prontuario.dados_json,
      profissional: prontuario.profiles?.nome,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prontuario_${prontuario.applicants?.nome?.replace(/\\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFileUpload(file) {
    if (!file) return
    if (file.type !== 'application/pdf') {
      return alert('Apenas arquivos PDF são permitidos.')
    }
    
    setUploadingAnexo(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      const fileExt = file.name.split('.').pop()
      const fileName = `${id}/${crypto.randomUUID()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('prontuario_anexos')
        .upload(fileName, file)
        
      if (uploadError) throw uploadError
      
      const { error: dbError } = await supabase.from('prontuario_anexos').insert({
        prontuario_id: id,
        nome_arquivo: file.name,
        caminho_storage: fileName,
        tamanho: file.size,
        created_by: user.id
      })
      
      if (dbError) throw dbError
      
      const { data } = await supabase
        .from('prontuarios')
        .select('*, applicants(*), profiles!prontuarios_created_by_fkey(nome, role), prontuario_anexos(*, profiles!prontuario_anexos_created_by_fkey(nome))')
        .eq('id', id)
        .single()
      setProntuario(data)
      alert('Anexo enviado com sucesso!')
    } catch (err) {
      alert('Erro ao enviar anexo: ' + err.message)
    } finally {
      setUploadingAnexo(false)
      if (fileInputRef.current) fileInputRef.current.value = null
    }
  }

  const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true) }
  const onDragLeave = () => setIsDragOver(false)
  const onDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  async function handleGenerateParecer() {
    setShowParecerModal(false)
    setGeneratingParecer(true)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    try {
      const resp = await fetch(`${apiUrl}/api/generate-parecer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prontuario_context: prontuario, formato: parecerFormat }),
      })
      if (!resp.ok) {
        let errorMsg = 'Erro na resposta da API'
        try { const errData = await resp.json(); errorMsg = errData.detail || errorMsg } catch(e) {}
        throw new Error(errorMsg)
      }
      const result = await resp.json()
      setParecerText(result.report)
    } catch (err) {
      alert('Erro ao gerar parecer com IA: ' + err.message)
    } finally {
      setGeneratingParecer(false)
    }
  }

  async function handleDownloadAnexo(caminho, nome) {
    try {
      const { data, error } = await supabase.storage.from('prontuario_anexos').createSignedUrl(caminho, 60)
      if (error) throw error
      
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = nome
      a.target = '_blank'
      a.click()
    } catch (err) {
      alert('Erro ao baixar anexo: ' + err.message)
    }
  }

  async function handleDeleteAnexo(anexoId, caminho) {
    if (!window.confirm('Tem certeza que deseja excluir este anexo?')) return
    try {
      await supabase.storage.from('prontuario_anexos').remove([caminho])
      await supabase.from('prontuario_anexos').delete().eq('id', anexoId)
      
      setProntuario(prev => ({
        ...prev,
        prontuario_anexos: prev.prontuario_anexos.filter(a => a.id !== anexoId)
      }))
    } catch (err) {
      alert('Erro ao excluir anexo: ' + err.message)
    }
  }

  if (loading) return isDrawer ? <div className="loading">Carregando...</div> : <Layout title="Prontuário"><div className="loading">Carregando...</div></Layout>
  if (!prontuario) return isDrawer ? <div className="empty-state">Prontuário não encontrado.</div> : <Layout title="Prontuário"><div className="empty-state">Prontuário não encontrado.</div></Layout>

  const dados = prontuario.dados_json || {}

  const content = (
    <>
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>{prontuario.applicants?.nome}</h3>
            <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
              Profissional: {prontuario.profiles?.nome}
              <span className={`badge badge-${prontuario.profiles?.role}`} style={{ marginLeft: 8 }}>
                {prontuario.profiles?.role ? ROLE_LABELS[prontuario.profiles.role] : ''}
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowParecerModal(true)} disabled={generatingParecer}>
              {generatingParecer ? 'Analisando...' : 'Documento (IA)'}
            </button>
            <button className="btn btn-success btn-sm" onClick={exportPDF} disabled={downloading}>
              {downloading ? 'Gerando...' : 'PDF'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={exportJSON}>
              JSON
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Dados do Requerente</h3>
        </div>
        <div className="form-row">
          <div><strong>Nome:</strong> {prontuario.applicants?.nome}</div>
          <div><strong>CPF:</strong> {prontuario.applicants?.cpf || '—'}</div>
          <div><strong>NIS:</strong> {prontuario.applicants?.nis || '—'}</div>
          <div><strong>Nascimento:</strong> {formatDate(prontuario.applicants?.data_nascimento)}</div>
          <div><strong>Telefone:</strong> {prontuario.applicants?.telefone || '—'}</div>
        </div>
      </div>

      {SECOES.map((secao) => {
        const dadosSecao = dados[secao.key]
        if (!dadosSecao || (typeof dadosSecao === 'object' && !Array.isArray(dadosSecao) && Object.values(dadosSecao).every(v => !v)) ||
            (Array.isArray(dadosSecao) && dadosSecao.length === 0)) {
          return null
        }

        return (
          <div key={secao.key} className="card">
            <div className="card-header">
              <h3>{secao.title}</h3>
            </div>
            <RenderSection secaoKey={secao.key} dados={dadosSecao} fullDados={dados} />
          </div>
        )
      })}

      <div className="card">
        <div className="card-header">
          <h3>Anexos (PDF)</h3>
        </div>
        
        <div 
          className={`drop-zone ${isDragOver ? 'dragover' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ marginBottom: 16 }}
        >
          {uploadingAnexo ? (
            <span>Enviando arquivo...</span>
          ) : (
            <>
              <b>Arraste o PDF aqui ou clique para escolher</b>
              <p style={{ fontSize: 12, marginTop: 4 }}>Apenas arquivos PDF são permitidos</p>
            </>
          )}
          <input 
            type="file" 
            accept="application/pdf" 
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e.target.files[0])}
            disabled={uploadingAnexo}
          />
        </div>

        {prontuario.prontuario_anexos && prontuario.prontuario_anexos.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome do Arquivo</th>
                  <th>Tamanho</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {prontuario.prontuario_anexos.map((a) => (
                  <tr key={a.id}>
                    <td>{a.nome_arquivo}</td>
                    <td>{(a.tamanho / 1024 / 1024).toFixed(2)} MB</td>
                    <td>{formatDateTime(a.created_at)}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => handleDownloadAnexo(a.caminho_storage, a.nome_arquivo)} style={{ marginRight: 8 }}>Baixar</button>
                      <button className="btn btn-sm btn-outline" onClick={() => handleDeleteAnexo(a.id, a.caminho_storage)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-light)', padding: 16, textAlign: 'center' }}>Nenhum anexo encontrado.</p>
        )}
      </div>

      {prontuario.hash_assinatura && (
        <div className="card" style={{ background: '#f8f9fa' }}>
          <p style={{ fontSize: 12, color: 'var(--text-light)', wordBreak: 'break-all', margin: 0 }}>
            <strong>Assinatura digital:</strong> {prontuario.hash_assinatura}<br />
            <strong>Assinado por:</strong> {prontuario.profiles?.nome}<br />
            <strong>Em:</strong> {formatDateTime(prontuario.assinado_em)}
          </p>
        </div>
      )}

      {/* Modal de Escolha de Formato do Parecer */}
      {showParecerModal && (
        <div className="modal-overlay" onClick={() => setShowParecerModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Gerar Relatório/Ofício</h3>
              <button className="modal-close" onClick={() => setShowParecerModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Qual o formato/objetivo do documento?</label>
                <select className="form-control" value={parecerFormat} onChange={(e) => setParecerFormat(e.target.value)}>
                  <option value="padrao_suas">Parecer Social Padrão (Interno)</option>
                  <option value="juridico">Ofício para Justiça (Jurídico)</option>
                  <option value="saude">Encaminhamento Médico/SUS (Saúde)</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowParecerModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleGenerateParecer}>Gerar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Parecer */}
      {parecerText && (
        <div className="modal-overlay" onClick={() => setParecerText(null)}>
          <div className="modal" style={{ maxWidth: 800 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Parecer Social Gerado (IA)</h3>
              <button className="modal-close" onClick={() => setParecerText(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>
                Lembre-se: Este é um documento gerado automaticamente por Inteligência Artificial baseado no histórico do prontuário. Revise-o cuidadosamente antes de assinar.
              </p>
              <textarea 
                className="form-control" 
                style={{ height: '400px', fontSize: '14px', lineHeight: 1.6 }}
                defaultValue={parecerText}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setParecerText(null)}>Fechar</button>
              <button className="btn btn-primary" onClick={() => {
                navigator.clipboard.writeText(parecerText)
                alert('Parecer copiado para a área de transferência!')
              }}>Copiar Texto</button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  if (isDrawer) return content
  
  return (
    <Layout title={`Prontuário - ${prontuario.applicants?.nome || ''}`}>
      {content}
    </Layout>
  )
}
