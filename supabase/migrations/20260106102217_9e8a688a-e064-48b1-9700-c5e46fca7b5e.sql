-- Actualizar políticas RLS en operations para requerir autenticación

-- Eliminar políticas públicas existentes
DROP POLICY IF EXISTS "Allow public delete access" ON public.operations;
DROP POLICY IF EXISTS "Allow public insert access" ON public.operations;
DROP POLICY IF EXISTS "Allow public read access" ON public.operations;
DROP POLICY IF EXISTS "Allow public update access" ON public.operations;

-- Crear nuevas políticas que requieren autenticación
CREATE POLICY "Authenticated users can read operations" 
ON public.operations 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert operations" 
ON public.operations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update operations" 
ON public.operations 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete operations" 
ON public.operations 
FOR DELETE 
TO authenticated
USING (true);

-- Actualizar políticas de storage para boletos-pdf
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access" ON storage.objects;

-- Crear políticas de storage para usuarios autenticados
CREATE POLICY "Authenticated users can read boletos-pdf" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'boletos-pdf');

CREATE POLICY "Authenticated users can upload boletos-pdf" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'boletos-pdf');

CREATE POLICY "Authenticated users can delete boletos-pdf" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'boletos-pdf');