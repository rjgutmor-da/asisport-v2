-- Permite que el rol Medico abra el detalle de alumnos de su escuela.
-- La ficha medica se monta dentro de /alumnos/:id, por lo que primero necesita
-- una politica SELECT sobre public.alumnos.

DROP POLICY IF EXISTS "Medico puede consultar alumnos de su escuela" ON public.alumnos;

CREATE POLICY "Medico puede consultar alumnos de su escuela"
ON public.alumnos
FOR SELECT TO authenticated
USING (
    (current_user_rol())::text = 'Medico'
    AND escuela_id = current_user_escuela_id()
);
