-- Create operations table to store Excel data
CREATE TABLE public.operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boleto TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE,
  cod_cliente TEXT,
  nombre_cliente TEXT,
  vendedor TEXT,
  producto TEXT,
  cantidad NUMERIC DEFAULT 0,
  precio_unitario NUMERIC DEFAULT 0,
  total_operacion NUMERIC DEFAULT 0,
  usado TEXT,
  valor_usado NUMERIC DEFAULT 0,
  chasis_motor TEXT,
  diferencia_cobrar NUMERIC DEFAULT 0,
  forma_pago TEXT,
  fecha_pago TIMESTAMP WITH TIME ZONE,
  recibo TEXT,
  cuota TEXT,
  cheque_transf TEXT,
  vto_cheque TIMESTAMP WITH TIME ZONE,
  tipo_cambio NUMERIC DEFAULT 0,
  importe_ars NUMERIC DEFAULT 0,
  importe_usd NUMERIC DEFAULT 0,
  cta_cte NUMERIC DEFAULT 0,
  saldo_final NUMERIC,
  tc_saldo NUMERIC DEFAULT 0,
  saldo_pesos NUMERIC DEFAULT 0,
  observacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public read/write for now since no auth)
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" 
ON public.operations 
FOR SELECT 
USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access" 
ON public.operations 
FOR INSERT 
WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Allow public update access" 
ON public.operations 
FOR UPDATE 
USING (true);

-- Allow public delete access
CREATE POLICY "Allow public delete access" 
ON public.operations 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_operations_updated_at
BEFORE UPDATE ON public.operations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_operations_boleto ON public.operations(boleto);
CREATE INDEX idx_operations_cod_cliente ON public.operations(cod_cliente);
CREATE INDEX idx_operations_fecha ON public.operations(fecha);