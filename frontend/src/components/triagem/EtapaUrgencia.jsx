import { useState } from 'react'
import { NIVEIS_URGENCIA, SITUACOES_VULNERABILIDADE } from '../../utils/triagemOptions'

export default function EtapaUrgencia({ data, onChange, errors }) {
  const urgencia = data?.urgencia || {}
  const [outraSituacao, setOutraSituacao] = useState(urgencia.outra_situacao || '')
  const [showOutra, setShowOutra] = useState(false)

  function toggleSituacao(valor) {
    const atual = urgencia.situacoes || []
    if (atual.includes(valor)) {
      onChange({ ...data, urgencia: { ...urgencia, situacoes: atual.filter(s => s !== valor) } })
    } else {
      onChange({ ...data, urgencia: { ...urgencia, situacoes: [...atual, valor] } })
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
        Nivel de Urgencia
      </h3>

      <div className="form-group">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {NIVEIS_URGENCIA.map(n => (
            <label
              key={n.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 10,
                border: `2px solid ${urgencia.nivel === n.value ? 'var(--accent)' : 'var(--border)'}`,
                background: urgencia.nivel === n.value ? 'var(--accent-muted)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="radio"
                name="urgencia"
                value={n.value}
                checked={urgencia.nivel === n.value}
                onChange={(e) => onChange({ ...data, urgencia: { ...urgencia, nivel: e.target.value } })}
                style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
              />
              <span style={{ fontSize: 14, color: urgencia.nivel === n.value ? '#fff' : 'var(--text-primary)' }}>{n.label}</span>
            </label>
          ))}
        </div>
        {errors?.nivel && (
          <span style={{ color: 'var(--danger)', fontSize: 12, display: 'block', marginTop: 8 }}>{errors.nivel}</span>
        )}
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, marginTop: 24, color: 'var(--text-primary)' }}>
        Situacoes de Vulnerabilidade
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
        Selecione todas que se aplicam
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SITUACOES_VULNERABILIDADE.map(s => (
          <label
            key={s}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              border: `1px solid ${(urgencia.situacoes || []).includes(s) ? 'var(--accent)' : 'var(--border)'}`,
              background: (urgencia.situacoes || []).includes(s) ? 'var(--accent-muted)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: 14,
              color: (urgencia.situacoes || []).includes(s) ? '#fff' : 'var(--text-primary)',
            }}
          >
            <input
              type="checkbox"
              checked={(urgencia.situacoes || []).includes(s)}
              onChange={() => toggleSituacao(s)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
            />
            {s}
          </label>
        ))}

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 8,
            border: `1px solid ${showOutra ? 'var(--accent)' : 'var(--border)'}`,
            background: showOutra ? 'var(--accent-muted)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
              fontSize: 14,
              color: showOutra ? '#fff' : 'var(--text-primary)',
            }}
          >
            <input
              type="checkbox"
              checked={showOutra}
              onChange={() => {
                setShowOutra(!showOutra)
                if (showOutra) {
                  setOutraSituacao('')
                  onChange({ ...data, urgencia: { ...urgencia, outra_situacao: '' } })
                }
              }}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
            />
            Outra situacao
        </label>
      </div>

      {showOutra && (
        <div className="form-group" style={{ marginTop: 12 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Descreva a situacao"
            value={outraSituacao}
            onChange={(e) => {
              setOutraSituacao(e.target.value)
              onChange({ ...data, urgencia: { ...urgencia, outra_situacao: e.target.value } })
            }}
          />
        </div>
      )}
    </div>
  )
}
