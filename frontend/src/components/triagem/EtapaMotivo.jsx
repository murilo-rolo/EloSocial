import { useState } from 'react'
import { DEMANDAS_PRINCIPAIS } from '../../utils/triagemOptions'

export default function EtapaMotivo({ data, onChange, errors }) {
  const motivo = data?.motivo || {}
  const [outraDemanda, setOutraDemanda] = useState(motivo.outra_demanda || '')

  function selectDemanda(id) {
    onChange({ ...data, motivo: { ...motivo, demanda_principal: id } })
  }

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
        Qual o motivo da sua busca?
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {DEMANDAS_PRINCIPAIS.map(d => {
          const Icon = d.icon
          const selected = motivo.demanda_principal === d.id
          return (
            <div
              key={d.id}
              onClick={() => selectDemanda(d.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '16px 8px',
                borderRadius: 12,
                border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                background: selected ? 'var(--accent-muted)' : 'var(--bg-surface)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center',
              }}
            >
              <Icon size={24} style={{ color: selected ? 'var(--accent)' : 'var(--text-secondary)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: selected ? 'var(--accent)' : 'var(--text-primary)' }}>
                {d.label}
              </span>
            </div>
          )
        })}
      </div>
      {errors?.demanda_principal && (
        <span style={{ color: 'var(--danger)', fontSize: 12, display: 'block', marginTop: 8 }}>
          {errors.demanda_principal}
        </span>
      )}

      {motivo.demanda_principal === 'Outra necessidade' && (
        <div className="form-group" style={{ marginTop: 16 }}>
          <label>Outra necessidade</label>
          <input
            type="text"
            className="form-control"
            placeholder="Descreva sua necessidade"
            value={outraDemanda}
            onChange={(e) => {
              setOutraDemanda(e.target.value)
              onChange({ ...data, motivo: { ...motivo, outra_demanda: e.target.value } })
            }}
          />
        </div>
      )}
    </div>
  )
}
