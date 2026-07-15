-- Restricciones aditivas para Entrenarqueros.
-- Se conservan las políticas permisivas existentes de los demás roles.

DROP POLICY IF EXISTS "entrenarqueros_solo_ven_arqueros_sucursal" ON public.alumnos;
CREATE POLICY "entrenarqueros_solo_ven_arqueros_sucursal"
ON public.alumnos AS RESTRICTIVE FOR SELECT TO authenticated
USING (
  current_user_rol()::text <> 'Entrenarqueros'
  OR (
    escuela_id = current_user_escuela_id()
    AND es_arquero = true
    AND sucursal_id = (
      SELECT u.sucursal_id
      FROM public.usuarios u
      WHERE u.id = (SELECT auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "entrenarqueros_registran_asistencias_de_su_sucursal" ON public.asistencias_normales;
CREATE POLICY "entrenarqueros_registran_asistencias_de_su_sucursal"
ON public.asistencias_normales FOR INSERT TO authenticated
WITH CHECK (
  current_user_rol()::text = 'Entrenarqueros'
  AND entrenador_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.alumnos a
    WHERE a.id = asistencias_normales.alumno_id
      AND a.escuela_id = current_user_escuela_id()
      AND a.es_arquero = true
      AND a.sucursal_id = (
        SELECT u.sucursal_id
        FROM public.usuarios u
        WHERE u.id = (SELECT auth.uid())
      )
  )
);

DROP POLICY IF EXISTS "entrenarqueros_solo_registran_arqueros_sucursal" ON public.asistencias_normales;
CREATE POLICY "entrenarqueros_solo_registran_arqueros_sucursal"
ON public.asistencias_normales AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (
  current_user_rol()::text <> 'Entrenarqueros'
  OR (
    entrenador_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.alumnos a
      WHERE a.id = asistencias_normales.alumno_id
        AND a.escuela_id = current_user_escuela_id()
        AND a.es_arquero = true
        AND a.sucursal_id = (
          SELECT u.sucursal_id
          FROM public.usuarios u
          WHERE u.id = (SELECT auth.uid())
        )
    )
  )
);

DROP POLICY IF EXISTS "entrenarqueros_no_editan_asistencias" ON public.asistencias_normales;
CREATE POLICY "entrenarqueros_no_editan_asistencias"
ON public.asistencias_normales AS RESTRICTIVE FOR UPDATE TO authenticated
USING (current_user_rol()::text <> 'Entrenarqueros')
WITH CHECK (current_user_rol()::text <> 'Entrenarqueros');

DROP POLICY IF EXISTS "entrenarqueros_solo_ven_asistencias_arqueros_sucursal" ON public.asistencias_normales;
CREATE POLICY "entrenarqueros_solo_ven_asistencias_arqueros_sucursal"
ON public.asistencias_normales AS RESTRICTIVE FOR SELECT TO authenticated
USING (
  current_user_rol()::text <> 'Entrenarqueros'
  OR EXISTS (
    SELECT 1
    FROM public.alumnos a
    WHERE a.id = asistencias_normales.alumno_id
      AND a.escuela_id = current_user_escuela_id()
      AND a.es_arquero = true
      AND a.sucursal_id = (
        SELECT u.sucursal_id
        FROM public.usuarios u
        WHERE u.id = (SELECT auth.uid())
      )
  )
);
