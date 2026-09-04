-- Un alumno puede existir en varias escuelas, pero no duplicarse dentro de una.
-- Se preservan los registros históricos ya existentes; la regla aplica a altas,
-- restauraciones y cambios de identidad posteriores a esta migración.

CREATE INDEX IF NOT EXISTS idx_alumnos_escuela_fecha_nacimiento
  ON public.alumnos (escuela_id, fecha_nacimiento);

CREATE INDEX IF NOT EXISTS idx_alumnos_escuela_carnet_normalizado
  ON public.alumnos (escuela_id, lower(btrim(carnet_identidad)))
  WHERE carnet_identidad IS NOT NULL AND btrim(carnet_identidad) <> '';

CREATE OR REPLACE FUNCTION private.validar_alumno_unico_misma_escuela()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_carnet_normalizado text;
  v_existente record;
BEGIN
  -- Archivar no crea una nueva inscripción ni cambia la identidad del alumno.
  IF TG_OP = 'UPDATE' AND NEW.archivado IS TRUE THEN
    RETURN NEW;
  END IF;

  -- Evita revisar cambios que no pueden crear una duplicación.
  IF TG_OP = 'UPDATE'
    AND NEW.escuela_id IS NOT DISTINCT FROM OLD.escuela_id
    AND NEW.nombres IS NOT DISTINCT FROM OLD.nombres
    AND NEW.apellidos IS NOT DISTINCT FROM OLD.apellidos
    AND NEW.fecha_nacimiento IS NOT DISTINCT FROM OLD.fecha_nacimiento
    AND NEW.carnet_identidad IS NOT DISTINCT FROM OLD.carnet_identidad
    AND NEW.archivado IS NOT DISTINCT FROM OLD.archivado THEN
    RETURN NEW;
  END IF;

  v_carnet_normalizado := NULLIF(
    lower(regexp_replace(btrim(COALESCE(NEW.carnet_identidad, '')), '\s+', '', 'g')),
    ''
  );

  SELECT a.id, a.nombres, a.apellidos
  INTO v_existente
  FROM public.alumnos a
  WHERE a.escuela_id = NEW.escuela_id
    AND a.id <> NEW.id
    AND (
      (
        v_carnet_normalizado IS NOT NULL
        AND NULLIF(lower(regexp_replace(btrim(COALESCE(a.carnet_identidad, '')), '\s+', '', 'g')), '') = v_carnet_normalizado
      )
      OR (
        a.fecha_nacimiento = NEW.fecha_nacimiento
        AND lower(regexp_replace(translate(btrim(a.nombres), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'), '\s+', ' ', 'g')) =
            lower(regexp_replace(translate(btrim(NEW.nombres), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'), '\s+', ' ', 'g'))
        AND lower(regexp_replace(translate(btrim(a.apellidos), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'), '\s+', ' ', 'g')) =
            lower(regexp_replace(translate(btrim(NEW.apellidos), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'), '\s+', ' ', 'g'))
      )
    )
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'El alumno ya está registrado en esta escuela.',
      DETAIL = format('Coincide con %s %s (%s).', v_existente.nombres, v_existente.apellidos, v_existente.id),
      HINT = 'Use el registro existente o combine los duplicados; puede registrar al alumno en otra escuela.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.validar_alumno_unico_misma_escuela() FROM PUBLIC;

DROP TRIGGER IF EXISTS validar_alumno_unico_misma_escuela ON public.alumnos;
CREATE TRIGGER validar_alumno_unico_misma_escuela
BEFORE INSERT OR UPDATE OF escuela_id, nombres, apellidos, fecha_nacimiento, carnet_identidad, archivado
ON public.alumnos
FOR EACH ROW
EXECUTE FUNCTION private.validar_alumno_unico_misma_escuela();
