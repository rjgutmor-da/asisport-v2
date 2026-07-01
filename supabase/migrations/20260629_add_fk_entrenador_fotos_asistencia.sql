-- Migración: Agregar llave foránea para entrenador_id en fotos_asistencia_grupal
-- Descripción: Permite relacionar fotos_asistencia_grupal con la tabla usuarios,
-- solucionando el error al cargar fotos en SaaSport.

ALTER TABLE fotos_asistencia_grupal 
ADD CONSTRAINT fotos_asistencia_grupal_entrenador_id_fkey 
FOREIGN KEY (entrenador_id) REFERENCES usuarios(id);
