ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;

-- Add new constraint with ALL currently used roles + new ones
ALTER TABLE public.usuarios 
  ADD CONSTRAINT usuarios_rol_check 
  CHECK (rol IN (
      'Dueño', 
      'Administrador', 
      'Entrenador', 
      'Entrenarqueros', 
      'SuperAdministrador' -- Found existing role
  ));
