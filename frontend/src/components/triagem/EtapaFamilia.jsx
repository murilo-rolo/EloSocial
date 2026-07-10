import { useState } from 'react'
import { COMPOSICAO_FAMILIAR, RENDA_FAMILIAR, BENEFICIOS_SOCIAIS } from '../../utils/triagemOptions'

export default function EtapaFamilia({ data, onChange }) {
  const familia = data?.familia || {}
  const [outroBeneficio, setOutroBeneficio] = useState(familia.outros_beneficios || '')

  function update(field, value) {
    onChange({ ...data, familia: { ...familia, [field]: value } })
  }

  function toggleBeneficio(value) {
    const atual = familia.beneficios_sociais || []
    const opcao = BENEFICIOS_SOCIAIS.find(b => b.value === value)

    if (opcao?.exclusive) {
      update('beneficios_sociais', [value])
      return
    }

    if (atual.includes(value)) {
      update('beneficios_sociais', atual.filter(b => b !== value))
    } else {
      const limpos = atual.filter(b => {
        const opt = BENEFICIOS_SOCIAIS.find(x => x.value === b)
        return !opt?.exclusive
      })
      update('beneficios_sociais', [...limpos, value])
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
        Composicao e Renda Familiar
      </h3>

      <div className="form-group">
        <label>Composicao familiar *</label>
        <select
          className="form-control"
          value={familia.composicao_familiar || ''}
          onChange={(e) => update('composicao_familiar', e.target.value)}
        >
          <option value="">Selecione</option>
          {COMPOSICAO_FAMILIAR.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Renda familiar *</label>
        <select
          className="form-control"
          value={familia.renda_familiar || ''}
          onChange={(e) => update('renda_familiar', e.target.value)}
        >
          <option value="">Selecione</option>
          {RENDA_FAMILIAR.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Beneficios sociais</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BENEFICIOS_SOCIAIS.map(b => (
            <label
              key={b.value}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}
            >
              <input
                type="checkbox"
                checked={(familia.beneficios_sociais || []).includes(b.value)}
                onChange={() => toggleBeneficio(b.value)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
              {b.label}
            </label>
          ))}
        </div>
      </div>

      {(familia.beneficios_sociais || []).includes('Outro') && (
        <div className="form-group">
          <label>Outro beneficio</label>
          <input
            type="text"
            className="form-control"
            placeholder="Descreva o beneficio"
            value={outroBeneficio}
            onChange={(e) => {
              setOutroBeneficio(e.target.value)
              update('outros_beneficios', e.target.value)
            }}
          />
        </div>
      )}
    </div>
  )
}
