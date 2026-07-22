import { describe, it, expect } from 'vitest'
import { migrarSchemaAntigo, emptyProntuario } from '../prontuarioSchema'

describe('migrarSchemaAntigo', () => {
  it('returns full new schema for old schema without localizacao_domicilio', () => {
    const antigo = {
      identificacao: { logradouro: 'Rua A', numero: '100' },
      composicao_familiar: [{ nome: 'João', parentesco: 'Filho' }],
      observacoes: 'Texto antigo',
    }
    const result = migrarSchemaAntigo(antigo)
    expect(result.identificacao.localizacao_domicilio).toBe('')
    expect(result.identificacao.logradouro).toBe('Rua A')
    expect(result.identificacao.numero).toBe('100')
    expect(result.identificacao.apelido).toBe('')
    expect(result.habitacional.tipo_residencia).toBe('')
    expect(result.convivencia.dependentes_sozinhos.resposta).toBe('')
    expect(result.violencia.quadro1).toEqual([])
    expect(result.observacoes).toBe('Texto antigo')
  })

  it('preserves existing fields and adds missing ones for partial schema', () => {
    const parcial = {
      identificacao: { logradouro: 'Rua X', forma_ingresso: 'Busca ativa' },
      composicao_familiar: [{ nome: 'Ana', parentesco: 'Cônjuge' }],
      observacoes: 'Obs existente',
    }
    const result = migrarSchemaAntigo(parcial)
    expect(result.identificacao.logradouro).toBe('Rua X')
    expect(result.identificacao.forma_ingresso).toBe('Busca ativa')
    expect(result.identificacao.localizacao_domicilio).toBe('')
    expect(result.identificacao.apelido).toBe('')
    expect(result.composicao_familiar).toEqual([{ nome: 'Ana', parentesco: 'Cônjuge' }])
    expect(result.observacoes).toBe('Obs existente')
    expect(result.habitacional.tipo_residencia).toBe('')
  })

  it('returns data unchanged for already new schema', () => {
    const novo = emptyProntuario()
    novo.identificacao.logradouro = 'Rua Nova'
    novo.identificacao.localizacao_domicilio = 'Urbano'
    const result = migrarSchemaAntigo(novo)
    expect(result).toBe(novo)
    expect(result.identificacao.logradouro).toBe('Rua Nova')
    expect(result.identificacao.localizacao_domicilio).toBe('Urbano')
  })

  it('returns full emptyProntuario for empty object', () => {
    const result = migrarSchemaAntigo({})
    const esperado = emptyProntuario()
    expect(result).toEqual(esperado)
  })

  it('handles null/undefined gracefully', () => {
    expect(migrarSchemaAntigo(null)).toEqual(emptyProntuario())
    expect(migrarSchemaAntigo(undefined)).toEqual(emptyProntuario())
  })
})