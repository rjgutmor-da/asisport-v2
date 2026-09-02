-- ==============================================================================
-- ROLLBACK MIGRACIÓN 2: ELIMINACIÓN DE RPCS SECUNDARIAS
-- Archivo: 20260902132405_optimizacion_estadisticas_consultas_secundarias_rollback.sql
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_actividad_asisport(timestamptz, timestamptz, integer);
DROP FUNCTION IF EXISTS public.rpc_cumpleanos_asisport();
DROP FUNCTION IF EXISTS public.rpc_cargar_asistencia_asisport(date, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.rpc_exportar_asistencias_asisport(uuid, date, date, uuid[], uuid[], uuid[], text[], uuid, integer, integer);
DROP FUNCTION IF EXISTS public.rpc_resumen_estadisticas_asisport(uuid, date, date, uuid[], uuid[], uuid[], text[], uuid);
