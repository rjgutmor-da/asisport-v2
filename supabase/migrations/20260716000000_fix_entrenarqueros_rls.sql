-- ============================================================
-- Migración: fix_entrenarqueros_rls
-- Fecha: 2026-07-16
--
-- Problema detectado:
--   La sección de Asistencias (AsisPort) mostraba 0 alumnos
--   para el rol Entrenarqueros, aunque Lista de Alumnos sí
--   los mostraba correctamente.
--
-- Causa raíz (doble):
--
--   1. La política permisiva "Visualización de alumnos" solo
--      permitía al Entrenarqueros ver alumnos donde
--      profesor_asignado_id = auth.uid() o estuvieran en
--      alumnos_entrenadores. Pero los arqueros están asignados
--      a sus entrenadores regulares, NO al Entrenarqueros.
--      Lista de Alumnos usa la vista v_alumnos (SECURITY DEFINER)
--      que bypasea el RLS, por eso sí funcionaba. Asistencias
--      consulta la tabla alumnos directamente → RLS bloqueaba.
--
--   2. Las políticas restrictivas creadas en
--      20260715143000_shared_goalkeeper_attendance.sql usaban
--      la condición: sucursal_id = Entrenarqueros.sucursal_id
--      Si el Entrenarqueros tiene sucursal_id NULL, la condición
--      NULL = NULL siempre es FALSE en SQL → bloqueaba todo.
--
-- Solución:
--   1. Reemplazar "Visualización de alumnos" para que el rol
--      Entrenarqueros pueda ver todos los alumnos con es_arquero=true
--      (el filtro de sucursal lo maneja la política restrictiva).
--
--   2. Corregir todas las políticas restrictivas/permisivas del
--      Entrenarqueros para que, cuando sucursal_id es NULL, no
--      se aplique restricción de sucursal (acceso a toda la escuela).
-- ============================================================


-- ============================================================
-- TABLA: alumnos
-- ============================================================

-- 1. Política permisiva SELECT: Entrenarqueros ve todos los arqueros
DROP POLICY IF EXISTS "Visualización de alumnos" ON public.alumnos;
CREATE POLICY "Visualización de alumnos"
ON public.alumnos FOR SELECT TO authenticated
USING (
  escuela_id = current_user_escuela_id()
  AND (
    -- Administradores ven todos los alumnos de su escuela
    (current_user_rol()::text = ANY(ARRAY['Administrador'::text, 'SuperAdministrador'::text]))

    -- Entrenarqueros: ve TODOS los alumnos con es_arquero = true
    -- (la restricción de sucursal la maneja la política RESTRICTIVE abajo)
    OR (
      current_user_rol()::text = 'Entrenarqueros'
      AND es_arquero = true
    )

    -- Entrenador normal: solo sus alumnos asignados
    OR (
      current_user_rol()::text = 'Entrenador'
      AND (
        profesor_asignado_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.alumnos_entrenadores ae
          WHERE ae.alumno_id = alumnos.id
            AND ae.entrenador_id = auth.uid()
        )
      )
    )
  )
);

-- 2. Política RESTRICTIVA SELECT: sucursal_id NULL = sin restricción de sucursal
DROP POLICY IF EXISTS "entrenarqueros_solo_ven_arqueros_sucursal" ON public.alumnos;
CREATE POLICY "entrenarqueros_solo_ven_arqueros_sucursal"
ON public.alumnos AS RESTRICTIVE FOR SELECT TO authenticated
USING (
  -- Si NO es Entrenarqueros, la política no aplica (permiso estándar)
  current_user_rol()::text <> 'Entrenarqueros'
  OR (
    escuela_id = current_user_escuela_id()
    AND es_arquero = true
    AND (
      -- Si el Entrenarqueros NO tiene sucursal asignada → ve arqueros de toda la escuela
      (SELECT u.sucursal_id FROM public.usuarios u WHERE u.id = (SELECT auth.uid())) IS NULL
      -- Si tiene sucursal → solo ve arqueros de esa sucursal
      OR sucursal_id = (SELECT u.sucursal_id FROM public.usuarios u WHERE u.id = (SELECT auth.uid()))
    )
  )
);


-- ============================================================
-- TABLA: asistencias_normales
-- ============================================================

-- 3. Política permisiva INSERT: Entrenarqueros puede registrar
--    asistencias de arqueros de su sucursal (o de toda la escuela si no tiene sucursal)
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
      AND (
        (SELECT u.sucursal_id FROM public.usuarios u WHERE u.id = (SELECT auth.uid())) IS NULL
        OR a.sucursal_id = (SELECT u.sucursal_id FROM public.usuarios u WHERE u.id = (SELECT auth.uid()))
      )
  )
);

-- 4. Política RESTRICTIVA INSERT: igual que la permisiva pero como restricción dura
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
        AND (
          (SELECT u.sucursal_id FROM public.usuarios u WHERE u.id = (SELECT auth.uid())) IS NULL
          OR a.sucursal_id = (SELECT u.sucursal_id FROM public.usuarios u WHERE u.id = (SELECT auth.uid()))
        )
    )
  )
);

-- 5. Política RESTRICTIVA SELECT: Entrenarqueros solo ve asistencias de arqueros de su sucursal
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
      AND (
        (SELECT u.sucursal_id FROM public.usuarios u WHERE u.id = (SELECT auth.uid())) IS NULL
        OR a.sucursal_id = (SELECT u.sucursal_id FROM public.usuarios u WHERE u.id = (SELECT auth.uid()))
      )
  )
);

-- Nota: La política "entrenarqueros_no_editan_asistencias" (UPDATE RESTRICTIVE)
-- no requiere cambios ya que simplemente bloquea cualquier UPDATE del Entrenarqueros,
-- lo cual es el comportamiento correcto.
