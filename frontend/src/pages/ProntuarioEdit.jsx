import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import {
  emptyProntuario, emptyMembro, calcularPerfilEtario, migrarSchemaAntigo,
  SECOES, PARENTESCO_OPCOES, DOCUMENTACAO_OPCOES,
  LOCALIZACAO_DOMICILIO_OPCOES, TIPO_UNIDADE_OPCOES,
  FORMA_INGRESSO_OPCOES, PROGRAMAS_SOCIAIS_LISTA, SIM_NAO_OPCOES,
  TIPO_RESIDENCIA_OPCOES, MATERIAL_PAREDES_OPCOES,
  ENERGIA_OPCOES, ABASTECIMENTO_AGUA_OPCOES,
  ESCOAMENTO_OPCOES, COLETA_LIXO_OPCOES,
  ESCOLARIDADE_OPCOES,
  CONDICAO_OCUPACAO_OPCOES,
  TIPO_DEFICIENCIA_OPCOES,
  TIPO_BENEFICIO_OPCOES,
  AVALIACAO_RELACAO_OPCOES,
  TIPO_MEDIDA_OPCOES,
} from '../utils/prontuarioSchema'
import { auditLog } from '../utils/audit'

export default function ProntuarioEdit() {
  const { id, applicantId } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [requerente, setRequerente] = useState(null)
  const [prontuario, setProntuario] = useState(emptyProntuario())
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})

  useEffect(() => {
    async function load() {
      if (isEditing) {
        const { data: pro } = await supabase.from('prontuarios').select('*, applicants(*)').eq('id', id).single()
        if (pro) {
          setProntuario(migrarSchemaAntigo(pro.dados_json || emptyProntuario()))
          setRequerente(pro.applicants)
        }
      } else if (applicantId) {
        const { data: req } = await supabase.from('applicants').select('*').eq('id', applicantId).single()
        setRequerente(req)
      }
    }
    load()
  }, [id, applicantId])

  function updateSection(key, data) {
    setProntuario(prev => ({
      ...prev,
      [key]: typeof data === 'object' ? { ...prev[key], ...data } : data,
    }))
  }

  function addMembro() {
    setProntuario(prev => {
      const membros = [...(prev.composicao_familiar || []), emptyMembro()]
      return { ...prev, composicao_familiar: membros, perfil_etario: calcularPerfilEtario(membros) }
    })
  }

  function updateMembro(index, field, value) {
    const list = [...(prontuario.composicao_familiar || [])]
    list[index] = { ...list[index], [field]: value }
    setProntuario(prev => ({ ...prev, composicao_familiar: list, perfil_etario: calcularPerfilEtario(list) }))
  }

  function removeMembro(index) {
    const list = [...(prontuario.composicao_familiar || [])]
    list.splice(index, 1)
    setProntuario(prev => ({ ...prev, composicao_familiar: list, perfil_etario: calcularPerfilEtario(list) }))
  }

  function addEncaminhamento() {
    const novo = { area: '', orgao_destino: '', objetivo_motivo: '', data: new Date().toISOString().split('T')[0], contra_referencia: '' }
    setProntuario(prev => ({
      ...prev,
      encaminhamentos: [...(prev.encaminhamentos || []), novo],
    }))
  }

  function updateEncaminhamento(index, field, value) {
    const list = [...(prontuario.encaminhamentos || [])]
    list[index] = { ...list[index], [field]: value }
    setProntuario(prev => ({ ...prev, encaminhamentos: list }))
  }

  function removeEncaminhamento(index) {
    const list = [...(prontuario.encaminhamentos || [])]
    list.splice(index, 1)
    setProntuario(prev => ({ ...prev, encaminhamentos: list }))
  }

  function togglePrograma(key) {
    setProntuario(prev => ({
      ...prev,
      identificacao: {
        ...prev.identificacao,
        programas_sociais: {
          ...prev.identificacao.programas_sociais,
          [key]: { ...prev.identificacao.programas_sociais[key], ativo: !prev.identificacao.programas_sociais[key]?.ativo },
        },
      },
    }))
  }

  function updateProgramaValor(key, valor) {
    setProntuario(prev => ({
      ...prev,
      identificacao: {
        ...prev.identificacao,
        programas_sociais: {
          ...prev.identificacao.programas_sociais,
          [key]: { ...prev.identificacao.programas_sociais[key], valor },
        },
      },
    }))
  }

  function updateProgramaDescricao(descricao) {
    setProntuario(prev => ({
      ...prev,
      identificacao: {
        ...prev.identificacao,
        programas_sociais: {
          ...prev.identificacao.programas_sociais,
          outros: { ...prev.identificacao.programas_sociais.outros, descricao },
        },
      },
    }))
  }

  function toggleDocumentacao(membroIndex, doc) {
    const list = [...(prontuario.composicao_familiar || [])]
    const docs = list[membroIndex].documentacao || []
    const idx = docs.indexOf(doc)
    list[membroIndex] = {
      ...list[membroIndex],
      documentacao: idx >= 0 ? docs.filter(d => d !== doc) : [...docs, doc],
    }
    setProntuario(prev => ({ ...prev, composicao_familiar: list }))
  }

  function addEducando() {
    setProntuario(prev => ({
      ...prev,
      educacional: {
        ...prev.educacional,
        membros: [...(prev.educacional?.membros || []), { ordem: (prev.educacional?.membros?.length || 0) + 1, nome: '', idade: '', sabe_ler: '', frequenta_escola: '', escolaridade: '' }],
      },
    }))
  }

  function updateEducando(index, field, value) {
    const list = [...(prontuario.educacional?.membros || [])]
    list[index] = { ...list[index], [field]: value }
    setProntuario(prev => ({ ...prev, educacional: { ...prev.educacional, membros: list } }))
  }

  function removeEducando(index) {
    const list = [...(prontuario.educacional?.membros || [])]
    list.splice(index, 1)
    setProntuario(prev => ({ ...prev, educacional: { ...prev.educacional, membros: list } }))
  }

  function addCondicionalidadeBF() {
    setProntuario(prev => ({
      ...prev,
      educacional: {
        ...prev.educacional,
        condicionalidades_bf: [...(prev.educacional?.condicionalidades_bf || []), { mes_ano: '', efeito: '' }],
      },
    }))
  }

  function updateCondicionalidadeBF(index, field, value) {
    const list = [...(prontuario.educacional?.condicionalidades_bf || [])]
    list[index] = { ...list[index], [field]: value }
    setProntuario(prev => ({ ...prev, educacional: { ...prev.educacional, condicionalidades_bf: list } }))
  }

  function removeCondicionalidadeBF(index) {
    const list = [...(prontuario.educacional?.condicionalidades_bf || [])]
    list.splice(index, 1)
    setProntuario(prev => ({ ...prev, educacional: { ...prev.educacional, condicionalidades_bf: list } }))
  }

  function addMembroTrabalho() {
    setProntuario(prev => ({
      ...prev,
      trabalho_renda: {
        ...prev.trabalho_renda,
        membros: [...(prev.trabalho_renda?.membros || []), { ordem: (prev.trabalho_renda?.membros?.length || 0) + 1, nome: '', idade: '', possui_ctps: '', condicao_ocupacao: '', possui_qualificacao: '', qualificacao: '', renda_mensal: '' }],
      },
    }))
  }

  function updateMembroTrabalho(index, field, value) {
    const list = [...(prontuario.trabalho_renda?.membros || [])]
    list[index] = { ...list[index], [field]: value }
    setProntuario(prev => ({ ...prev, trabalho_renda: { ...prev.trabalho_renda, membros: list } }))
  }

  function removeMembroTrabalho(index) {
    const list = [...(prontuario.trabalho_renda?.membros || [])]
    list.splice(index, 1)
    setProntuario(prev => ({ ...prev, trabalho_renda: { ...prev.trabalho_renda, membros: list } }))
  }

  function addDeficiencia() {
    setProntuario(prev => ({
      ...prev,
      saude: {
        ...prev.saude,
        deficiencias: [...(prev.saude?.deficiencias || []), { ordem: (prev.saude?.deficiencias?.length || 0) + 1, nome: '', tipos: [], necessita_cuidador: '', responsavel_cuidador: '' }],
      },
    }))
  }

  function updateDeficiencia(index, field, value) {
    const list = [...(prontuario.saude?.deficiencias || [])]
    list[index] = { ...list[index], [field]: value }
    setProntuario(prev => ({ ...prev, saude: { ...prev.saude, deficiencias: list } }))
  }

  function toggleDeficienciaTipo(index, tipo) {
    const list = [...(prontuario.saude?.deficiencias || [])]
    const tipos = list[index].tipos || []
    const idx = tipos.indexOf(tipo)
    list[index] = {
      ...list[index],
      tipos: idx >= 0 ? tipos.filter(t => t !== tipo) : [...tipos, tipo],
    }
    setProntuario(prev => ({ ...prev, saude: { ...prev.saude, deficiencias: list } }))
  }

  function removeDeficiencia(index) {
    const list = [...(prontuario.saude?.deficiencias || [])]
    list.splice(index, 1)
    setProntuario(prev => ({ ...prev, saude: { ...prev.saude, deficiencias: list } }))
  }

  function addGestante() {
    setProntuario(prev => ({
      ...prev,
      saude: {
        ...prev.saude,
        gestantes: [...(prev.saude?.gestantes || []), { ordem: (prev.saude?.gestantes?.length || 0) + 1, nome: '', meses_gestacao: 0, pre_natal: '', data_anotacao: '' }],
      },
    }))
  }

  function updateGestante(index, field, value) {
    const list = [...(prontuario.saude?.gestantes || [])]
    list[index] = { ...list[index], [field]: value }
    setProntuario(prev => ({ ...prev, saude: { ...prev.saude, gestantes: list } }))
  }

  function removeGestante(index) {
    const list = [...(prontuario.saude?.gestantes || [])]
    list.splice(index, 1)
    setProntuario(prev => ({ ...prev, saude: { ...prev.saude, gestantes: list } }))
  }

  function updateSaudeField(field, subField, value) {
    setProntuario(prev => ({
      ...prev,
      saude: {
        ...prev.saude,
        [field]: { ...prev.saude?.[field], [subField]: value },
      },
    }))
  }

  function addBeneficio() {
    const novo = { data: '', tipo: '', observacao: '', registro_nascimento: '', cpf_falecido: '' }
    setProntuario(prev => ({
      ...prev,
      beneficios: {
        ...prev.beneficios,
        registros: [...(prev.beneficios?.registros || []), novo],
      },
    }))
  }

  function updateBeneficio(index, field, value) {
    const list = [...(prontuario.beneficios?.registros || [])]
    list[index] = { ...list[index], [field]: value }
    setProntuario(prev => ({ ...prev, beneficios: { ...prev.beneficios, registros: list } }))
  }

  function removeBeneficio(index) {
    const list = [...(prontuario.beneficios?.registros || [])]
    list.splice(index, 1)
    setProntuario(prev => ({ ...prev, beneficios: { ...prev.beneficios, registros: list } }))
  }

  function addMedida() {
    setProntuario(prev => ({
      ...prev,
      medidas_socioeducativas: [...(prev.medidas_socioeducativas || []), {
        ordem: (prev.medidas_socioeducativas?.length || 0) + 1, nome: '', tipo_medida: '',
        numero_processo: '', data_inicio: '', data_fim: '',
        acompanhamento_creas: { resposta: '', data: '' }, local_psc: '',
      }],
    }))
  }

  function updateMedida(index, field, value) {
    const list = [...(prontuario.medidas_socioeducativas || [])]
    list[index] = { ...list[index], [field]: value }
    setProntuario(prev => ({ ...prev, medidas_socioeducativas: list }))
  }

  function updateMedidaAcomp(index, subField, value) {
    const list = [...(prontuario.medidas_socioeducativas || [])]
    list[index] = { ...list[index], acompanhamento_creas: { ...list[index].acompanhamento_creas, [subField]: value } }
    setProntuario(prev => ({ ...prev, medidas_socioeducativas: list }))
  }

  function removeMedida(index) {
    const list = [...(prontuario.medidas_socioeducativas || [])]
    list.splice(index, 1)
    setProntuario(prev => ({ ...prev, medidas_socioeducativas: list }))
  }

  function addHistoricoAcolhimento() {
    setProntuario(prev => ({
      ...prev,
      acolhimento_institucional: {
        ...prev.acolhimento_institucional,
        historico: [...(prev.acolhimento_institucional?.historico || []), {
          ordem: (prev.acolhimento_institucional?.historico?.length || 0) + 1, nome: '',
          data_inicio: '', data_fim: '', motivo: '',
        }],
      },
    }))
  }

  function updateHistoricoAcolhimento(index, field, value) {
    const list = [...(prontuario.acolhimento_institucional?.historico || [])]
    list[index] = { ...list[index], [field]: value }
    setProntuario(prev => ({ ...prev, acolhimento_institucional: { ...prev.acolhimento_institucional, historico: list } }))
  }

  function removeHistoricoAcolhimento(index) {
    const list = [...(prontuario.acolhimento_institucional?.historico || [])]
    list.splice(index, 1)
    setProntuario(prev => ({ ...prev, acolhimento_institucional: { ...prev.acolhimento_institucional, historico: list } }))
  }

  function addInclusaoDesligamento() {
    setProntuario(prev => ({
      ...prev,
      planejamento_evolucao: {
        ...prev.planejamento_evolucao,
        inclusao_desligamento: [...(prev.planejamento_evolucao?.inclusao_desligamento || []), {
          incluir: false, data_inclusao: '', desligar: false, data_desligamento: '', razao_desligamento: '',
        }],
      },
    }))
  }

  function updateInclusaoDesligamento(index, field, value) {
    const list = [...(prontuario.planejamento_evolucao?.inclusao_desligamento || [])]
    list[index] = { ...list[index], [field]: value }
    setProntuario(prev => ({ ...prev, planejamento_evolucao: { ...prev.planejamento_evolucao, inclusao_desligamento: list } }))
  }

  function removeInclusaoDesligamento(index) {
    const list = [...(prontuario.planejamento_evolucao?.inclusao_desligamento || [])]
    list.splice(index, 1)
    setProntuario(prev => ({ ...prev, planejamento_evolucao: { ...prev.planejamento_evolucao, inclusao_desligamento: list } }))
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (isEditing) {
      const { data: current } = await supabase.from('prontuarios').select('versao').eq('id', id).single()
      await supabase.from('prontuarios').update({
        dados_json: prontuario,
        versao: (current?.versao || 0) + 1,
      }).eq('id', id)
    } else {
      await supabase.from('prontuarios').insert({
        applicant_id: applicantId,
        created_by: user.id,
        dados_json: prontuario,
      })
      auditLog(user.id, 'gerou_prontuario', { applicant_id: applicantId })
    }
    setSaving(false)
    navigate(applicantId ? `/requerentes/${applicantId}` : '/')
  }

  function toggleSection(key) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!requerente) return <Layout title="Prontuário"><div className="loading">Carregando...</div></Layout>

  return (
    <Layout title={`Prontuário - ${requerente.nome}`}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <strong>Requerente:</strong> {requerente.nome}
            {requerente.cpf && <span style={{ color: 'var(--text-light)', marginLeft: 8 }}>CPF: {requerente.cpf}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Prontuário'}
            </button>
          </div>
        </div>
      </div>

      {SECOES.map((secao) => (
        <div key={secao.key} className="prontuario-section">
          <div className="prontuario-section-header" onClick={() => toggleSection(secao.key)}>
            <span>{secao.title}</span>
            <span>{expandedSections[secao.key] ? '▼' : '▶'}</span>
          </div>

          {expandedSections[secao.key] && (
            <div className="prontuario-section-body">
              {secao.key === 'identificacao' && (
                <div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Logradouro</label>
                      <input className="form-control" value={prontuario.identificacao.logradouro || ''}
                        onChange={(e) => updateSection('identificacao', { logradouro: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Número</label>
                      <input className="form-control" value={prontuario.identificacao.numero || ''}
                        onChange={(e) => updateSection('identificacao', { numero: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Complemento</label>
                      <input className="form-control" value={prontuario.identificacao.complemento || ''}
                        onChange={(e) => updateSection('identificacao', { complemento: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Bairro</label>
                      <input className="form-control" value={prontuario.identificacao.bairro || ''}
                        onChange={(e) => updateSection('identificacao', { bairro: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Município</label>
                      <input className="form-control" value={prontuario.identificacao.municipio || ''}
                        onChange={(e) => updateSection('identificacao', { municipio: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>UF</label>
                      <input className="form-control" maxLength={2} value={prontuario.identificacao.uf || ''}
                        onChange={(e) => updateSection('identificacao', { uf: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="form-group">
                      <label>CEP</label>
                      <input className="form-control" value={prontuario.identificacao.cep || ''}
                        onChange={(e) => updateSection('identificacao', { cep: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Apelido</label>
                      <input className="form-control" value={prontuario.identificacao.apelido || ''}
                        onChange={(e) => updateSection('identificacao', { apelido: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Localização do Domicílio</label>
                      <select className="form-control" value={prontuario.identificacao.localizacao_domicilio || ''}
                        onChange={(e) => updateSection('identificacao', { localizacao_domicilio: e.target.value })}>
                        <option value="">Selecione</option>
                        {LOCALIZACAO_DOMICILIO_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo de Unidade</label>
                      <select className="form-control" value={prontuario.identificacao.tipo_unidade || ''}
                        onChange={(e) => updateSection('identificacao', { tipo_unidade: e.target.value })}>
                        <option value="">Selecione</option>
                        {TIPO_UNIDADE_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nome da Unidade</label>
                      <input className="form-control" value={prontuario.identificacao.nome_unidade || ''}
                        onChange={(e) => updateSection('identificacao', { nome_unidade: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Forma de Ingresso</label>
                    <div className="radio-group">
                      {FORMA_INGRESSO_OPCOES.map(o => (
                        <label key={o} className="radio-label" style={{ display: 'block', marginBottom: 4 }}>
                          <input type="radio" name="forma_ingresso" value={o}
                            checked={prontuario.identificacao.forma_ingresso === o}
                            onChange={(e) => updateSection('identificacao', { forma_ingresso: e.target.value })} />
                          {' '}{o}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Motivo do Primeiro Atendimento</label>
                    <textarea className="form-control" rows={3} value={prontuario.identificacao.motivo_primeiro_atendimento || ''}
                      onChange={(e) => updateSection('identificacao', { motivo_primeiro_atendimento: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Órgão Encaminhador</label>
                    <input className="form-control" value={prontuario.identificacao.orgao_encaminhador || ''}
                      onChange={(e) => updateSection('identificacao', { orgao_encaminhador: e.target.value })} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <strong>Programas Sociais</strong>
                    {PROGRAMAS_SOCIAIS_LISTA.map(p => (
                      <div key={p.key} style={{ marginTop: 8 }}>
                        <label className="checkbox-label">
                          <input type="checkbox" checked={prontuario.identificacao.programas_sociais[p.key]?.ativo || false}
                            onChange={() => togglePrograma(p.key)} />
                          {' '}{p.label}
                        </label>
                        {prontuario.identificacao.programas_sociais[p.key]?.ativo && (
                          <div style={{ marginLeft: 24, marginTop: 4 }}>
                            <input className="form-control" placeholder="Valor (R$)" style={{ width: 200 }}
                              value={prontuario.identificacao.programas_sociais[p.key]?.valor || ''}
                              onChange={(e) => updateProgramaValor(p.key, e.target.value)} />
                            {p.key === 'outros' && (
                              <input className="form-control" placeholder="Descrição" style={{ width: 300, marginTop: 4 }}
                                value={prontuario.identificacao.programas_sociais.outros?.descricao || ''}
                                onChange={(e) => updateProgramaDescricao(e.target.value)} />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {secao.key === 'composicao_familiar' && (
                <div>
                  {(prontuario.composicao_familiar || []).map((membro, i) => (
                    <div key={i} style={{
                      border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8,
                      position: 'relative',
                    }}>
                      <button onClick={() => removeMembro(i)} style={{
                        position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                        color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                      }}>×</button>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Nome</label>
                          <input className="form-control" value={membro.nome} onChange={(e) => updateMembro(i, 'nome', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Parentesco</label>
                          <select className="form-control" value={membro.parentesco} onChange={(e) => updateMembro(i, 'parentesco', e.target.value)}>
                            <option value="">Selecione</option>
                            {PARENTESCO_OPCOES.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Sexo</label>
                          <select className="form-control" value={membro.sexo} onChange={(e) => updateMembro(i, 'sexo', e.target.value)}>
                            <option value="">Selecione</option>
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Data de Nascimento</label>
                          <input type="date" className="form-control" value={membro.data_nascimento} onChange={(e) => updateMembro(i, 'data_nascimento', e.target.value)} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Pessoa com Deficiência</label>
                          <div>
                            <label className="checkbox-label">
                              <input type="checkbox" checked={membro.pessoa_com_deficiencia || false}
                                onChange={(e) => updateMembro(i, 'pessoa_com_deficiencia', e.target.checked)} />
                              {' '}Sim
                            </label>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Documentação</label>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {DOCUMENTACAO_OPCOES.map(doc => (
                              <label key={doc} className="checkbox-label">
                                <input type="checkbox" checked={(membro.documentacao || []).includes(doc)}
                                  onChange={() => toggleDocumentacao(i, doc)} />
                                {' '}{doc}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-outline btn-sm" onClick={addMembro}>
                    + Adicionar Membro
                  </button>

                  <div style={{ marginTop: 16 }}>
                    <strong>Perfil Etário</strong>
                    <table className="table" style={{ width: '100%', marginTop: 8 }}>
                      <thead>
                        <tr>
                          <th>0 a 6</th>
                          <th>7 a 14</th>
                          <th>15 a 17</th>
                          <th>18 a 29</th>
                          <th>30 a 59</th>
                          <th>60 a 64</th>
                          <th>65 a 69</th>
                          <th>70+</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{prontuario.perfil_etario?.['0_a_6'] ?? 0}</td>
                          <td>{prontuario.perfil_etario?.['7_a_14'] ?? 0}</td>
                          <td>{prontuario.perfil_etario?.['15_a_17'] ?? 0}</td>
                          <td>{prontuario.perfil_etario?.['18_a_29'] ?? 0}</td>
                          <td>{prontuario.perfil_etario?.['30_a_59'] ?? 0}</td>
                          <td>{prontuario.perfil_etario?.['60_a_64'] ?? 0}</td>
                          <td>{prontuario.perfil_etario?.['65_a_69'] ?? 0}</td>
                          <td>{prontuario.perfil_etario?.['70_mais'] ?? 0}</td>
                          <td><strong>{prontuario.perfil_etario?.total ?? 0}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <strong>Especificidades Sociais</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                      <label className="checkbox-label">
                        <input type="checkbox" checked={prontuario.especificidades_sociais?.situacao_rua || false}
                          onChange={(e) => setProntuario(prev => ({ ...prev, especificidades_sociais: { ...prev.especificidades_sociais, situacao_rua: e.target.checked } }))} />
                        {' '}Situação de Rua
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" checked={prontuario.especificidades_sociais?.quilombola || false}
                          onChange={(e) => setProntuario(prev => ({ ...prev, especificidades_sociais: { ...prev.especificidades_sociais, quilombola: e.target.checked } }))} />
                        {' '}Quilombola
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" checked={prontuario.especificidades_sociais?.ribeirinha || false}
                          onChange={(e) => setProntuario(prev => ({ ...prev, especificidades_sociais: { ...prev.especificidades_sociais, ribeirinha: e.target.checked } }))} />
                        {' '}Ribeirinha
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" checked={prontuario.especificidades_sociais?.cigana || false}
                          onChange={(e) => setProntuario(prev => ({ ...prev, especificidades_sociais: { ...prev.especificidades_sociais, cigana: e.target.checked } }))} />
                        {' '}Cigana
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" checked={prontuario.especificidades_sociais?.indigena_aldeia?.ativo || false}
                          onChange={(e) => setProntuario(prev => ({
                            ...prev, especificidades_sociais: {
                              ...prev.especificidades_sociais,
                              indigena_aldeia: { ...prev.especificidades_sociais?.indigena_aldeia, ativo: e.target.checked },
                            },
                          }))} />
                        {' '}Indígena em Aldeia
                      </label>
                      {prontuario.especificidades_sociais?.indigena_aldeia?.ativo && (
                        <input className="form-control" placeholder="Etnia" value={prontuario.especificidades_sociais?.indigena_aldeia?.etnia || ''}
                          onChange={(e) => setProntuario(prev => ({
                            ...prev, especificidades_sociais: {
                              ...prev.especificidades_sociais,
                              indigena_aldeia: { ...prev.especificidades_sociais?.indigena_aldeia, etnia: e.target.value },
                            },
                          }))} />
                      )}
                      <label className="checkbox-label">
                        <input type="checkbox" checked={prontuario.especificidades_sociais?.indigena_nao_aldeia?.ativo || false}
                          onChange={(e) => setProntuario(prev => ({
                            ...prev, especificidades_sociais: {
                              ...prev.especificidades_sociais,
                              indigena_nao_aldeia: { ...prev.especificidades_sociais?.indigena_nao_aldeia, ativo: e.target.checked },
                            },
                          }))} />
                        {' '}Indígena Fora de Aldeia
                      </label>
                      {prontuario.especificidades_sociais?.indigena_nao_aldeia?.ativo && (
                        <input className="form-control" placeholder="Etnia" value={prontuario.especificidades_sociais?.indigena_nao_aldeia?.etnia || ''}
                          onChange={(e) => setProntuario(prev => ({
                            ...prev, especificidades_sociais: {
                              ...prev.especificidades_sociais,
                              indigena_nao_aldeia: { ...prev.especificidades_sociais?.indigena_nao_aldeia, etnia: e.target.value },
                            },
                          }))} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {secao.key === 'habitacional' && (
                <div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo de Residência</label>
                      <div className="radio-group">
                        {TIPO_RESIDENCIA_OPCOES.map(o => (
                          <label key={o} className="radio-label" style={{ display: 'block', marginBottom: 2 }}>
                            <input type="radio" name="tipo_residencia" value={o}
                              checked={prontuario.habitacional.tipo_residencia === o}
                              onChange={(e) => updateSection('habitacional', { tipo_residencia: e.target.value })} />
                            {' '}{o}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Material das Paredes</label>
                      <div className="radio-group">
                        {MATERIAL_PAREDES_OPCOES.map(o => (
                          <label key={o} className="radio-label" style={{ display: 'block', marginBottom: 2 }}>
                            <input type="radio" name="material_paredes" value={o}
                              checked={prontuario.habitacional.material_paredes === o}
                              onChange={(e) => updateSection('habitacional', { material_paredes: e.target.value })} />
                            {' '}{o}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Energia Elétrica</label>
                      <select className="form-control" value={prontuario.habitacional.energia_eletrica || ''}
                        onChange={(e) => updateSection('habitacional', { energia_eletrica: e.target.value })}>
                        <option value="">Selecione</option>
                        {ENERGIA_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Água Canalizada</label>
                      <div className="radio-group">
                        {SIM_NAO_OPCOES.map(o => (
                          <label key={o} className="radio-label" style={{ display: 'inline-block', marginRight: 8 }}>
                            <input type="radio" name="agua_canalizada" value={o}
                              checked={prontuario.habitacional.agua_canalizada === o}
                              onChange={(e) => updateSection('habitacional', { agua_canalizada: e.target.value })} />
                            {' '}{o}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Abastecimento de Água</label>
                      <select className="form-control" value={prontuario.habitacional.abastecimento_agua || ''}
                        onChange={(e) => updateSection('habitacional', { abastecimento_agua: e.target.value })}>
                        <option value="">Selecione</option>
                        {ABASTECIMENTO_AGUA_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Escoamento Sanitário</label>
                      <select className="form-control" value={prontuario.habitacional.escoamento_sanitario || ''}
                        onChange={(e) => updateSection('habitacional', { escoamento_sanitario: e.target.value })}>
                        <option value="">Selecione</option>
                        {ESCOAMENTO_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Coleta de Lixo</label>
                      <select className="form-control" value={prontuario.habitacional.coleta_lixo || ''}
                        onChange={(e) => updateSection('habitacional', { coleta_lixo: e.target.value })}>
                        <option value="">Selecione</option>
                        {COLETA_LIXO_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Total de Cômodos</label>
                      <input type="number" className="form-control" min={0} value={prontuario.habitacional.total_comodos ?? ''}
                        onChange={(e) => updateSection('habitacional', { total_comodos: Number(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Dormitórios</label>
                      <input type="number" className="form-control" min={0} value={prontuario.habitacional.dormitorios ?? ''}
                        onChange={(e) => updateSection('habitacional', { dormitorios: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Área de Risco</label>
                      <div className="radio-group">
                        {SIM_NAO_OPCOES.map(o => (
                          <label key={o} className="radio-label" style={{ display: 'inline-block', marginRight: 8 }}>
                            <input type="radio" name="area_risco" value={o}
                              checked={prontuario.habitacional.area_risco === o}
                              onChange={(e) => updateSection('habitacional', { area_risco: e.target.value })} />
                            {' '}{o}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Acesso Difícil</label>
                      <div className="radio-group">
                        {SIM_NAO_OPCOES.map(o => (
                          <label key={o} className="radio-label" style={{ display: 'inline-block', marginRight: 8 }}>
                            <input type="radio" name="acesso_dificil" value={o}
                              checked={prontuario.habitacional.acesso_dificil === o}
                              onChange={(e) => updateSection('habitacional', { acesso_dificil: e.target.value })} />
                            {' '}{o}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Conflito/Violência</label>
                      <div className="radio-group">
                        {SIM_NAO_OPCOES.map(o => (
                          <label key={o} className="radio-label" style={{ display: 'inline-block', marginRight: 8 }}>
                            <input type="radio" name="conflito_violencia" value={o}
                              checked={prontuario.habitacional.conflito_violencia === o}
                              onChange={(e) => updateSection('habitacional', { conflito_violencia: e.target.value })} />
                            {' '}{o}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {secao.key === 'educacional' && (
                <div>
                  <strong>Vulnerabilidades Educacionais</strong>
                  <div className="form-row">
                    {Object.entries(prontuario.educacional?.vulnerabilidades || {}).map(([key]) => (
                      <div className="form-group" key={key} style={{ flex: '1 1 30%' }}>
                        <label>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                        <input type="number" className="form-control" min={0}
                          value={prontuario.educacional?.vulnerabilidades?.[key] ?? ''}
                          onChange={(e) => setProntuario(prev => ({
                            ...prev,
                            educacional: {
                              ...prev.educacional,
                              vulnerabilidades: { ...prev.educacional?.vulnerabilidades, [key]: Number(e.target.value) },
                            },
                          }))} />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <strong>Membros</strong>
                    {(prontuario.educacional?.membros || []).map((ed, i) => (
                      <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
                        <button onClick={() => removeEducando(i)} style={{
                          position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                          color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                        }}>×</button>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Nome</label>
                            <input className="form-control" value={ed.nome} onChange={(e) => updateEducando(i, 'nome', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Idade</label>
                            <input className="form-control" value={ed.idade} onChange={(e) => updateEducando(i, 'idade', e.target.value)} />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Sabe Ler</label>
                            <select className="form-control" value={ed.sabe_ler} onChange={(e) => updateEducando(i, 'sabe_ler', e.target.value)}>
                              <option value="">Selecione</option>
                              <option value="S">Sim</option>
                              <option value="N">Não</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Frequenta Escola</label>
                            <select className="form-control" value={ed.frequenta_escola} onChange={(e) => updateEducando(i, 'frequenta_escola', e.target.value)}>
                              <option value="">Selecione</option>
                              <option value="S">Sim</option>
                              <option value="N">Não</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Escolaridade</label>
                            <select className="form-control" value={ed.escolaridade} onChange={(e) => updateEducando(i, 'escolaridade', e.target.value)}>
                              <option value="">Selecione</option>
                              {ESCOLARIDADE_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-outline btn-sm" onClick={addEducando}>
                      + Adicionar Membro Educacional
                    </button>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <strong>Condicionalidades Bolsa Família</strong>
                    {(prontuario.educacional?.condicionalidades_bf || []).map((c, i) => (
                      <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
                        <button onClick={() => removeCondicionalidadeBF(i)} style={{
                          position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                          color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                        }}>×</button>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Mês/Ano</label>
                            <input className="form-control" value={c.mes_ano} onChange={(e) => updateCondicionalidadeBF(i, 'mes_ano', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Efeito</label>
                            <select className="form-control" value={c.efeito} onChange={(e) => updateCondicionalidadeBF(i, 'efeito', e.target.value)}>
                              <option value="">Selecione</option>
                              <option value="Advertência">Advertência</option>
                              <option value="Bloqueio">Bloqueio</option>
                              <option value="1ª Suspensão">1ª Suspensão</option>
                              <option value="2ª Suspensão">2ª Suspensão</option>
                              <option value="Cancelamento">Cancelamento</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-outline btn-sm" onClick={addCondicionalidadeBF}>
                      + Adicionar Condicionalidade
                    </button>
                  </div>
                </div>
              )}

              {secao.key === 'trabalho_renda' && (
                <div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Renda Total sem Programas (R$)</label>
                      <input className="form-control" type="text" inputMode="decimal" value={prontuario.trabalho_renda.renda_total_sem_programas || ''}
                        onChange={(e) => updateSection('trabalho_renda', { renda_total_sem_programas: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Renda Per Capita sem Programas (R$)</label>
                      <input className="form-control" type="text" inputMode="decimal" value={prontuario.trabalho_renda.renda_per_capita_sem_programas || ''}
                        onChange={(e) => updateSection('trabalho_renda', { renda_per_capita_sem_programas: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Renda Total com Programas (R$)</label>
                      <input className="form-control" type="text" inputMode="decimal" value={prontuario.trabalho_renda.renda_total_com_programas || ''}
                        onChange={(e) => updateSection('trabalho_renda', { renda_total_com_programas: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Renda Per Capita com Programas (R$)</label>
                      <input className="form-control" type="text" inputMode="decimal" value={prontuario.trabalho_renda.renda_per_capita_com_programas || ''}
                        onChange={(e) => updateSection('trabalho_renda', { renda_per_capita_com_programas: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Aposentados na Família</label>
                    <textarea className="form-control" rows={2} value={prontuario.trabalho_renda.aposentados || ''}
                      onChange={(e) => updateSection('trabalho_renda', { aposentados: e.target.value })} />
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <strong>Membros (Trabalho e Rendimento)</strong>
                    {(prontuario.trabalho_renda?.membros || []).map((m, i) => (
                      <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
                        <button onClick={() => removeMembroTrabalho(i)} style={{
                          position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                          color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                        }}>×</button>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Nome</label>
                            <input className="form-control" value={m.nome} onChange={(e) => updateMembroTrabalho(i, 'nome', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Idade</label>
                            <input className="form-control" value={m.idade} onChange={(e) => updateMembroTrabalho(i, 'idade', e.target.value)} />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Possui CTPS</label>
                            <select className="form-control" value={m.possui_ctps} onChange={(e) => updateMembroTrabalho(i, 'possui_ctps', e.target.value)}>
                              <option value="">Selecione</option>
                              <option value="S">Sim</option>
                              <option value="N">Não</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Condição de Ocupação</label>
                            <select className="form-control" value={m.condicao_ocupacao} onChange={(e) => updateMembroTrabalho(i, 'condicao_ocupacao', e.target.value)}>
                              <option value="">Selecione</option>
                              {CONDICAO_OCUPACAO_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Possui Qualificação Profissional</label>
                            <select className="form-control" value={m.possui_qualificacao} onChange={(e) => updateMembroTrabalho(i, 'possui_qualificacao', e.target.value)}>
                              <option value="">Selecione</option>
                              <option value="S">Sim</option>
                              <option value="N">Não</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Qualificação</label>
                            <input className="form-control" value={m.qualificacao} onChange={(e) => updateMembroTrabalho(i, 'qualificacao', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Renda Mensal (R$)</label>
                            <input className="form-control" value={m.renda_mensal} onChange={(e) => updateMembroTrabalho(i, 'renda_mensal', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-outline btn-sm" onClick={addMembroTrabalho}>
                      + Adicionar Membro
                    </button>
                  </div>
                </div>
              )}

              {secao.key === 'saude' && (
                <div>
                  <div style={{ marginTop: 8 }}>
                    <strong>Deficiências</strong>
                    {(prontuario.saude?.deficiencias || []).map((d, i) => (
                      <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
                        <button onClick={() => removeDeficiencia(i)} style={{
                          position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                          color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                        }}>×</button>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Nome</label>
                            <input className="form-control" value={d.nome} onChange={(e) => updateDeficiencia(i, 'nome', e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Tipos de Deficiência</label>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {TIPO_DEFICIENCIA_OPCOES.map(tipo => (
                              <label key={tipo} className="checkbox-label">
                                <input type="checkbox" checked={(d.tipos || []).includes(tipo)}
                                  onChange={() => toggleDeficienciaTipo(i, tipo)} />
                                {' '}{tipo}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Necessita Cuidador</label>
                            <div className="radio-group">
                              {SIM_NAO_OPCOES.map(o => (
                                <label key={o} className="radio-label" style={{ display: 'inline-block', marginRight: 8 }}>
                                  <input type="radio" name={`cuidador_${i}`} value={o}
                                    checked={d.necessita_cuidador === o}
                                    onChange={(e) => updateDeficiencia(i, 'necessita_cuidador', e.target.value)} />
                                  {' '}{o}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Responsável/Cuidador</label>
                            <input className="form-control" value={d.responsavel_cuidador || ''}
                              onChange={(e) => updateDeficiencia(i, 'responsavel_cuidador', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-outline btn-sm" onClick={addDeficiencia}>
                      + Adicionar Deficiência
                    </button>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    {[
                      { key: 'pessoa_necessita_cuidados', label: 'Pessoa que necessita de cuidados', fields: ['nomes', 'responsavel'] },
                      { key: 'inseguranca_alimentar', label: 'Insegurança Alimentar', fields: ['data'] },
                      { key: 'doencas_graves', label: 'Doenças Graves', fields: ['descricao'] },
                      { key: 'remedios_controlados', label: 'Remédios Controlados', fields: ['nomes'] },
                      { key: 'uso_alcool', label: 'Uso de Álcool', fields: ['nomes', 'data'] },
                      { key: 'uso_drogas', label: 'Uso de Drogas', fields: ['nomes_substancias', 'data'] },
                    ].map(({ key, label, fields }) => (
                      <div key={key} style={{ marginTop: 12 }}>
                        <label>{label}</label>
                        <div className="radio-group">
                          {SIM_NAO_OPCOES.map(o => (
                            <label key={o} className="radio-label" style={{ display: 'inline-block', marginRight: 8 }}>
                              <input type="radio" name={key} value={o}
                                checked={prontuario.saude?.[key]?.resposta === o}
                                onChange={(e) => updateSaudeField(key, 'resposta', e.target.value)} />
                              {' '}{o}
                            </label>
                          ))}
                        </div>
                        {prontuario.saude?.[key]?.resposta === 'Sim' && fields.map(f => (
                          <div key={f} className="form-group" style={{ marginTop: 4 }}>
                            <input className="form-control" placeholder={f.replace(/_/g, ' ')}
                              value={prontuario.saude?.[key]?.[f] || ''}
                              onChange={(e) => updateSaudeField(key, f, e.target.value)} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <strong>Gestantes</strong>
                    {(prontuario.saude?.gestantes || []).map((g, i) => (
                      <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
                        <button onClick={() => removeGestante(i)} style={{
                          position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                          color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                        }}>×</button>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Nome</label>
                            <input className="form-control" value={g.nome} onChange={(e) => updateGestante(i, 'nome', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Meses de Gestação</label>
                            <input type="number" className="form-control" min={0} max={9} value={g.meses_gestacao ?? ''}
                              onChange={(e) => updateGestante(i, 'meses_gestacao', Number(e.target.value))} />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Pré-natal</label>
                            <select className="form-control" value={g.pre_natal} onChange={(e) => updateGestante(i, 'pre_natal', e.target.value)}>
                              <option value="">Selecione</option>
                              <option value="S">Sim</option>
                              <option value="N">Não</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Data da Anotação</label>
                            <input type="date" className="form-control" value={g.data_anotacao || ''}
                              onChange={(e) => updateGestante(i, 'data_anotacao', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-outline btn-sm" onClick={addGestante}>
                      + Adicionar Gestante
                    </button>
                  </div>
                </div>
              )}

              {secao.key === 'beneficios' && (
                <div>
                  <strong>Registros de Benefícios Eventuais</strong>
                  {(prontuario.beneficios?.registros || []).map((b, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
                      <button onClick={() => removeBeneficio(i)} style={{
                        position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                        color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                      }}>×</button>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Data</label>
                          <input type="date" className="form-control" value={b.data || ''}
                            onChange={(e) => updateBeneficio(i, 'data', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Tipo</label>
                          <select className="form-control" value={b.tipo} onChange={(e) => updateBeneficio(i, 'tipo', e.target.value)}>
                            <option value="">Selecione</option>
                            {TIPO_BENEFICIO_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Observação</label>
                        <textarea className="form-control" rows={2} value={b.observacao || ''}
                          onChange={(e) => updateBeneficio(i, 'observacao', e.target.value)} />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Registro de Nascimento</label>
                          <input className="form-control" value={b.registro_nascimento || ''}
                            onChange={(e) => updateBeneficio(i, 'registro_nascimento', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>CPF do Falecido</label>
                          <input className="form-control" value={b.cpf_falecido || ''}
                            onChange={(e) => updateBeneficio(i, 'cpf_falecido', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-outline btn-sm" onClick={addBeneficio}>
                    + Adicionar Benefício
                  </button>
                </div>
              )}

              {secao.key === 'convivencia' && (
                <div>
                  {[
                    { key: 'dependentes_sozinhos', label: 'Dependentes ficam sozinhos' },
                    { key: 'discriminacao', label: 'Discriminação na comunidade' },
                    { key: 'rede_apoio_parentes', label: 'Rede de apoio (parentes)' },
                    { key: 'rede_apoio_vizinhos', label: 'Rede de apoio (vizinhos)' },
                    { key: 'grupos_religiosos_comunitarios', label: 'Grupos religiosos/comunitários' },
                  ].map(({ key, label }) => (
                    <div key={key} style={{ marginTop: 12 }}>
                      <label>{label}</label>
                      <div className="radio-group">
                        {SIM_NAO_OPCOES.map(o => (
                          <label key={o} className="radio-label" style={{ display: 'inline-block', marginRight: 8 }}>
                            <input type="radio" name={`conv_${key}`} value={o}
                              checked={prontuario.convivencia?.[key]?.resposta === o}
                              onChange={(e) => setProntuario(prev => ({
                                ...prev,
                                convivencia: {
                                  ...prev.convivencia,
                                  [key]: { ...prev.convivencia?.[key], resposta: e.target.value },
                                },
                              }))} />
                            {' '}{o}
                          </label>
                        ))}
                      </div>
                      {prontuario.convivencia?.[key]?.resposta === 'Sim' && (
                        <div className="form-group" style={{ marginTop: 4 }}>
                          <textarea className="form-control" rows={2} placeholder="Observação"
                            value={prontuario.convivencia?.[key]?.observacao || ''}
                            onChange={(e) => setProntuario(prev => ({
                              ...prev,
                              convivencia: {
                                ...prev.convivencia,
                                [key]: { ...prev.convivencia?.[key], observacao: e.target.value },
                              },
                            }))} />
                        </div>
                      )}
                    </div>
                  ))}

                  <div style={{ marginTop: 16 }}>
                    <strong>Tempo de Residência</strong>
                    {['estado', 'municipio', 'bairro'].map(local => (
                      <div key={local} className="form-row" style={{ marginTop: 8 }}>
                        <div className="form-group">
                          <label>{local.charAt(0).toUpperCase() + local.slice(1)} (anos)</label>
                          <input type="number" className="form-control" min={0}
                            value={prontuario.convivencia?.tempo_residencia?.[local]?.anos ?? ''}
                            onChange={(e) => setProntuario(prev => ({
                              ...prev,
                              convivencia: {
                                ...prev.convivencia,
                                tempo_residencia: {
                                  ...prev.convivencia?.tempo_residencia,
                                  [local]: { ...prev.convivencia?.tempo_residencia?.[local], anos: Number(e.target.value) },
                                },
                              },
                            }))} />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                          <label className="checkbox-label">
                            <input type="checkbox"
                              checked={prontuario.convivencia?.tempo_residencia?.[local]?.sempre || false}
                              onChange={(e) => setProntuario(prev => ({
                                ...prev,
                                convivencia: {
                                  ...prev.convivencia,
                                  tempo_residencia: {
                                    ...prev.convivencia?.tempo_residencia,
                                    [local]: { ...prev.convivencia?.tempo_residencia?.[local], sempre: e.target.checked },
                                  },
                                },
                              }))} />
                            {' '}Sempre morou
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 16 }}>
                    {[
                      { key: 'lazer_crianca', label: 'Lazer para crianças' },
                      { key: 'lazer_idoso', label: 'Lazer para idosos' },
                    ].map(({ key, label }) => (
                      <div key={key} style={{ marginTop: 12 }}>
                        <label>{label}</label>
                        <div className="radio-group">
                          {['Sim', 'Não', 'Não se aplica'].map(o => (
                            <label key={o} className="radio-label" style={{ display: 'inline-block', marginRight: 8 }}>
                              <input type="radio" name={`conv_${key}`} value={o}
                                checked={prontuario.convivencia?.[key]?.resposta === o}
                                onChange={(e) => setProntuario(prev => ({
                                  ...prev,
                                  convivencia: {
                                    ...prev.convivencia,
                                    [key]: { ...prev.convivencia?.[key], resposta: e.target.value },
                                  },
                                }))} />
                              {' '}{o}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <strong>Relações Intrafamiliares</strong>
                    {[
                      { key: 'relacoes_conjugais', label: 'Relações Conjugais' },
                      { key: 'relacoes_pais_filhos', label: 'Relações Pais/Filhos' },
                      { key: 'relacoes_irmaos', label: 'Relações entre Irmãos' },
                    ].map(({ key, label }) => (
                      <div key={key} style={{ marginTop: 12 }}>
                        <strong>{label}</strong>
                        {(prontuario.convivencia?.[key] || []).map((rel, i) => (
                          <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
                            <button onClick={() => {
                              const list = [...(prontuario.convivencia?.[key] || [])]
                              list.splice(i, 1)
                              setProntuario(prev => ({ ...prev, convivencia: { ...prev.convivencia, [key]: list } }))
                            }} style={{
                              position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                              color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                            }}>×</button>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Técnico</label>
                                <input className="form-control" value={rel.tecnico || ''}
                                  onChange={(e) => {
                                    const list = [...(prontuario.convivencia?.[key] || [])]
                                    list[i] = { ...list[i], tecnico: e.target.value }
                                    setProntuario(prev => ({ ...prev, convivencia: { ...prev.convivencia, [key]: list } }))
                                  }} />
                              </div>
                              <div className="form-group">
                                <label>Data</label>
                                <input type="date" className="form-control" value={rel.data || ''}
                                  onChange={(e) => {
                                    const list = [...(prontuario.convivencia?.[key] || [])]
                                    list[i] = { ...list[i], data: e.target.value }
                                    setProntuario(prev => ({ ...prev, convivencia: { ...prev.convivencia, [key]: list } }))
                                  }} />
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Avaliação</label>
                              <select className="form-control" value={rel.avaliacao || ''}
                                onChange={(e) => {
                                  const list = [...(prontuario.convivencia?.[key] || [])]
                                  list[i] = { ...list[i], avaliacao: e.target.value }
                                  setProntuario(prev => ({ ...prev, convivencia: { ...prev.convivencia, [key]: list } }))
                                }}>
                                <option value="">Selecione</option>
                                {AVALIACAO_RELACAO_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </div>
                          </div>
                      ))}
                      <button className="btn btn-outline btn-sm" onClick={() => {
                        const list = [...(prontuario.convivencia?.[key] || []), { tecnico: '', data: '', avaliacao: '' }]
                        setProntuario(prev => ({ ...prev, convivencia: { ...prev.convivencia, [key]: list } }))
                      }}>
                        + Adicionar {label}
                      </button>
                    </div>
                  ))}
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <label>Outros Conflitos</label>
                    <select className="form-control" value={prontuario.convivencia?.outros_conflitos || ''}
                      onChange={(e) => setProntuario(prev => ({
                        ...prev,
                        convivencia: { ...prev.convivencia, outros_conflitos: e.target.value },
                      }))}>
                      <option value="">Selecione</option>
                      <option value="Sim com violência">Sim com violência</option>
                      <option value="Sim sem violência">Sim sem violência</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>
                </div>
              )}

              {secao.key === 'violencia' && (
                <div>
                  <strong>Quadro 1 — Tipos de Violência</strong>
                  {[
                    'Violência Física', 'Violência Psicológica', 'Violência Sexual',
                    'Violência Patrimonial', 'Negligência/Abandono', 'Trabalho Infantil',
                    'Violência Institucional', 'Discriminação', 'Tráfico de Pessoas',
                    'Outras Violações',
                  ].map((tipo, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                          <label>Tipo</label>
                          <input className="form-control" value={tipo} readOnly style={{ background: '#f5f5f5' }} />
                        </div>
                        <div className="form-group">
                          <label>Persiste?</label>
                          <select className="form-control"
                            value={prontuario.violencia?.quadro1?.[i]?.persiste || ''}
                            onChange={(e) => {
                              const list = [...(prontuario.violencia?.quadro1 || [])]
                              if (!list[i]) list[i] = { tipo, persiste: '', data_anotacao: '' }
                              list[i] = { ...list[i], persiste: e.target.value }
                              setProntuario(prev => ({ ...prev, violencia: { ...prev.violencia, quadro1: list } }))
                            }}>
                            <option value="">Selecione</option>
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Data da Anotação</label>
                          <input type="date" className="form-control"
                            value={prontuario.violencia?.quadro1?.[i]?.data_anotacao || ''}
                            onChange={(e) => {
                              const list = [...(prontuario.violencia?.quadro1 || [])]
                              if (!list[i]) list[i] = { tipo, persiste: '', data_anotacao: '' }
                              list[i] = { ...list[i], data_anotacao: e.target.value }
                              setProntuario(prev => ({ ...prev, violencia: { ...prev.violencia, quadro1: list } }))
                            }} />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop: 16 }}>
                    <strong>Quadro 2 — Acompanhamento CREAS (exclusivo CRAS)</strong>
                    {(prontuario.violencia?.quadro2_creas || []).map((q, i) => (
                      <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
                        <button onClick={() => {
                          const list = [...(prontuario.violencia?.quadro2_creas || [])]
                          list.splice(i, 1)
                          setProntuario(prev => ({ ...prev, violencia: { ...prev.violencia, quadro2_creas: list } }))
                        }} style={{
                          position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                          color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                        }}>×</button>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Data de Início</label>
                            <input type="date" className="form-control" value={q.data_inicio || ''}
                              onChange={(e) => {
                                const list = [...(prontuario.violencia?.quadro2_creas || [])]
                                list[i] = { ...list[i], data_inicio: e.target.value }
                                setProntuario(prev => ({ ...prev, violencia: { ...prev.violencia, quadro2_creas: list } }))
                              }} />
                          </div>
                          <div className="form-group">
                            <label>Data de Fim</label>
                            <input type="date" className="form-control" value={q.data_fim || ''}
                              onChange={(e) => {
                                const list = [...(prontuario.violencia?.quadro2_creas || [])]
                                list[i] = { ...list[i], data_fim: e.target.value }
                                setProntuario(prev => ({ ...prev, violencia: { ...prev.violencia, quadro2_creas: list } }))
                              }} />
                          </div>
                          <div className="form-group">
                            <label>Identificação do CREAS</label>
                            <input className="form-control" value={q.identificacao_creas || ''}
                              onChange={(e) => {
                                const list = [...(prontuario.violencia?.quadro2_creas || [])]
                                list[i] = { ...list[i], identificacao_creas: e.target.value }
                                setProntuario(prev => ({ ...prev, violencia: { ...prev.violencia, quadro2_creas: list } }))
                              }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-outline btn-sm" onClick={() => {
                      const list = [...(prontuario.violencia?.quadro2_creas || []), { data_inicio: '', data_fim: '', identificacao_creas: '' }]
                      setProntuario(prev => ({ ...prev, violencia: { ...prev.violencia, quadro2_creas: list } }))
                    }}>
                      + Adicionar Acompanhamento CREAS
                    </button>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <strong>Quadro 3 — Situações (CREAS)</strong>
                    {(prontuario.violencia?.quadro3_creas || []).map((q, i) => (
                      <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
                        <button onClick={() => {
                          const list = [...(prontuario.violencia?.quadro3_creas || [])]
                          list.splice(i, 1)
                          setProntuario(prev => ({ ...prev, violencia: { ...prev.violencia, quadro3_creas: list } }))
                        }} style={{
                          position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                          color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                        }}>×</button>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Ordem/Pessoa</label>
                            <input className="form-control" value={q.ordem_pessoa || ''}
                              onChange={(e) => {
                                const list = [...(prontuario.violencia?.quadro3_creas || [])]
                                list[i] = { ...list[i], ordem_pessoa: e.target.value }
                                setProntuario(prev => ({ ...prev, violencia: { ...prev.violencia, quadro3_creas: list } }))
                              }} />
                          </div>
                          <div className="form-group">
                            <label>Código da Situação</label>
                            <input className="form-control" value={q.codigo_situacao || ''}
                              onChange={(e) => {
                                const list = [...(prontuario.violencia?.quadro3_creas || [])]
                                list[i] = { ...list[i], codigo_situacao: e.target.value }
                                setProntuario(prev => ({ ...prev, violencia: { ...prev.violencia, quadro3_creas: list } }))
                              }} />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Tipo</label>
                            <div className="radio-group">
                              {['Indício', 'Confirmada'].map(o => (
                                <label key={o} className="radio-label" style={{ display: 'inline-block', marginRight: 8 }}>
                                  <input type="radio" name={`quadro3_tipo_${i}`} value={o}
                                    checked={q.tipo === o}
                                    onChange={(e) => {
                                      const list = [...(prontuario.violencia?.quadro3_creas || [])]
                                      list[i] = { ...list[i], tipo: e.target.value }
                                      setProntuario(prev => ({ ...prev, violencia: { ...prev.violencia, quadro3_creas: list } }))
                                    }} />
                                  {' '}{o}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Data do Registro</label>
                            <input type="date" className="form-control" value={q.data_registro || ''}
                              onChange={(e) => {
                                const list = [...(prontuario.violencia?.quadro3_creas || [])]
                                list[i] = { ...list[i], data_registro: e.target.value }
                                setProntuario(prev => ({ ...prev, violencia: { ...prev.violencia, quadro3_creas: list } }))
                              }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-outline btn-sm" onClick={() => {
                      const list = [...(prontuario.violencia?.quadro3_creas || []), { ordem_pessoa: '', codigo_situacao: '', tipo: '', data_registro: '' }]
                      setProntuario(prev => ({ ...prev, violencia: { ...prev.violencia, quadro3_creas: list } }))
                    }}>
                      + Adicionar Situação
                    </button>
                  </div>
                </div>
              )}

              {secao.key === 'participacao' && (
                <div>
                  {Object.entries(prontuario.participacao || {}).map(([field, value]) => (
                    <div className="form-group" key={field}>
                      <label>{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                      <textarea className="form-control" rows={2} value={value || ''}
                        onChange={(e) => updateSection('participacao', { [field]: e.target.value })} />
                    </div>
                  ))}
                </div>
              )}

              {secao.key === 'medidas_socioeducativas' && (
                <div>
                  <strong>Medidas Socioeducativas</strong>
                  {(prontuario.medidas_socioeducativas || []).map((m, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
                      <button onClick={() => removeMedida(i)} style={{
                        position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                        color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                      }}>×</button>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Nome</label>
                          <input className="form-control" value={m.nome || ''} onChange={(e) => updateMedida(i, 'nome', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Tipo de Medida</label>
                          <select className="form-control" value={m.tipo_medida || ''} onChange={(e) => updateMedida(i, 'tipo_medida', e.target.value)}>
                            <option value="">Selecione</option>
                            {TIPO_MEDIDA_OPCOES.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Número do Processo</label>
                          <input className="form-control" value={m.numero_processo || ''} onChange={(e) => updateMedida(i, 'numero_processo', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Data de Início</label>
                          <input type="date" className="form-control" value={m.data_inicio || ''} onChange={(e) => updateMedida(i, 'data_inicio', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Data de Fim</label>
                          <input type="date" className="form-control" value={m.data_fim || ''} onChange={(e) => updateMedida(i, 'data_fim', e.target.value)} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Acompanhamento CREAS</label>
                          <div className="radio-group">
                            {SIM_NAO_OPCOES.map(o => (
                              <label key={o} className="radio-label" style={{ display: 'inline-block', marginRight: 8 }}>
                                <input type="radio" name={`med_creas_${i}`} value={o}
                                  checked={m.acompanhamento_creas?.resposta === o}
                                  onChange={(e) => updateMedidaAcomp(i, 'resposta', e.target.value)} />
                                {' '}{o}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Data do Acompanhamento</label>
                          <input type="date" className="form-control" value={m.acompanhamento_creas?.data || ''}
                            onChange={(e) => updateMedidaAcomp(i, 'data', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Local PSC</label>
                          <input className="form-control" value={m.local_psc || ''} onChange={(e) => updateMedida(i, 'local_psc', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-outline btn-sm" onClick={addMedida}>
                    + Adicionar Medida Socioeducativa
                  </button>
                </div>
              )}

              {secao.key === 'acolhimento_institucional' && (
                <div>
                  <strong>Histórico de Acolhimento</strong>
                  {(prontuario.acolhimento_institucional?.historico || []).map((h, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
                      <button onClick={() => removeHistoricoAcolhimento(i)} style={{
                        position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                        color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                      }}>×</button>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Nome</label>
                          <input className="form-control" value={h.nome || ''} onChange={(e) => updateHistoricoAcolhimento(i, 'nome', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Data de Início</label>
                          <input type="date" className="form-control" value={h.data_inicio || ''} onChange={(e) => updateHistoricoAcolhimento(i, 'data_inicio', e.target.value)} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Data de Fim</label>
                          <input type="date" className="form-control" value={h.data_fim || ''} onChange={(e) => updateHistoricoAcolhimento(i, 'data_fim', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Motivo</label>
                          <input className="form-control" value={h.motivo || ''} onChange={(e) => updateHistoricoAcolhimento(i, 'motivo', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-outline btn-sm" onClick={addHistoricoAcolhimento}>
                    + Adicionar Histórico
                  </button>

                  <div style={{ marginTop: 16 }}>
                    <strong>Acolhimento para Família</strong>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Período</label>
                        <input className="form-control" value={prontuario.acolhimento_institucional?.acolhimento_familia?.periodo || ''}
                          onChange={(e) => setProntuario(prev => ({
                            ...prev,
                            acolhimento_institucional: {
                              ...prev.acolhimento_institucional,
                              acolhimento_familia: { ...prev.acolhimento_institucional?.acolhimento_familia, periodo: e.target.value },
                            },
                          }))} />
                      </div>
                      <div className="form-group">
                        <label>Motivo</label>
                        <input className="form-control" value={prontuario.acolhimento_institucional?.acolhimento_familia?.motivo || ''}
                          onChange={(e) => setProntuario(prev => ({
                            ...prev,
                            acolhimento_institucional: {
                              ...prev.acolhimento_institucional,
                              acolhimento_familia: { ...prev.acolhimento_institucional?.acolhimento_familia, motivo: e.target.value },
                            },
                          }))} />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <strong>Guarda Informal</strong>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Período</label>
                        <input className="form-control" value={prontuario.acolhimento_institucional?.guarda_informal?.periodo || ''}
                          onChange={(e) => setProntuario(prev => ({
                            ...prev,
                            acolhimento_institucional: {
                              ...prev.acolhimento_institucional,
                              guarda_informal: { ...prev.acolhimento_institucional?.guarda_informal, periodo: e.target.value },
                            },
                          }))} />
                      </div>
                      <div className="form-group">
                        <label>Razão</label>
                        <input className="form-control" value={prontuario.acolhimento_institucional?.guarda_informal?.razao || ''}
                          onChange={(e) => setProntuario(prev => ({
                            ...prev,
                            acolhimento_institucional: {
                              ...prev.acolhimento_institucional,
                              guarda_informal: { ...prev.acolhimento_institucional?.guarda_informal, razao: e.target.value },
                            },
                          }))} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Responsável</label>
                        <input className="form-control" value={prontuario.acolhimento_institucional?.guarda_informal?.responsavel || ''}
                          onChange={(e) => setProntuario(prev => ({
                            ...prev,
                            acolhimento_institucional: {
                              ...prev.acolhimento_institucional,
                              guarda_informal: { ...prev.acolhimento_institucional?.guarda_informal, responsavel: e.target.value },
                            },
                          }))} />
                      </div>
                      <div className="form-group">
                        <label>Criança/Adolescente</label>
                        <input className="form-control" value={prontuario.acolhimento_institucional?.guarda_informal?.crianca || ''}
                          onChange={(e) => setProntuario(prev => ({
                            ...prev,
                            acolhimento_institucional: {
                              ...prev.acolhimento_institucional,
                              guarda_informal: { ...prev.acolhimento_institucional?.guarda_informal, crianca: e.target.value },
                            },
                          }))} />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label className="checkbox-label" style={{ display: 'block', marginBottom: 8 }}>
                      <input type="checkbox" checked={prontuario.acolhimento_institucional?.membro_prisao || false}
                        onChange={(e) => setProntuario(prev => ({
                          ...prev,
                          acolhimento_institucional: { ...prev.acolhimento_institucional, membro_prisao: e.target.checked },
                        }))} />
                      {' '}Membro da família preso
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" checked={prontuario.acolhimento_institucional?.adolescente_internacao || false}
                        onChange={(e) => setProntuario(prev => ({
                          ...prev,
                          acolhimento_institucional: { ...prev.acolhimento_institucional, adolescente_internacao: e.target.checked },
                        }))} />
                      {' '}Adolescente em internação
                    </label>
                  </div>
                </div>
              )}

              {secao.key === 'planejamento_evolucao' && (
                <div>
                  <strong>Inclusão/Desligamento PAIF/PAEFI</strong>
                  {(prontuario.planejamento_evolucao?.inclusao_desligamento || []).map((r, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative' }}>
                      <button onClick={() => removeInclusaoDesligamento(i)} style={{
                        position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                        color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                      }}>×</button>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="checkbox-label">
                            <input type="checkbox" checked={r.incluir || false}
                              onChange={(e) => updateInclusaoDesligamento(i, 'incluir', e.target.checked)} />
                            {' '}Incluir
                          </label>
                        </div>
                        <div className="form-group">
                          <label>Data de Inclusão</label>
                          <input type="date" className="form-control" value={r.data_inclusao || ''}
                            onChange={(e) => updateInclusaoDesligamento(i, 'data_inclusao', e.target.value)} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="checkbox-label">
                            <input type="checkbox" checked={r.desligar || false}
                              onChange={(e) => updateInclusaoDesligamento(i, 'desligar', e.target.checked)} />
                            {' '}Desligar
                          </label>
                        </div>
                        <div className="form-group">
                          <label>Data de Desligamento</label>
                          <input type="date" className="form-control" value={r.data_desligamento || ''}
                            onChange={(e) => updateInclusaoDesligamento(i, 'data_desligamento', e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Razão do Desligamento</label>
                        <select className="form-control" value={r.razao_desligamento || ''}
                          onChange={(e) => updateInclusaoDesligamento(i, 'razao_desligamento', e.target.value)}>
                          <option value="">Selecione</option>
                          <option value="Desligamento programado">Desligamento programado</option>
                          <option value="Transferência">Transferência</option>
                          <option value="Desistência">Desistência</option>
                          <option value="Não localizado">Não localizado</option>
                          <option value="Óbito">Óbito</option>
                          <option value="Mudança de município">Mudança de município</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-outline btn-sm" onClick={addInclusaoDesligamento}>
                    + Adicionar Registro
                  </button>

                  <div style={{ marginTop: 16 }}>
                    <div className="form-group">
                      <label>Planejamento Inicial</label>
                      <textarea className="form-control" rows={4} value={prontuario.planejamento_evolucao?.planejamento_inicial || ''}
                        onChange={(e) => setProntuario(prev => ({
                          ...prev,
                          planejamento_evolucao: { ...prev.planejamento_evolucao, planejamento_inicial: e.target.value },
                        }))} />
                    </div>
                    <div className="form-group" style={{ marginTop: 8 }}>
                      <label>Evolução</label>
                      <textarea className="form-control" rows={4} value={prontuario.planejamento_evolucao?.evolucao || ''}
                        onChange={(e) => setProntuario(prev => ({
                          ...prev,
                          planejamento_evolucao: { ...prev.planejamento_evolucao, evolucao: e.target.value },
                        }))} />
                    </div>
                  </div>
                </div>
              )}

              {secao.key === 'encaminhamentos' && (
                <div>
                  {(prontuario.encaminhamentos || []).map((enc, i) => (
                    <div key={i} style={{
                      border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8,
                      position: 'relative',
                    }}>
                      <button onClick={() => removeEncaminhamento(i)} style={{
                        position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                        color: 'var(--danger)', cursor: 'pointer', fontSize: 18,
                      }}>×</button>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Área</label>
                          <select className="form-control" value={enc.area || ''} onChange={(e) => updateEncaminhamento(i, 'area', e.target.value)}>
                            <option value="">Selecione</option>
                            <option value="Outra Unidade/Serviço Assist. Social">Outra Unidade/Serviço Assist. Social</option>
                            <option value="Saúde">Saúde</option>
                            <option value="Educação">Educação</option>
                            <option value="INSS">INSS</option>
                            <option value="Habitação">Habitação</option>
                            <option value="Defensoria Pública">Defensoria Pública</option>
                            <option value="Outra">Outra</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Órgão Destino</label>
                          <input className="form-control" value={enc.orgao_destino || ''} onChange={(e) => updateEncaminhamento(i, 'orgao_destino', e.target.value)} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Objetivo/Motivo</label>
                          <input className="form-control" value={enc.objetivo_motivo || ''} onChange={(e) => updateEncaminhamento(i, 'objetivo_motivo', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Data</label>
                          <input type="date" className="form-control" value={enc.data} onChange={(e) => updateEncaminhamento(i, 'data', e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Contra-Referência</label>
                        <textarea className="form-control" rows={2} value={enc.contra_referencia || ''}
                          onChange={(e) => updateEncaminhamento(i, 'contra_referencia', e.target.value)} />
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-outline btn-sm" onClick={addEncaminhamento}>
                    + Adicionar Encaminhamento
                  </button>
                </div>
              )}

              {secao.key === 'observacoes' && (
                <div className="form-group">
                  <textarea className="form-control" rows={6}
                    value={prontuario.observacoes || ''}
                    onChange={(e) => updateSection('observacoes', e.target.value)}
                    placeholder="Observações técnicas sobre o atendimento..." />
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>Cancelar</button>
        <button className="btn btn-success" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Prontuário'}
        </button>
      </div>
    </Layout>
  )
}
