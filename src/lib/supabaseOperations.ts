import { supabase } from "@/integrations/supabase/client";
import { OperationRow } from "./types";

// Convert database row to OperationRow
function dbToOperationRow(row: any): Partial<OperationRow> {
  return {
    boleto: row.boleto,
    fecha: row.fecha ? new Date(row.fecha) : undefined,
    codCliente: row.cod_cliente,
    nombreCliente: row.nombre_cliente,
    vendedor: row.vendedor,
    producto: row.producto,
    cantidad: Number(row.cantidad) || 0,
    precioUnitario: Number(row.precio_unitario) || 0,
    totalOperacion: Number(row.total_operacion) || 0,
    usado: row.usado,
    valorUsado: Number(row.valor_usado) || 0,
    chasisMotor: row.chasis_motor,
    diferenciaCobrar: Number(row.diferencia_cobrar) || 0,
    formaPago: row.forma_pago,
    fechaPago: row.fecha_pago ? new Date(row.fecha_pago) : null,
    recibo: row.recibo,
    cuota: row.cuota,
    chequeTransf: row.cheque_transf,
    vtoCheque: row.vto_cheque ? new Date(row.vto_cheque) : null,
    tipoCambio: Number(row.tipo_cambio) || 0,
    importeARS: Number(row.importe_ars) || 0,
    importeUSD: Number(row.importe_usd) || 0,
    ctaCte: Number(row.cta_cte) || 0,
    saldoFinal: row.saldo_final !== null ? Number(row.saldo_final) : undefined,
    tcSaldo: Number(row.tc_saldo) || 0,
    saldoPesos: Number(row.saldo_pesos) || 0,
    observacion: row.observacion,
  };
}

// Convert OperationRow to database format
function operationRowToDb(op: Partial<OperationRow>): any {
  return {
    boleto: op.boleto || '',
    fecha: op.fecha?.toISOString(),
    cod_cliente: op.codCliente,
    nombre_cliente: op.nombreCliente,
    vendedor: op.vendedor,
    producto: op.producto,
    cantidad: op.cantidad || 0,
    precio_unitario: op.precioUnitario || 0,
    total_operacion: op.totalOperacion || 0,
    usado: op.usado,
    valor_usado: op.valorUsado || 0,
    chasis_motor: op.chasisMotor,
    diferencia_cobrar: op.diferenciaCobrar || 0,
    forma_pago: op.formaPago,
    fecha_pago: op.fechaPago?.toISOString(),
    recibo: op.recibo,
    cuota: op.cuota,
    cheque_transf: op.chequeTransf,
    vto_cheque: op.vtoCheque?.toISOString(),
    tipo_cambio: op.tipoCambio || 0,
    importe_ars: op.importeARS || 0,
    importe_usd: op.importeUSD || 0,
    cta_cte: op.ctaCte || 0,
    saldo_final: op.saldoFinal,
    tc_saldo: op.tcSaldo || 0,
    saldo_pesos: op.saldoPesos || 0,
    observacion: op.observacion,
  };
}

// Fetch all operations from the database
export async function fetchOperationsFromDb(): Promise<Partial<OperationRow>[]> {
  const { data, error } = await supabase
    .from('operations')
    .select('*')
    .order('boleto', { ascending: true })
    .order('fecha', { ascending: true });

  if (error) {
    console.error('Error fetching operations:', error);
    return [];
  }

  return (data || []).map(dbToOperationRow);
}

// Save operations to the database (replace all)
export async function saveOperationsToDb(operations: Partial<OperationRow>[]): Promise<boolean> {
  // First, delete all existing operations
  const { error: deleteError } = await supabase
    .from('operations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

  if (deleteError) {
    console.error('Error deleting operations:', deleteError);
    return false;
  }

  // Then insert all new operations
  if (operations.length > 0) {
    const dbRows = operations.map(operationRowToDb);
    
    // Insert in batches of 100 to avoid payload limits
    const batchSize = 100;
    for (let i = 0; i < dbRows.length; i += batchSize) {
      const batch = dbRows.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('operations')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting operations:', insertError);
        return false;
      }
    }
  }

  return true;
}

// Check if database has any operations
export async function hasOperationsInDb(): Promise<boolean> {
  const { count, error } = await supabase
    .from('operations')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error checking operations count:', error);
    return false;
  }

  return (count || 0) > 0;
}
