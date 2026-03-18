-- ============================================================
-- FIX DE EMERGENCIA - Escuela Demo "Estrellas de América"
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-03-17
-- ============================================================

-- CONSTANTES
-- ESCUELA_ID  : 07d945a7-99ba-4e7d-ba9c-258e7ee27659
-- ENTRENADOR  : 5bc0896a-9a9d-4135-b835-f552fa92abfa

-- 1. Arreglar los alumnos demo que tienen profesor_asignado_id = NULL
--    (esto es lo que hace que no aparezcan al tomar lista)
UPDATE alumnos
SET profesor_asignado_id = '5bc0896a-9a9d-4135-b835-f552fa92abfa'
WHERE escuela_id = '07d945a7-99ba-4e7d-ba9c-258e7ee27659'
  AND (profesor_asignado_id IS NULL OR profesor_asignado_id != '5bc0896a-9a9d-4135-b835-f552fa92abfa');

-- 2. Eliminar las asistencias del DÍA DE HOY que el reset pre-generó
--    para dejar el día libre y poder tomar lista
DELETE FROM asistencias_normales
WHERE entrenador_id = '5bc0896a-9a9d-4135-b835-f552fa92abfa'
  AND fecha = CURRENT_DATE;

-- 3. Verificar resultado
SELECT 
  'Alumnos con profesor asignado' AS descripcion,
  COUNT(*) AS cantidad
FROM alumnos
WHERE escuela_id = '07d945a7-99ba-4e7d-ba9c-258e7ee27659'
  AND profesor_asignado_id = '5bc0896a-9a9d-4135-b835-f552fa92abfa'
  AND archivado = false;
