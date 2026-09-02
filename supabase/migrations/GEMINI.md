# Reglas Estrictas para Migraciones y RPCs (Supabase)

Al crear o modificar migraciones, funciones RPC, o políticas RLS en este directorio, debes seguir estrictamente este flujo de trabajo y reglas de diseño:

## 1. Verificación Previa (Dependencias)
- ANTES de generar cualquier migración que modifique una tabla o columna, debes listar TODAS las funciones RPC, vistas y políticas RLS que la referencian.
- Utiliza consultas SQL contra `information_schema` o `pg_proc` (si la base de datos local está activa) o herramientas de búsqueda de texto completas (`grep_search`) en el directorio para confirmarlo. No asumas dependencias solo por el nombre. Muestra esta lista al usuario antes de proponer el cambio.

## 2. Reglas de Diseño de RPC
- **Tipado Explícito:** Toda función RPC nueva que retorne múltiples filas o columnas DEBE usar `RETURNS TABLE(columna tipo, ...)` con tipos explícitos. NUNCA uses `SETOF RECORD` sin tipar.
- **Modificación de Firmas:** Si un RPC cambia sus columnas de retorno, la migración debe utilizar explícitamente `DROP FUNCTION` seguido de `CREATE FUNCTION`. No uses `CREATE OR REPLACE`, ya que Postgres no permite cambiar la firma de retorno de esta manera.
- **Impacto de SECURITY INVOKER:** Si la función utiliza `SECURITY INVOKER`, cualquier cambio en políticas RLS relacionadas (ej. `cobros_aplicados`, `escuelas`, `usuarios`, `grupos`) afectará lo que esta función puede leer. Verifica el impacto en el RPC específicamente y no trates los cambios de RLS como elementos aislados.

## 3. Bloque SQL de Verificación (Obligatorio)
Después de escribir la migración, NO des la tarea por completa sin antes generar y presentar un bloque de código SQL de verificación que cumpla con:
1. Llamar al RPC con parámetros de prueba conocidos (usa datos reales de `Planeta FC` como escuela de test).
2. Comparar el resultado del RPC contra un cálculo manual esperado dentro del mismo bloque.
3. Confirmar mediante `ASSERT` que el tipo de cada columna retornada y la estructura coinciden con lo declarado (o JSONB esperado).
