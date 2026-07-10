import { calcularPrioridade } from '../../utils/triagemScoring'

export default function EtapaRelato({ data, onChange }) {
  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
        Relato e Revisao
      </h3>

      <div className="form-group">
        <label>Descreva sua situacao</label>
        <textarea
          className="form-control"
          rows={4}
          placeholder="Conte com detalhes sua situacao e o que precisa..."
          value={data?.relato || ''}
          onChange={(e) => onChange({ ...data, relato: e.target.value })}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
          Revisao dos Dados
        </h4>

        <div className="card" style={{ background: 'var(--bg-elevated)' }}>
          <RevisaoSecao titulo="Contato">
            <Linha label="Telefone" valor={data?.contato?.telefone} />
            <Linha label="Idade" valor={data?.contato?.idade} />
            <Linha label="Bairro" valor={data?.contato?.bairro_localidade} />
            <Linha label="CRAS" valor={data?.contato?.territorio_cras} />
            {data?.contato?.cartao_sus_nis && <Linha label="Cartao SUS/NIS" valor={data.contato.cartao_sus_nis} />}
            {data?.contato?.ponto_referencia && <Linha label="Referencia" valor={data.contato.ponto_referencia} />}
          </RevisaoSecao>

          <RevisaoSecao titulo="Familia">
            <Linha label="Composicao" valor={data?.familia?.composicao_familiar} />
            <Linha label="Renda" valor={data?.familia?.renda_familiar} />
            {data?.familia?.beneficios_sociais?.length > 0 && (
              <Linha label="Beneficios" valor={data.familia.beneficios_sociais.join(', ')} />
            )}
          </RevisaoSecao>

          <RevisaoSecao titulo="Motivo">
            <Linha label="Demanda principal" valor={data?.motivo?.demanda_principal} />
            {data?.motivo?.outra_demanda && <Linha label="Outra demanda" valor={data.motivo.outra_demanda} />}
          </RevisaoSecao>

          <RevisaoSecao titulo="Urgencia">
            <Linha label="Nivel" valor={data?.urgencia?.nivel} />
            {data?.urgencia?.situacoes?.length > 0 && (
              <Linha label="Situacoes" valor={data.urgencia.situacoes.join(', ')} />
            )}
            {data?.urgencia?.outra_situacao && (
              <Linha label="Outra situacao" valor={data.urgencia.outra_situacao} />
            )}
          </RevisaoSecao>

          {data?.relato && (
            <RevisaoSecao titulo="Relato">
              <p style={{ fontSize: 14, color: 'var(--text-body)', margin: 0, whiteSpace: 'pre-wrap' }}>
                {data.relato}
              </p>
            </RevisaoSecao>
          )}
        </div>

        <PrioridadePreview dados={data} />
      </div>
    </div>
  )
}

function RevisaoSecao({ titulo, children }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--accent)', marginBottom: 8 }}>
        {titulo}
      </div>
      {children}
    </div>
  )
}

function Linha({ label, valor }) {
  if (!valor) return null
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 13 }}>
      <span style={{ color: 'var(--text-secondary)', minWidth: 120 }}>{label}:</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{valor}</span>
    </div>
  )
}

function PrioridadePreview({ dados }) {
  const { total, prioridade } = calcularPrioridade(dados)

  const cores = {
    ALTA: { bg: '#fee2e2', color: '#dc2626' },
    MEDIA: { bg: '#fef3c7', color: '#d97706' },
    BAIXA: { bg: '#d1fae5', color: '#16a34a' },
  }

  const c = cores[prioridade]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
      padding: '12px 16px',
      borderRadius: 10,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Pontuacao estimada</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{total} pts</span>
        <span
          className="badge"
          style={{ background: c.bg, color: c.color, fontSize: 11, padding: '3px 10px' }}
        >
          {prioridade}
        </span>
      </div>
    </div>
  )
}
