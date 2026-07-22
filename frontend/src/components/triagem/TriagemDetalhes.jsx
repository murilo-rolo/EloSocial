function Section({ titulo, children }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--accent)', marginBottom: 8 }}>
        {titulo}
      </div>
      {children}
    </div>
  )
}

function Field({ label, valor }) {
  if (!valor) return null
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 13 }}>
      <span style={{ color: 'var(--text-secondary)', minWidth: 120 }}>{label}:</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{valor}</span>
    </div>
  )
}

export default function TriagemDetalhes({ dados }) {
  if (!dados) return null

  const { contato, familia, motivo, urgencia, relato } = dados

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
      <Section titulo="Contato">
        <Field label="Telefone" valor={contato?.telefone} />
        <Field label="Idade" valor={contato?.idade} />
        <Field label="Cartao SUS / NIS" valor={contato?.cartao_sus_nis} />
        <Field label="Bairro / Localidade" valor={contato?.bairro_localidade} />
        <Field label="Ponto de Referencia" valor={contato?.ponto_referencia} />
        <Field label="Territorio CRAS" valor={contato?.territorio_cras} />
      </Section>

      <Section titulo="Familia">
        <Field label="Composicao" valor={familia?.composicao_familiar} />
        <Field label="Renda" valor={familia?.renda_familiar} />
        {familia?.beneficios_sociais?.length > 0 && (
          <Field label="Beneficios" valor={familia.beneficios_sociais.join(', ')} />
        )}
      </Section>

      <Section titulo="Motivo">
        <Field label="Demanda principal" valor={motivo?.demanda_principal} />
        <Field label="Outra demanda" valor={motivo?.outra_demanda} />
      </Section>

      <Section titulo="Urgencia">
        <Field label="Nivel" valor={urgencia?.nivel} />
        {urgencia?.situacoes?.length > 0 && (
          <Field label="Situacoes" valor={urgencia.situacoes.join(', ')} />
        )}
        <Field label="Outra situacao" valor={urgencia?.outra_situacao} />
      </Section>

      {relato && (
        <Section titulo="Relato">
          <p style={{ fontSize: 14, color: 'var(--text-body)', margin: 0, whiteSpace: 'pre-wrap' }}>
            {relato}
          </p>
        </Section>
      )}
    </div>
  )
}
