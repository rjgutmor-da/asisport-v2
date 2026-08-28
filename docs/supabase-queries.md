# Queries Útiles de Supabase - AsiSport

Este archivo contiene queries SQL útiles para verificar, gestionar y debuggear la base de datos de AsiSport.

**Escuela ID:** `91b2a748-f956-41e7-8efe-075257a0889a`

---

## 📊 Queries de Verificación

### 1. Resumen General de la Escuela

Muestra un resumen rápido de todos los datos de tu escuela.

```sql
SELECT 
  'Escuela' AS tipo,
  (SELECT nombre FROM escuelas WHERE id = '91b2a748-f956-41e7-8efe-075257a0889a') AS detalle
UNION ALL
SELECT 
  'Total Usuarios',
  COUNT(*)::TEXT
FROM usuarios 
WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
UNION ALL
SELECT 
  'Total Alumnos Activos',
  COUNT(*)::TEXT
FROM alumnos 
WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a' AND archivado = FALSE
UNION ALL
SELECT 
  'Alumnos Aprobados',
  COUNT(*)::TEXT
FROM alumnos 
WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a' AND estado = 'Aprobado'
UNION ALL
SELECT 
  'Alumnos Pendientes',
  COUNT(*)::TEXT
FROM alumnos 
WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a' AND estado = 'Pendiente'
UNION ALL
SELECT 
  'Total Asistencias',
  COUNT(*)::TEXT
FROM (
  SELECT id FROM asistencias_normales an
  JOIN alumnos a ON a.id = an.alumno_id
  WHERE a.escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
  UNION ALL
  SELECT id FROM asistencias_arqueros aa
  JOIN alumnos a ON a.id = aa.alumno_id
  WHERE a.escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
) AS todas;
```

**Resultado esperado:**
- Escuela: Escuela Tahuichi
- Total Usuarios: 4
- Total Alumnos Activos: 5
- Alumnos Aprobados: 4
- Alumnos Pendientes: 1
- Total Asistencias: (número variable)

---

### 2. Ver Todos los Alumnos con Detalles

Lista completa de alumnos con información clave para verificación.

```sql
SELECT 
  a.nombres || ' ' || a.apellidos AS alumno,
  a.estado,
  CASE WHEN a.es_arquero THEN '⚽ Arquero' ELSE 'Jugador' END AS tipo,
  c.nombre AS cancha,
  h.hora AS horario,
  a.fecha_nacimiento,
  COALESCE(a.nombre_padre, a.nombre_madre, 'Sin representante') AS representante,
  (
    SELECT COUNT(*) FROM alumnos_entrenadores ae 
    WHERE ae.alumno_id = a.id
  ) AS num_entrenadores,
  (
    SELECT COUNT(*) FROM (
      SELECT id FROM asistencias_normales WHERE alumno_id = a.id
      UNION ALL
      SELECT id FROM asistencias_arqueros WHERE alumno_id = a.id
    ) AS total
  ) AS total_asistencias,
  a.created_at::DATE AS fecha_registro
FROM alumnos a
LEFT JOIN canchas c ON c.id = a.cancha_id
LEFT JOIN horarios h ON h.id = a.horario_id
WHERE a.escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
  AND a.archivado = FALSE
ORDER BY a.estado DESC, a.apellidos, a.nombres;
```

**Uso:** Verificar que todos los alumnos tienen los datos correctos y las relaciones funcionan.

---

### 3. Ver Alumnos Convocables

Muestra qué alumnos cumplen con las 3+ asistencias en los últimos 7 días.

```sql
SELECT 
  a.nombres || ' ' || a.apellidos AS alumno,
  a.estado,
  CASE WHEN a.es_arquero THEN '⚽ Arquero' ELSE 'Jugador' END AS tipo,
  contar_asistencias_ultimos_7_dias(a.id) AS asistencias_ultimos_7_dias,
  CASE 
    WHEN contar_asistencias_ultimos_7_dias(a.id) >= 3 THEN '✅ Convocable'
    ELSE '⚠️ No convocable'
  END AS estado_convocatoria,
  CASE 
    WHEN a.estado = 'Pendiente' THEN '⚠️ Pendiente de aprobación'
    ELSE ''
  END AS advertencia
FROM alumnos a
WHERE a.escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
  AND a.archivado = FALSE
ORDER BY 
  contar_asistencias_ultimos_7_dias(a.id) DESC,
  a.apellidos;
```

**Uso:** Probar la lógica de convocatoria (Regla #4 del Paso 4).

---

### 4. Ver Asistencias de Hoy

Muestra todas las asistencias registradas en el día actual.

```sql
SELECT 
  a.nombres || ' ' || a.apellidos AS alumno,
  CASE 
    WHEN an.id IS NOT NULL THEN 'Normal'
    WHEN aa.id IS NOT NULL THEN 'Arquero'
  END AS tipo_asistencia,
  COALESCE(an.estado, aa.estado) AS estado,
  u.nombres || ' ' || u.apellidos AS registrado_por,
  COALESCE(an.created_at, aa.created_at)::TIME AS hora_registro
FROM alumnos a
LEFT JOIN asistencias_normales an ON an.alumno_id = a.id AND an.fecha = CURRENT_DATE
LEFT JOIN asistencias_arqueros aa ON aa.alumno_id = a.id AND aa.fecha = CURRENT_DATE
LEFT JOIN usuarios u ON u.id = COALESCE(an.entrenador_id, aa.entrenador_id)
WHERE a.escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
  AND (an.id IS NOT NULL OR aa.id IS NOT NULL)
ORDER BY COALESCE(an.created_at, aa.created_at) DESC;
```

**Uso:** Verificar que el módulo de asistencias funciona correctamente.

---

### 5. Ver Cumpleaños del Mes Actual

Lista de cumpleaños del mes para probar notificaciones.

```sql
SELECT 
  a.nombres || ' ' || a.apellidos AS alumno,
  a.fecha_nacimiento,
  EXTRACT(DAY FROM a.fecha_nacimiento) AS dia_cumple,
  DATE_PART('year', AGE(a.fecha_nacimiento)) AS edad_actual,
  CASE 
    WHEN EXTRACT(DAY FROM a.fecha_nacimiento) = EXTRACT(DAY FROM CURRENT_DATE) 
    THEN '🎉 ¡HOY!'
    WHEN EXTRACT(DAY FROM a.fecha_nacimiento) > EXTRACT(DAY FROM CURRENT_DATE)
    THEN 'Próximo'
    ELSE 'Ya pasó'
  END AS estado,
  c.nombre AS cancha,
  (
    SELECT STRING_AGG(u.nombres || ' ' || u.apellidos, ', ')
    FROM alumnos_entrenadores ae
    JOIN usuarios u ON u.id = ae.entrenador_id
    WHERE ae.alumno_id = a.id
  ) AS entrenadores
FROM alumnos a
LEFT JOIN canchas c ON c.id = a.cancha_id
WHERE a.escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
  AND a.archivado = FALSE
  AND EXTRACT(MONTH FROM a.fecha_nacimiento) = EXTRACT(MONTH FROM CURRENT_DATE)
ORDER BY EXTRACT(DAY FROM a.fecha_nacimiento);
```

**Uso:** Verificar funcionalidad de cumpleaños (Regla #19 del Paso 4).

---

### 6. Ver Entrenadores y sus Alumnos

Muestra cada entrenador con sus alumnos asignados.

```sql
SELECT 
  u.nombres || ' ' || u.apellidos AS entrenador,
  u.telefono_whatsapp,
  COUNT(DISTINCT ae.alumno_id) AS total_alumnos,
  STRING_AGG(
    DISTINCT a.nombres || ' ' || a.apellidos, 
    ', ' 
    ORDER BY a.apellidos
  ) AS alumnos
FROM usuarios u
LEFT JOIN alumnos_entrenadores ae ON ae.entrenador_id = u.id
LEFT JOIN alumnos a ON a.id = ae.alumno_id AND a.archivado = FALSE
WHERE u.escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
  AND u.rol = 'Entrenador'
GROUP BY u.id, u.nombres, u.apellidos, u.telefono_whatsapp
ORDER BY u.apellidos;
```

**Uso:** Verificar la relación muchos-a-muchos entre alumnos y entrenadores.

---

### 7. Verificar Políticas RLS Activas

Muestra todas las políticas de Row Level Security configuradas.

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Uso:** Verificar que RLS está activo y correctamente configurado.

---

## 🔧 Queries de Gestión

### 8. Ver Alumnos Archivados

```sql
SELECT 
  a.nombres || ' ' || a.apellidos AS alumno,
  a.estado,
  a.archivado_at::DATE AS fecha_archivado,
  (
    SELECT COUNT(*) FROM (
      SELECT id FROM asistencias_normales WHERE alumno_id = a.id
      UNION ALL
      SELECT id FROM asistencias_arqueros WHERE alumno_id = a.id
    ) AS total
  ) AS total_asistencias
FROM alumnos a
WHERE a.escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
  AND a.archivado = TRUE
ORDER BY a.archivado_at DESC;
```

**Uso:** Ver alumnos que fueron archivados.

---

### 9. Restaurar Alumno Archivado

```sql
-- Reemplazar ALUMNO_ID con el ID del alumno a restaurar
UPDATE alumnos
SET archivado = FALSE, archivado_at = NULL
WHERE id = 'ALUMNO_ID'
  AND escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a';
```

**Uso:** Restaurar un alumno archivado (Regla #16 del Paso 4).

---

### 10. Aprobar Alumno Pendiente

```sql
-- Reemplazar ALUMNO_ID con el ID del alumno a aprobar
-- IMPORTANTE: Solo funciona si tiene TODOS los campos obligatorios (Regla #12)
UPDATE alumnos
SET estado = 'Aprobado'
WHERE id = 'ALUMNO_ID'
  AND escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
  AND estado = 'Pendiente';
```

**Uso:** Aprobar manualmente un alumno desde SQL.

⚠️ Si falla, el trigger te dirá qué campo falta.

---

### 11. Ver Asistencias de un Alumno Específico

```sql
-- Reemplazar 'Nombre Alumno' con el nombre real
SELECT 
  a.nombres || ' ' || a.apellidos AS alumno,
  an.fecha AS fecha_normal,
  an.estado AS estado_normal,
  aa.fecha AS fecha_arquero,
  aa.estado AS estado_arquero,
  u.nombres AS entrenador
FROM alumnos a
LEFT JOIN asistencias_normales an ON an.alumno_id = a.id
LEFT JOIN asistencias_arqueros aa ON aa.alumno_id = a.id AND aa.fecha = an.fecha
LEFT JOIN usuarios u ON u.id = COALESCE(an.entrenador_id, aa.entrenador_id)
WHERE a.escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
  AND (a.nombres ILIKE '%Nombre Alumno%' OR a.apellidos ILIKE '%Nombre Alumno%')
ORDER BY COALESCE(an.fecha, aa.fecha) DESC;
```

**Uso:** Ver historial completo de asistencias de un alumno.

---

### 12. Registrar Asistencia Manual (para pruebas)

```sql
-- Insertar asistencia de prueba
-- Reemplazar ALUMNO_ID y ENTRENADOR_ID con IDs reales

-- Asistencia normal
INSERT INTO asistencias_normales (alumno_id, fecha, estado, entrenador_id)
VALUES (
  'ALUMNO_ID',
  CURRENT_DATE,
  'Presente',
  'ENTRENADOR_ID'
);

-- Asistencia de arquero (solo si es_arquero = true)
INSERT INTO asistencias_arqueros (alumno_id, fecha, estado, entrenador_id)
VALUES (
  'ALUMNO_ID',
  CURRENT_DATE,
  'Presente',
  'ENTRENADOR_ID'
);
```

**Uso:** Crear asistencias manualmente para pruebas.

---

## 🧪 Queries de Testing y Debug

### 13. Probar Función de Conteo de Asistencias

```sql
-- Probar la función que cuenta asistencias de últimos 7 días
-- Reemplazar ALUMNO_ID con un ID real
SELECT 
  a.nombres || ' ' || a.apellidos AS alumno,
  contar_asistencias_ultimos_7_dias(a.id, CURRENT_DATE) AS asistencias_7_dias,
  contar_asistencias_ultimos_7_dias(a.id, CURRENT_DATE - INTERVAL '3 days') AS asistencias_7_dias_hace_3_dias
FROM alumnos a
WHERE a.id = 'ALUMNO_ID';
```

**Uso:** Verificar que la función de conteo funciona correctamente.

---

### 14. Ver Triggers Activos

```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**Uso:** Verificar que todos los triggers están activos.

---

### 15. Probar Validación de Fecha Futura (debe fallar)

```sql
-- Esta query DEBE FALLAR (Regla #3)
-- Si no falla, el trigger no está funcionando
INSERT INTO asistencias_normales (alumno_id, fecha, estado, entrenador_id)
VALUES (
  (SELECT id FROM alumnos LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day', -- Fecha futura
  'Presente',
  (SELECT id FROM usuarios WHERE rol = 'Entrenador' LIMIT 1)
);
```

**Resultado esperado:** Error: "No se pueden registrar asistencias para fechas futuras"

---

### 16. Probar Validación Solo Arqueros (debe fallar)

```sql
-- Esta query DEBE FALLAR si el alumno NO es arquero (Regla #6)
INSERT INTO asistencias_arqueros (alumno_id, fecha, estado, entrenador_id)
VALUES (
  (SELECT id FROM alumnos WHERE es_arquero = FALSE LIMIT 1),
  CURRENT_DATE,
  'Presente',
  (SELECT id FROM usuarios WHERE rol = 'Entrenador' LIMIT 1)
);
```

**Resultado esperado:** Error: "Este alumno no está marcado como arquero"

---

## ⚠️ Queries Peligrosas (Solo para Desarrollo)

### 17. Limpiar Asistencias de Prueba

```sql
-- ⚠️ CUIDADO: Elimina TODAS las asistencias
DELETE FROM asistencias_arqueros 
WHERE alumno_id IN (
  SELECT id FROM alumnos WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
);

DELETE FROM asistencias_normales 
WHERE alumno_id IN (
  SELECT id FROM alumnos WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
);
```

**Uso:** Limpiar asistencias para empezar de cero en pruebas.

---

### 18. Limpiar Convocatorias de Prueba

```sql
-- ⚠️ CUIDADO: Elimina TODAS las convocatorias
DELETE FROM convocatorias_alumnos 
WHERE convocatoria_id IN (
  SELECT id FROM convocatorias WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
);

DELETE FROM convocatorias 
WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a';
```

**Uso:** Limpiar convocatorias para pruebas.

---

### 19. Resetear Alumnos a Pendiente

```sql
-- ⚠️ CUIDADO: Cambia TODOS los alumnos a Pendiente
UPDATE alumnos
SET estado = 'Pendiente'
WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a';
```

**Uso:** Probar flujo de aprobación desde cero.

---

### 20. Eliminar TODOS los Datos de Prueba

```sql
-- ⚠️⚠️⚠️ EXTREMADAMENTE PELIGROSO ⚠️⚠️⚠️
-- Elimina TODO excepto usuarios, canchas, horarios y escuela

-- 1. Asistencias
DELETE FROM asistencias_arqueros WHERE alumno_id IN (SELECT id FROM alumnos WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a');
DELETE FROM asistencias_normales WHERE alumno_id IN (SELECT id FROM alumnos WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a');

-- 2. Convocatorias
DELETE FROM convocatorias_alumnos WHERE convocatoria_id IN (SELECT id FROM convocatorias WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a');
DELETE FROM convocatorias WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a';

-- 3. Alumnos
DELETE FROM alumnos_entrenadores WHERE alumno_id IN (SELECT id FROM alumnos WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a');
DELETE FROM alumnos WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a';

-- Verificar que quedó limpio
SELECT 'Asistencias Normales' AS tabla, COUNT(*) AS registros FROM asistencias_normales
UNION ALL SELECT 'Asistencias Arqueros', COUNT(*) FROM asistencias_arqueros
UNION ALL SELECT 'Alumnos', COUNT(*) FROM alumnos WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a'
UNION ALL SELECT 'Convocatorias', COUNT(*) FROM convocatorias WHERE escuela_id = '91b2a748-f956-41e7-8efe-075257a0889a';
```

**Uso:** Solo para resetear completamente en desarrollo.

---

## 📝 Credenciales de Prueba

```
🔐 USUARIOS DE PRUEBA

Super Administrador:
  Email: superadmin@asisport.test
  Password: Test1234!
  
Administrador:
  Email: admin@asisport.test
  Password: Test1234!
  
Entrenador 1 (Juan Pérez):
  Email: entrenador1@asisport.test
  Password: Test1234!
  
Entrenador 2 (María González):
  Email: entrenador2@asisport.test
  Password: Test1234!
```

---

## 🎯 Datos de Configuración

```
Escuela ID: 91b2a748-f956-41e7-8efe-075257a0889a
Nombre: Escuela Tahuichi
Zona Horaria: America/La_Paz

Canchas creadas:
- Cancha Norte
- Cancha Sur
- Cancha Central

Horarios creados:
- 15:00
- 16:00
- 17:00
- 18:00

Alumnos de prueba:
1. Juan Carlos Pérez Gómez (Aprobado, Jugador, 3 asistencias últimos 7 días)
2. María Isabel González López (Aprobado, Arquero, 4 asistencias últimos 7 días)
3. Carlos Andrés Rodríguez Paz (Pendiente, falta CI y foto)
4. Luis Fernando Martínez Silva (Aprobado, 1 asistencia - NO convocable)
5. Sofia Valentina Morales Gutiérrez (Aprobado, cumpleaños en febrero)
```

---

## 📚 Recursos Útiles

- **Documentación Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Functions:** https://www.postgresql.org/docs/current/functions.html
- **Supabase SQL Editor:** En tu proyecto → SQL Editor

---

**Última actualización:** 3 de febrero de 2026  
**Versión de BD:** 1.0  
**Proyecto:** AsiSport MVP
