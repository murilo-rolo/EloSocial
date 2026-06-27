-- =============================================
-- EloSocial - Migration: Sistema de Agendamentos
-- =============================================

CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Concluído', 'Cancelado', 'Faltou')),
  observacoes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agendamentos_select" ON public.agendamentos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "agendamentos_insert" ON public.agendamentos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "agendamentos_update" ON public.agendamentos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "agendamentos_delete" ON public.agendamentos
  FOR DELETE USING (auth.role() = 'authenticated');
