import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import {
  emptyProntuario, emptyMembro, calcularPerfilEtario,
  SECOES, PARENTESCO_OPCOES, DOCUMENTACAO_OPCOES,
  LOCALIZACAO_DOMICILIO_OPCOES, TIPO_UNIDADE_OPCOES,
  FORMA_INGRESSO_OPCOES, PROGRAMAS_SOCIAIS_LISTA, SIM_NAO_OPCOES,
  TIPO_RESIDENCIA_OPCOES, MATERIAL_PAREDES_OPCOES,
  ENERGIA_OPCOES, ABASTECIMENTO_AGUA_OPCOES,
  ESCOAMENTO_OPCOES, COLETA_LIXO_OPCOES,
  ESCOLARIDADE_OPCOES,
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
          setProntuario(pro.dados_json || emptyProntuario())
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
    const novo = { destino: '', motivo: '', data: new Date().toISOString().split('T')[0] }
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
              {saving ? 'Salvando...' : '💾 Salvar Prontuário'}
            </button>
          </div>
        </div>
      </div>

      {SECOES.map((secao) => (
        <div key={secao.key} className="prontuario-section">
          <div className="prontuario-section-header" onClick={() => toggleSection(secao.key)}>
            <span>{secao.icon} {secao.title}</span>
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

              {['trabalho_renda', 'saude', 'beneficios', 'convivencia', 'participacao', 'violencia'].includes(secao.key) && (
                <div>
                  {Object.entries(prontuario[secao.key] || {}).map(([field, value]) => (
                    <div className="form-group" key={field}>
                      <label>{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                      <input className="form-control" value={value || ''}
                        onChange={(e) => updateSection(secao.key, { [field]: e.target.value })} />
                    </div>
                  ))}
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
                          <label>Destino</label>
                          <input className="form-control" value={enc.destino} onChange={(e) => updateEncaminhamento(i, 'destino', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Motivo</label>
                          <input className="form-control" value={enc.motivo} onChange={(e) => updateEncaminhamento(i, 'motivo', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Data</label>
                          <input type="date" className="form-control" value={enc.data} onChange={(e) => updateEncaminhamento(i, 'data', e.target.value)} />
                        </div>
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
          {saving ? 'Salvando...' : '💾 Salvar Prontuário'}
        </button>
      </div>
    </Layout>
  )
}
