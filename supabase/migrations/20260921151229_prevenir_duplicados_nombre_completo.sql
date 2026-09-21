-- Impide nuevos alumnos duplicados dentro de una misma escuela.
-- Los duplicados históricos se conservan: la validación se ejecuta únicamente
-- en altas, restauraciones o cambios de identidad.

CREATE OR REPLACE FUNCTION private.normalizar_nombre_alumno(p_valor text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
RETURNS NULL ON NULL INPUT
SET search_path = pg_catalog
AS $$
  SELECT lower(
    regexp_replace(
      translate(
        btrim(p_valor),
        'ÁÉÍÓÚÜÑáéíóúüñ',
        'AEIOUUNaeiouun'
      ),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

CREATE OR REPLACE FUNCTION private.normalizar_carnet_alumno(p_valor text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
RETURNS NULL ON NULL INPUT
SET search_path = pg_catalog
AS $$
  SELECT lower(regexp_replace(btrim(p_valor), '[^[:alnum:]]', '', 'g'));
$$;

REVOKE ALL ON FUNCTION private.normalizar_nombre_alumno(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.normalizar_carnet_alumno(text) FROM PUBLIC;

-- Índices no únicos: aceleran la detección sin rechazar los duplicados que ya
-- existen y deben conservar su historial.
CREATE INDEX IF NOT EXISTS idx_alumnos_escuela_nombre_completo_normalizado
  ON public.alumnos (
    escuela_id,
    lower(
      regexp_replace(
        translate(
          btrim(COALESCE(nombres, '') || ' ' || COALESCE(apellidos, '')),
          'ÁÉÍÓÚÜÑáéíóúüñ',
          'AEIOUUNaeiouun'
        ),
        '\s+',
        ' ',
        'g'
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_alumnos_escuela_carnet_identidad_normalizado
  ON public.alumnos (
    escuela_id,
    lower(regexp_replace(btrim(carnet_identidad), '[^[:alnum:]]', '', 'g'))
  )
  WHERE carnet_identidad IS NOT NULL
    AND btrim(carnet_identidad) <> '';

CREATE OR REPLACE FUNCTION public.rpc_verificar_alumno_duplicado(
  p_nombres text,
  p_apellidos text,
  p_carnet_identidad text DEFAULT NULL,
  p_alumno_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_escuela_id uuid;
  v_nombre_normalizado text;
  v_carnet_normalizado text;
  v_existente record;
  v_coincide_nombre boolean;
  v_coincide_carnet boolean;
BEGIN
  SELECT u.escuela_id
  INTO v_escuela_id
  FROM public.usuarios u
  WHERE u.id = auth.uid()
    AND u.activo IS TRUE;

  IF v_escuela_id IS NULL THEN
    RAISE EXCEPTION 'No existe un perfil activo para verificar alumnos.'
      USING ERRCODE = '42501';
  END IF;

  v_nombre_normalizado := NULLIF(
    private.normalizar_nombre_alumno(concat_ws(' ', p_nombres, p_apellidos)),
    ''
  );
  v_carnet_normalizado := NULLIF(
    private.normalizar_carnet_alumno(COALESCE(p_carnet_identidad, '')),
    ''
  );

  SELECT
    a.id,
    a.archivado,
    private.normalizar_nombre_alumno(concat_ws(' ', a.nombres, a.apellidos)) = v_nombre_normalizado AS coincide_nombre,
    v_carnet_normalizado IS NOT NULL
      AND private.normalizar_carnet_alumno(COALESCE(a.carnet_identidad, '')) = v_carnet_normalizado AS coincide_carnet
  INTO v_existente
  FROM public.alumnos a
  WHERE a.escuela_id = v_escuela_id
    AND (p_alumno_id IS NULL OR a.id <> p_alumno_id)
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

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'duplicado', false,
      'archivado', false,
      'motivo', NULL
    );
  END IF;

  v_coincide_nombre := COALESCE(v_existente.coincide_nombre, false);
  v_coincide_carnet := COALESCE(v_existente.coincide_carnet, false);

  RETURN jsonb_build_object(
    'duplicado', true,
    'archivado', v_existente.archivado,
    'motivo', CASE
      WHEN v_coincide_nombre AND v_coincide_carnet THEN 'nombre_y_carnet'
      WHEN v_coincide_carnet THEN 'carnet'
      ELSE 'nombre'
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_verificar_alumno_duplicado(text, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_verificar_alumno_duplicado(text, text, text, uuid) TO authenticated;

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
  -- Archivar conserva el registro y nunca debe quedar bloqueado por un
  -- duplicado histórico.
  IF TG_OP = 'UPDATE' AND NEW.archivado IS TRUE THEN
    RETURN NEW;
  END IF;

  -- Los cambios de contacto, grupo, mensualidad u otros datos siguen
  -- permitidos aun cuando el registro pertenezca a un duplicado histórico.
  IF TG_OP = 'UPDATE'
    AND NEW.escuela_id IS NOT DISTINCT FROM OLD.escuela_id
    AND NEW.nombres IS NOT DISTINCT FROM OLD.nombres
    AND NEW.apellidos IS NOT DISTINCT FROM OLD.apellidos
    AND NEW.carnet_identidad IS NOT DISTINCT FROM OLD.carnet_identidad
    AND NEW.archivado IS NOT DISTINCT FROM OLD.archivado THEN
    RETURN NEW;
  END IF;

  -- Serializa altas y cambios de identidad dentro de cada escuela para que
  -- dos solicitudes simultáneas no puedan aprobar el mismo alumno.
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

DROP TRIGGER IF EXISTS validar_alumno_unico_misma_escuela ON public.alumnos;
CREATE TRIGGER validar_alumno_unico_misma_escuela
BEFORE INSERT OR UPDATE OF escuela_id, nombres, apellidos, carnet_identidad, archivado
ON public.alumnos
FOR EACH ROW
EXECUTE FUNCTION private.validar_alumno_unico_misma_escuela();
