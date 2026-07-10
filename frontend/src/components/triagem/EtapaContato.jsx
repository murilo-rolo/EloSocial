import { CRAS_LIST } from '../../utils/roles'

export default function EtapaContato({ data, onChange, errors }) {
  const contato = data?.contato || {}

  function formatarTelefone(valor) {
    const digitos = valor.replace(/\D/g, '').slice(0, 11)
    if (digitos.length <= 2) return digitos.replace(/(\d{0,2})/, '($1')
    if (digitos.length <= 7) return digitos.replace(/(\d{2})(\d{0,5})/, '($1) $2')
    return digitos.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  }

  function update(field, value) {
    onChange({ ...data, contato: { ...contato, [field]: value } })
  }

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
        Dados de Contato
      </h3>

      <div className="form-group">
        <label>Telefone *</label>
        <input
          type="text"
          className="form-control"
          placeholder="(00) 00000-0000"
          value={contato.telefone || ''}
          onChange={(e) => update('telefone', formatarTelefone(e.target.value))}
        />
        {errors?.telefone && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.telefone}</span>}
      </div>

      <div className="form-group">
        <label>Idade *</label>
        <input
          type="number"
          className="form-control"
          placeholder="Sua idade"
          value={contato.idade || ''}
          onChange={(e) => update('idade', e.target.value)}
          min={0}
          max={120}
        />
        {errors?.idade && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.idade}</span>}
      </div>

      <div className="form-group">
        <label>Cartao SUS / NIS</label>
        <input
          type="text"
          className="form-control"
          placeholder="Numero do Cartao SUS ou NIS"
          value={contato.cartao_sus_nis || ''}
          onChange={(e) => update('cartao_sus_nis', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Bairro / Localidade *</label>
        <input
          type="text"
          className="form-control"
          placeholder="Seu bairro ou localidade"
          value={contato.bairro_localidade || ''}
          onChange={(e) => update('bairro_localidade', e.target.value)}
        />
        {errors?.bairro_localidade && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.bairro_localidade}</span>}
      </div>

      <div className="form-group">
        <label>Ponto de Referencia</label>
        <input
          type="text"
          className="form-control"
          placeholder="Ponto de referencia proximo"
          value={contato.ponto_referencia || ''}
          onChange={(e) => update('ponto_referencia', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Territorio CRAS *</label>
        <select
          className="form-control"
          value={contato.territorio_cras || ''}
          onChange={(e) => update('territorio_cras', e.target.value)}
        >
          <option value="">Selecione o CRAS</option>
          {CRAS_LIST.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors?.territorio_cras && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.territorio_cras}</span>}
      </div>
    </div>
  )
}
