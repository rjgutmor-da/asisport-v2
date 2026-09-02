-- ==============================================================================
-- ROLLBACK MIGRACIÓN 1: RESTAURACIÓN Y KILL SWITCHES DE POLÍTICAS Y RPCS
-- Archivo: 20260902132351_optimizacion_buscadores_rls_rpcs_rollback.sql
-- ==============================================================================

-- 1. Eliminación individual de políticas restrictivas (Kill switches independientes)
DROP POLICY IF EXISTS alumnos_restrictive_select_escuela ON public.alumnos;
DROP POLICY IF EXISTS asistencias_normales_restrictive_select_escuela ON public.asistencias_normales;
DROP POLICY IF EXISTS asistencias_arqueros_restrictive_select_escuela ON public.asistencias_arqueros;
DROP POLICY IF EXISTS usuarios_restrictive_select_escuela ON public.usuarios;
DROP POLICY IF EXISTS sucursales_restrictive_select_escuela ON public.sucursales;
DROP POLICY IF EXISTS grupos_restrictive_select_escuela ON public.grupos;
DROP POLICY IF EXISTS horarios_restrictive_select_escuela ON public.horarios;
DROP POLICY IF EXISTS gestiones_deportivas_restrictive_select_escuela ON public.gestiones_deportivas;
DROP POLICY IF EXISTS grupos_gestion_restrictive_select_escuela ON public.grupos_gestion;
DROP POLICY IF EXISTS alumnos_grupos_restrictive_select_escuela ON public.alumnos_grupos;
DROP POLICY IF EXISTS entrenadores_grupos_restrictive_select_escuela ON public.entrenadores_grupos;

-- 2. Eliminación de RPCs centrales
DROP FUNCTION IF EXISTS public.rpc_estado_deuda_alumno_asisport(uuid);
DROP FUNCTION IF EXISTS public.rpc_sugerir_alumnos_asisport(text, integer, jsonb);
DROP FUNCTION IF EXISTS public.rpc_listar_alumnos_asisport(jsonb);
DROP FUNCTION IF EXISTS public.rpc_catalogos_asisport(uuid);

-- 3. Eliminación de la vista estrecha
DROP VIEW IF EXISTS public.v_asistencias_gestion_efectiva;

-- 4. Eliminación del helper privado y restauración de permisos previos
DROP FUNCTION IF EXISTS private.current_user_escuela_id_asisport();
GRANT EXECUTE ON FUNCTION public.current_user_escuela_id() TO PUBLIC, anon, authenticated, service_role;
