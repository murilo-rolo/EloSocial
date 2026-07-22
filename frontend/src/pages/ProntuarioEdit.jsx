import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'
import { emptyProntuario, SECOES, PARENTESCO_OPCOES } from '../utils/prontuarioSchema'
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
    const novo = { nome: '', parentesco: '', sexo: '', data_nascimento: '', documentacao: '' }
    setProntuario(prev => ({
      ...prev,
      composicao_familiar: [...(prev.composicao_familiar || []), novo],
    }))
  }

  function updateMembro(index, field, value) {
    const list = [...(prontuario.composicao_familiar || [])]
    list[index] = { ...list[index], [field]: value }
    setProntuario(prev => ({ ...prev, composicao_familiar: list }))
  }

  function removeMembro(index) {
    const list = [...(prontuario.composicao_familiar || [])]
    list.splice(index, 1)
    setProntuario(prev => ({ ...prev, composicao_familiar: list }))
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
                        <div className="form-group">
                          <label>Documentação</label>
                          <input className="form-control" value={membro.documentacao} onChange={(e) => updateMembro(i, 'documentacao', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-outline btn-sm" onClick={addMembro}>
                    + Adicionar Membro
                  </button>
                </div>
              )}

              {['habitacional', 'educacional', 'trabalho_renda', 'saude', 'beneficios', 'convivencia', 'participacao', 'violencia'].includes(secao.key) && (
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
