# 08 — Migração do Banco de Dados

## Visão Geral

Todas as mudanças SQL necessárias para suportar o role `requerente` e as novas funcionalidades de atendimento. Cada seção indica o que modificar ou criar.

---

## 1. Adicionar role `requerente` ao CHECK constraint

A tabela `profiles` possui um CHECK constraint que lista os roles permitidos. Adicionar `requerente`:

```sql
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'assistente_social', 'psicologo', 'pedagogo', 'tecnico', 'gerente', 'requerente'
  ));
```

---

## 2. Adicionar coluna `cras` em `profiles`

O requerente deve ser vinculado a um CRAS. A coluna existe na tabela `CRAS_LIST` do frontend mas não na tabela `profiles`:

```sql
ALTER TABLE public.profiles
  ADD COLUMN cras TEXT;
```

---

## 3. Modificar trigger `handle_new_user`

O trigger atual não lê `cras` do `raw_user_meta_data`. Modificar para suportar:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role, cras)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico'),
    NEW.raw_user_meta_data->>'cras'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Remover validação de email institucional

O trigger `validate_institutional_email` bloqueia emails que não são `gov.br`. Requerentes usam emails pessoais:

```sql
DROP TRIGGER IF EXISTS on_auth_user_email_validation ON auth.users;
DROP FUNCTION IF EXISTS public.validate_institutional_email();
```

---

## 5. Tabela `triagens`

Tabela principal de triagem social do requerente:

```sql
CREATE TABLE public.triagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'em_analise', 'em_atendimento', 'concluido', 'cancelado'
  )),
  prioridade TEXT CHECK (prioridade IN ('ALTA', 'MEDIA', 'BAIXA')),
  dados_acolhimento JSONB NOT NULL DEFAULT '{}',
  detalhes TEXT,
  sintomas TEXT[],
  assistente_social_id UUID REFERENCES public.profiles(id),

  daily_room_name TEXT,
  daily_room_url TEXT,
  daily_room_created_at TIMESTAMPTZ,
  daily_room_expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_triagens_user_id ON public.triagens(user_id);
CREATE INDEX idx_triagens_status ON public.triagens(status);
CREATE INDEX idx_triagens_assistente ON public.triagens(assistente_social_id);
```

**RLS:**

```sql
ALTER TABLE public.triagens ENABLE ROW LEVEL SECURITY;

-- Requerente vê apenas suas próprias triagens
CREATE POLICY "triagens_select_requerente" ON public.triagens
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Profissionais veem todas as triagens
CREATE POLICY "triagens_select_profissional" ON public.triagens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role != 'requerente'
    )
  );

-- Requerente pode criar suas próprias triagens
CREATE POLICY "triagens_insert_requerente" ON public.triagens
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Profissionais podem atualizar qualquer triagem
CREATE POLICY "triagens_update_profissional" ON public.triagens
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role != 'requerente'
    )
  );

-- Requerente pode atualizar suas próprias triagens (edição)
CREATE POLICY "triagens_update_requerente" ON public.triagens
  FOR UPDATE USING (
    user_id = auth.uid()
  );
```

---

## 6. Tabela `mensagens_caso`

Mensagens vinculadas a um caso de atendimento:

```sql
CREATE TABLE public.mensagens_caso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES public.triagens(id) ON DELETE CASCADE NOT NULL,
  remetente_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  conteudo TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mensagens_caso_caso ON public.mensagens_caso(caso_id);
CREATE INDEX idx_mensagens_caso_remetente ON public.mensagens_caso(remetente_id);
```

**RLS:**

```sql
ALTER TABLE public.mensagens_caso ENABLE ROW LEVEL SECURITY;

-- Participantes do caso veem as mensagens
CREATE POLICY "mensagens_caso_select" ON public.mensagens_caso
  FOR SELECT USING (
    remetente_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

-- Participantes do caso podem enviar mensagens
CREATE POLICY "mensagens_caso_insert" ON public.mensagens_caso
  FOR INSERT WITH CHECK (
    remetente_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

-- Remetente pode marcar como lida
CREATE POLICY "mensagens_caso_update" ON public.mensagens_caso
  FOR UPDATE USING (
    remetente_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );
```

---

## 7. Tabela `planos_acao`

Tarefas do plano de ação vinculadas ao caso:

```sql
CREATE TABLE public.planos_acao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES public.triagens(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'em_andamento', 'concluido'
  )),
  responsavel TEXT CHECK (responsavel IN ('requerente', 'assistente')),
  data_limite DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_planos_acao_caso ON public.planos_acao(caso_id);
```

**RLS:**

```sql
ALTER TABLE public.planos_acao ENABLE ROW LEVEL SECURITY;

-- Participantes do caso veem as tarefas
CREATE POLICY "planos_acao_select" ON public.planos_acao
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

-- Assistente social pode criar tarefas
CREATE POLICY "planos_acao_insert" ON public.planos_acao
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND assistente_social_id = auth.uid()
    )
  );

-- Participantes podem atualizar status
CREATE POLICY "planos_acao_update" ON public.planos_acao
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );
```

---

## 8. Tabela `documentos_caso`

Documentos vinculados ao caso de atendimento:

```sql
CREATE TABLE public.documentos_caso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES public.triagens(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documentos_caso_caso ON public.documentos_caso(caso_id);
```

**RLS:**

```sql
ALTER TABLE public.documentos_caso ENABLE ROW LEVEL SECURITY;

-- Participantes do caso veem os documentos
CREATE POLICY "documentos_caso_select" ON public.documentos_caso
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

-- Participantes do caso podem fazer upload
CREATE POLICY "documentos_caso_insert" ON public.documentos_caso
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

-- Participantes do caso podem deletar
CREATE POLICY "documentos_caso_delete" ON public.documentos_caso
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = caso_id AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );
```

---

## 9. Storage bucket `documentos-caso`

Criar bucket para armazenar documentos dos casos:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-caso', 'documentos-caso', false);
```

**RLS no Storage:**

```sql
-- Upload: apenas participantes do caso
CREATE POLICY "documentos_caso_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos-caso' AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = (string_to_array(name, '/'))[1]::uuid AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

-- Download: apenas participantes do caso
CREATE POLICY "documentos_caso_download" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos-caso' AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = (string_to_array(name, '/'))[1]::uuid AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );

-- Delete: apenas participantes do caso
CREATE POLICY "documentos_caso_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documentos-caso' AND
    EXISTS (
      SELECT 1 FROM public.triagens
      WHERE id = (string_to_array(name, '/'))[1]::uuid AND (
        user_id = auth.uid() OR
        assistente_social_id = auth.uid()
      )
    )
  );
```

---

## 10. Habilitar Realtime

Habilitar Realtime na tabela `mensagens_caso` para suportar chat em tempo real:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_caso;
```

---

## Resumo das mudanças

| Tipo | Item | Ação |
|---|---|---|
| Tabela | `profiles` | Adicionar coluna `cras`, atualizar CHECK de `role` |
| Trigger | `handle_new_user` | Modificar para ler `cras` |
| Trigger | `validate_institutional_email` | Remover |
| Tabela | `triagens` | Criar |
| Tabela | `mensagens_caso` | Criar |
| Tabela | `planos_acao` | Criar |
| Tabela | `documentos_caso` | Criar |
| Storage | `documentos-caso` | Criar bucket |
| Realtime | `mensagens_caso` | Habilitar |
| Migration | Arquivo único | `00011_requerente.sql` |
