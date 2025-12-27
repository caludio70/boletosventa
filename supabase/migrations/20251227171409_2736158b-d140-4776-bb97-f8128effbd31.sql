-- Create storage bucket for ticket PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('boletos-pdf', 'boletos-pdf', true);

-- Allow public read access to PDFs
CREATE POLICY "Public read access for boletos PDF"
ON storage.objects
FOR SELECT
USING (bucket_id = 'boletos-pdf');

-- Allow public upload access (since no auth)
CREATE POLICY "Public upload access for boletos PDF"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'boletos-pdf');

-- Allow public delete access
CREATE POLICY "Public delete access for boletos PDF"
ON storage.objects
FOR DELETE
USING (bucket_id = 'boletos-pdf');