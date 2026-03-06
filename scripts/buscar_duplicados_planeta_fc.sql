-- SQL para buscar posibles alumnos duplicados en la escuela "Planeta FC"
-- Criterio: Misma fecha de nacimiento y coincidencia parcial en nombres o apellidos

WITH EscuelaPlaneta AS (
    -- Buscamos el ID exacto de la escuela
    SELECT id FROM escuelas WHERE nombre ILIKE '%Planeta FC%' LIMIT 1
)
SELECT 
    a1.fecha_nacimiento,
    a1.nombres || ' ' || a1.apellidos as alumno_registrado_1,
    a2.nombres || ' ' || a2.apellidos as alumno_registrado_2,
    a1.id as id_1,
    a2.id as id_2,
    a1.estado as estado_1,
    a2.estado as estado_2
FROM alumnos a1
JOIN alumnos a2 ON a1.fecha_nacimiento = a2.fecha_nacimiento 
    AND a1.id < a2.id -- Evita comparar el alumno consigo mismo y duplicar los pares en el resultado
WHERE a1.escuela_id = (SELECT id FROM EscuelaPlaneta)
    AND a2.escuela_id = (SELECT id FROM EscuelaPlaneta)
    AND a1.archivado = false 
    AND a2.archivado = false
    AND a1.estado != 'ELIMINADO SISTEMA'
    AND a2.estado != 'ELIMINADO SISTEMA'
    -- Filtro de similitud básica: si el primer nombre o primer apellido de uno está contenido en el otro
    AND (
        lower(a1.nombres) LIKE '%' || lower(split_part(a2.nombres, ' ', 1)) || '%'
        OR lower(a1.apellidos) LIKE '%' || lower(split_part(a2.apellidos, ' ', 1)) || '%'
        OR lower(a2.nombres) LIKE '%' || lower(split_part(a1.nombres, ' ', 1)) || '%'
    )
ORDER BY a1.fecha_nacimiento DESC;
