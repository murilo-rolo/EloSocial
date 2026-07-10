# 07 — Documentos do Caso (Cofre Digital)

## Contexto

O EloSocial já permite anexar PDFs a prontuários via `ProntuarioView.jsx`, usando tabela `prontuario_anexos` e Storage bucket `prontuario_anexos`. A extensão cria um sistema de documentos vinculados ao caso de atendimento, permitindo upload de qualquer tipo de arquivo por requerentes e profissionais.

**Referência EloSocial**: `ProntuarioView.jsx` (upload/download de PDFs, `prontuario_anexos`, Storage `prontuario_anexos`)

---

## RF — Requisitos Funcionais

### RF-01: Tabela de metadados

Cada documento possui: `id`, `caso_id` (FK triagens), `enviado_por_id`, `enviado_por_tipo` (requerente/assistente), `nome_arquivo`, `caminho_arquivo` (path no Storage), `tipo_arquivo` (MIME type), `tamanho_bytes`, `descricao` (opcional), `created_at`.

### RF-02: Componente compartilhado

Criar componente `DocumentosCaso` que receba `casoId` e `modo` ('requerente' ou 'assistente').

### RF-03: Upload de documentos

O fluxo de upload deve:
1. Permitir seleção de arquivo (qualquer tipo, não apenas PDF)
2. Enviar para Supabase Storage no bucket `documentos-caso`, caminho `{casoId}/{timestamp}-{nome_sanitizado}`
3. Inserir metadado na tabela `documentos_caso`
4. Atualizar a lista de documentos

### RF-04: Lista de documentos

Exibir todos os documentos do caso com:
- Nome do arquivo
- Descrição (se houver)
- Quem enviou (requerente ou assistente)
- Tamanho do arquivo
- Data de envio

### RF-05: Visualização/Download

Criar URL assinada (60 segundos de validade) a partir do Storage e abrir em nova aba.

### RF-06: Exclusão de documentos

- Requerente pode excluir apenas documentos que ele próprio enviou
- Assistente pode excluir qualquer documento
- Exclusão remove tanto o arquivo do Storage quanto o metadado do banco

### RF-07: Página do requerente

Criar `CofreDigitalRequerente.jsx` que:
1. Busca o caso mais recente do requerente
2. Se não existe caso → mensagem informativa
3. Se existe → renderiza `DocumentosCaso` com modo `requerente`

### RF-08: Acesso do profissional

O profissional deve acessar os documentos a partir do detalhe do caso, usando o mesmo componente com modo `assistente`.

### RF-09: Atualização em tempo real

Assinar Realtime na tabela `documentos_caso` filtrado por `caso_id` para refletir uploads e exclusões instantaneamente.

### RF-10: Descrição opcional

O formulário de upload deve permitir adicionar uma descrição ao documento (campo de texto opcional).

---

## RNF — Requisitos Não-Funcionais

### RNF-01: Segurança do Storage

O bucket `documentos-caso` deve ser privado. Acesso apenas via URL assinada, com expiração de 60 segundos.

### RNF-02: Tamanho máximo

Definir limite de tamanho por arquivo (recomendado: 10MB) para evitar abuso do Storage.

### RNF-03: Sanitização de nomes

Nomes de arquivo devem ser sanitizados para caracteres especiais antes de usar como path no Storage.

### RNF-04: Formatação de tamanho

Exibir tamanho do arquivo formatado (B, KB, MB) para melhor experiência do usuário.

### RNF-05: Consistência visual

O componente de upload e lista deve seguir o padrão visual do EloSocial, sendo consistente com a interface de anexos já existente em `ProntuarioView`.
