-- Tabla para solicitudes de compra con flujo de aprobación
CREATE TABLE public.purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Datos del comprador
  buyer_name text NOT NULL,
  buyer_address text,
  buyer_locality text,
  buyer_postal_code text,
  buyer_email text,
  buyer_phone text,
  buyer_id_type text,
  buyer_id_number text,
  buyer_iva_condition text,
  
  -- Datos de la unidad
  unit_quantity integer DEFAULT 1,
  unit_brand text,
  unit_model text,
  unit_bodywork text,
  unit_type text,
  unit_year text,
  unit_condition text DEFAULT '0km',
  
  -- Precios
  price_usd numeric DEFAULT 0,
  dollar_reference numeric DEFAULT 0,
  price_ars numeric DEFAULT 0,
  
  -- Adicionales y usados (JSON)
  additionals jsonb DEFAULT '[]'::jsonb,
  used_units jsonb DEFAULT '[]'::jsonb,
  
  -- Totales
  total_additionals numeric DEFAULT 0,
  total_used numeric DEFAULT 0,
  final_balance numeric DEFAULT 0,
  
  -- Forma de pago y entrega
  payment_method text,
  estimated_delivery date,
  observations text,
  
  -- Aprobación
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approval_token uuid DEFAULT gen_random_uuid(),
  supervisor_email text,
  approved_by text,
  approved_at timestamp with time zone,
  rejection_reason text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create purchase requests"
ON public.purchase_requests FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own requests"
ON public.purchase_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Anon can view by approval token"
ON public.purchase_requests FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can update by approval token"
ON public.purchase_requests FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_purchase_requests_updated_at
BEFORE UPDATE ON public.purchase_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();