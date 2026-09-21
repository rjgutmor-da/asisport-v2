-- Archivar un alumno conserva su historial incluso si pertenece a un duplicado
-- histórico. Un alumno que ya está archivado no puede, sin embargo, cambiar su
-- identidad para adoptar la de otro registro.
CREATE OR REPLACE FUNCTION private.validar_alumno_unico_misma_escuela()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_nombre_normalizado text;
  v_carnet_normalizado text;
  v_existente record;
BEGIN
  IF TG_OP = 'UPDATE'
    AND OLD.archivado IS FALSE
    AND NEW.archivado IS TRUE
    AND NEW.escuela_id IS NOT DISTINCT FROM OLD.escuela_id
    AND private.normalizar_nombre_alumno(concat_ws(' ', NEW.nombres, NEW.apellidos))
      IS NOT DISTINCT FROM private.normalizar_nombre_alumno(concat_ws(' ', OLD.nombres, OLD.apellidos))
    AND private.normalizar_carnet_alumno(COALESCE(NEW.carnet_identidad, ''))
      IS NOT DISTINCT FROM private.normalizar_carnet_alumno(COALESCE(OLD.carnet_identidad, '')) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
    AND NEW.escuela_id IS NOT DISTINCT FROM OLD.escuela_id
    AND private.normalizar_nombre_alumno(concat_ws(' ', NEW.nombres, NEW.apellidos))
      IS NOT DISTINCT FROM private.normalizar_nombre_alumno(concat_ws(' ', OLD.nombres, OLD.apellidos))
    AND private.normalizar_carnet_alumno(COALESCE(NEW.carnet_identidad, ''))
      IS NOT DISTINCT FROM private.normalizar_carnet_alumno(COALESCE(OLD.carnet_identidad, ''))
    AND NEW.archivado IS NOT DISTINCT FROM OLD.archivado THEN
    RETURN NEW;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'alumno-identidad:' || NEW.escuela_id::text,
      0
    )
  );

  v_nombre_normalizado := NULLIF(
    private.normalizar_nombre_alumno(concat_ws(' ', NEW.nombres, NEW.apellidos)),
    ''
  );
  v_carnet_normalizado := NULLIF(
    private.normalizar_carnet_alumno(COALESCE(NEW.carnet_identidad, '')),
    ''
  );

  SELECT a.id, a.archivado,
    v_nombre_normalizado IS NOT NULL
      AND private.normalizar_nombre_alumno(concat_ws(' ', a.nombres, a.apellidos)) = v_nombre_normalizado AS coincide_nombre,
    v_carnet_normalizado IS NOT NULL
      AND private.normalizar_carnet_alumno(COALESCE(a.carnet_identidad, '')) = v_carnet_normalizado AS coincide_carnet
  INTO v_existente
  FROM public.alumnos a
  WHERE a.escuela_id = NEW.escuela_id
    AND a.id <> NEW.id
    AND (
      (
        v_nombre_normalizado IS NOT NULL
        AND private.normalizar_nombre_alumno(concat_ws(' ', a.nombres, a.apellidos)) = v_nombre_normalizado
      )
      OR (
        v_carnet_normalizado IS NOT NULL
        AND private.normalizar_carnet_alumno(COALESCE(a.carnet_identidad, '')) = v_carnet_normalizado
      )
    )
  ORDER BY a.archivado ASC, a.created_at ASC
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = CASE
        WHEN v_existente.archivado
          THEN 'Este alumno tiene un registro archivado.'
        ELSE 'Este alumno ya está registrado.'
      END,
      DETAIL = CASE
        WHEN v_existente.coincide_nombre AND v_existente.coincide_carnet
          THEN 'Coinciden el nombre completo y el carnet dentro de la escuela.'
        WHEN v_existente.coincide_carnet
          THEN 'Coincide el carnet dentro de la escuela.'
        ELSE 'Coincide el nombre completo dentro de la escuela.'
      END,
      HINT = CASE
        WHEN v_existente.archivado
          THEN 'Solicite al administrador revisar la restauración del registro.'
        ELSE 'Revise el registro existente o solicite ayuda al administrador.'
      END;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.validar_alumno_unico_misma_escuela() FROM PUBLIC;
