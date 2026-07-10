-- Elimina un campo obsoleto de antecedentes médicos.
ALTER TABLE public.fichas_medicas
    DROP COLUMN IF EXISTS club_anterior;
