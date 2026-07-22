-- Add 'em_acompanhamento' to the triagens status CHECK constraint.
-- The PostgreSQL auto-named constraint is triagens_status_check.

ALTER TABLE public.triagens
  DROP CONSTRAINT triagens_status_check,
  ADD CONSTRAINT triagens_status_check
    CHECK (status IN (
      'pendente', 'em_analise', 'em_atendimento',
      'em_acompanhamento', 'concluido', 'cancelado'
    ));
