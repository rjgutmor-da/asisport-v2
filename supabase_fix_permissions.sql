-- Enable RLS on usuarios table
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 1. Policies for Reading Users
-- Everyone authenticated can read users (needed to find coaches, etc)
CREATE POLICY "Allow authenticated read access"
ON public.usuarios
FOR SELECT
TO authenticated
USING (true);

-- 2. Policies for Inserting Profile
-- Users can insert their own profile upon signup
CREATE POLICY "Allow insert own profile"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. Policies for Updating Profile
-- Users can update their own profile
CREATE POLICY "Allow update own profile"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 4. Policies for Owner (Dueño)
-- Owners can update any profile (to change roles, active status)
CREATE POLICY "Allow owner to update all"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'Dueño'
  )
);

-- Note: If policies already exist with same names, this might fail.
-- You can drop them first if needed:
-- DROP POLICY IF EXISTS "Allow authenticated read access" ON public.usuarios;
-- DROP POLICY IF EXISTS "Allow insert own profile" ON public.usuarios;
-- DROP POLICY IF EXISTS "Allow update own profile" ON public.usuarios;
-- DROP POLICY IF EXISTS "Allow owner to update all" ON public.usuarios;
