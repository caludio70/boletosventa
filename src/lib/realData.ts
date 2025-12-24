import { OperationRow, Ticket, TotalByTicket, TicketSummary, ClientSummary } from './types';

// Helper to parse currency values like "USD 300,500.00"
function parseUSD(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const cleaned = value.toString().replace(/USD\s*/i, '').replace(/,/g, '').replace(/\$/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Helper to parse dates
function parseDate(value: string | undefined): Date | null {
  if (!value || value === '') return null;
  // Handle formats like "4/30/25" or "30/04/2025"
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  
  let day: number, month: number, year: number;
  
  if (parts[2].length === 2) {
    // Format: M/D/YY
    month = parseInt(parts[0]) - 1;
    day = parseInt(parts[1]);
    year = 2000 + parseInt(parts[2]);
  } else {
    // Format: DD/MM/YYYY
    day = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;
    year = parseInt(parts[2]);
  }
  
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

// Raw data from Excel
const rawOperations: Partial<OperationRow>[] = [
  { boleto: '22283', fecha: new Date(2025, 3, 30), codCliente: '10521', nombreCliente: 'TRANSPORTE PERSONAL S.A.', vendedor: 'Manuel Ugarte', producto: 'O 500 M 1826 Euro V Carroceria Saldivia', cantidad: 1, precioUnitario: 300500, totalOperacion: 300500, usado: '', valorUsado: 0, formaPago: 'Credito', fechaPago: new Date(2025, 3, 30), recibo: '181-662', cuota: '', chequeTransf: 'Credito', vtoCheque: new Date(2025, 3, 30), tipoCambio: 1190, importeARS: 230000299.57, importeUSD: 193277.56, ctaCte: 193277.56, observacion: 'Credito banco ICBC liquidado el dia 30/04/2025. El saldo con cheques' },
  { boleto: '22283', fecha: new Date(2025, 3, 30), codCliente: '10521', nombreCliente: 'TRANSPORTE PERSONAL S.A.', vendedor: 'Manuel Ugarte', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 8, 4), recibo: '181-895', cuota: '1', chequeTransf: 'Echq', vtoCheque: new Date(2025, 8, 5), tipoCambio: 1370, importeARS: 34600000, importeUSD: 25255.47, ctaCte: 218533.04, observacion: 'Se reconvirtio la operación' },
  { boleto: '22283', fecha: new Date(2025, 3, 30), codCliente: '10521', nombreCliente: 'TRANSPORTE PERSONAL S.A.', vendedor: 'Manuel Ugarte', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 8, 4), recibo: '181-898', cuota: '4', chequeTransf: 'Retenciones', vtoCheque: new Date(2025, 8, 5), tipoCambio: 1370, importeARS: 8636387.06, importeUSD: 6303.93, ctaCte: 224836.97, observacion: '' },
  { boleto: '22283', fecha: new Date(2025, 3, 30), codCliente: '10521', nombreCliente: 'TRANSPORTE PERSONAL S.A.', vendedor: 'Manuel Ugarte', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 8, 4), recibo: '181-895', cuota: '2', chequeTransf: 'Echq', vtoCheque: new Date(2025, 9, 10), tipoCambio: 1450, importeARS: 34600000, importeUSD: 23862.07, ctaCte: 248699.04, observacion: '' },
  { boleto: '22283', fecha: new Date(2025, 3, 30), codCliente: '10521', nombreCliente: 'TRANSPORTE PERSONAL S.A.', vendedor: 'Manuel Ugarte', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 8, 4), recibo: '181-895', cuota: '3', chequeTransf: 'Echq', vtoCheque: new Date(2025, 10, 7), tipoCambio: 1445, importeARS: 34600000, importeUSD: 23944.64, ctaCte: 272643.67, observacion: '' },
  { boleto: '22283', fecha: new Date(2025, 3, 30), codCliente: '10521', nombreCliente: 'TRANSPORTE PERSONAL S.A.', vendedor: 'Manuel Ugarte', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 8, 4), recibo: '181-895', cuota: '4', chequeTransf: 'Echq', vtoCheque: new Date(2025, 11, 12), tipoCambio: 1465, importeARS: 34458352.94, importeUSD: 23521.06, ctaCte: 296164.73, observacion: '' },
  { boleto: '22283', fecha: new Date(2025, 3, 30), codCliente: '10521', nombreCliente: 'TRANSPORTE PERSONAL S.A.', vendedor: 'Manuel Ugarte', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 9, 24), recibo: '181-960', cuota: '2', chequeTransf: 'Dif cuota', vtoCheque: new Date(2025, 9, 24), tipoCambio: 1450, importeARS: 2043814.01, importeUSD: 1409.53, ctaCte: 297574.26, saldoFinal: 2925.74, observacion: '' },
  
  { boleto: '22284', fecha: new Date(2025, 3, 30), codCliente: '124046', nombreCliente: 'CAR-COR S.R.L.', vendedor: 'Fernando Uga', producto: 'OF 1621 CA', cantidad: 2, precioUnitario: 143222.41, totalOperacion: 286444.83, usado: '', valorUsado: 0, formaPago: '', fechaPago: null, recibo: '181-517', cuota: '', chequeTransf: 'chq', vtoCheque: null, tipoCambio: 1160, importeARS: 193879000, importeUSD: 167137.07, ctaCte: 119307.76, observacion: 'Pago anticipado realizado por Martin Salgado' },
  { boleto: '22284', fecha: new Date(2025, 3, 30), codCliente: '124046', nombreCliente: 'CAR-COR S.R.L.', vendedor: 'Fernando Uga', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 6, 7), recibo: '181-837', cuota: '', chequeTransf: 'trf', vtoCheque: null, tipoCambio: 1160, importeARS: 118076000, importeUSD: 101789.66, ctaCte: 101789.66, observacion: '' },
  { boleto: '22284', fecha: new Date(2025, 3, 30), codCliente: '124046', nombreCliente: 'CAR-COR S.R.L.', vendedor: 'Fernando Uga', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 8, 5), recibo: '181-896', cuota: '', chequeTransf: 'trf', vtoCheque: null, tipoCambio: 1380, importeARS: 20231000, importeUSD: 14660.14, ctaCte: 14660.14, observacion: '' },
  { boleto: '22284', fecha: new Date(2025, 3, 30), codCliente: '124046', nombreCliente: 'CAR-COR S.R.L.', vendedor: 'Fernando Uga', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: null, recibo: 'Descuento', cuota: '', chequeTransf: '', vtoCheque: null, tipoCambio: 0, importeARS: 0, importeUSD: 2857.96, ctaCte: 0, saldoFinal: 0, observacion: 'Descuento aplicado por pago en efectivo' },
  
  { boleto: '22285', fecha: new Date(2025, 3, 30), codCliente: '10526', nombreCliente: 'TRANSPORTE GENERAL RODRIGUEZ S.A.', vendedor: 'Fernando Uga', producto: 'OF 1621 CM', cantidad: 1, precioUnitario: 165100, totalOperacion: 165100, usado: '', valorUsado: 0, formaPago: '', fechaPago: new Date(2025, 3, 30), recibo: '181-664', cuota: '', chequeTransf: 'chq', vtoCheque: null, tipoCambio: 1190, importeARS: 111860000, importeUSD: 94000, ctaCte: 94000, observacion: 'Precio Chasis USD94.000 TC BNA lo paga de contado' },
  { boleto: '22285', fecha: new Date(2025, 3, 30), codCliente: '10526', nombreCliente: 'TRANSPORTE GENERAL RODRIGUEZ S.A.', vendedor: 'Fernando Uga', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 9, 3), recibo: '181-929', cuota: '', chequeTransf: 'chq', vtoCheque: null, tipoCambio: 1380, importeARS: 101631176.83, importeUSD: 73645.78, ctaCte: 167645.78, observacion: '' },
  { boleto: '22285', fecha: new Date(2025, 3, 30), codCliente: '10526', nombreCliente: 'TRANSPORTE GENERAL RODRIGUEZ S.A.', vendedor: 'Fernando Uga', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 9, 7), recibo: '181-935', cuota: '', chequeTransf: 'Ret', vtoCheque: null, tipoCambio: 1380, importeARS: 1868823.17, importeUSD: 1354.22, ctaCte: 169000, saldoFinal: 0, observacion: '' },
  
  { boleto: '22286', fecha: new Date(2025, 3, 30), codCliente: '118', nombreCliente: 'EMPRESA TANDILENSE S A C I F I Y DE S.', vendedor: 'Fernando Uga', producto: 'OH 1721/62 Euro V', cantidad: 2, precioUnitario: 198000, totalOperacion: 396000, usado: 'O500 U Año 2021 AE851SA / AF 016SC', valorUsado: 271000, formaPago: '', fechaPago: null, recibo: '', cuota: '', chequeTransf: '', vtoCheque: null, tipoCambio: 0, importeARS: 0, importeUSD: 0, ctaCte: 0, saldoFinal: 125000, observacion: '' },
  
  { boleto: '22295', fecha: new Date(2025, 4, 2), codCliente: '123348', nombreCliente: 'EMPRESA DE TRANSPORTES AMERICA SAC E I', vendedor: 'Fernando Uga', producto: 'OH 1621/55 Euro V', cantidad: 1, precioUnitario: 207400, totalOperacion: 207400, usado: 'N/A', valorUsado: 0, formaPago: 'Contado', fechaPago: new Date(2025, 4, 2), recibo: '181-762', cuota: '', chequeTransf: 'trf', vtoCheque: null, tipoCambio: 1190, importeARS: 246806000, importeUSD: 207400, ctaCte: 0, saldoFinal: 0, observacion: 'PRECIO USD207.400 EL CLIENTE PAGA DE CONTADO' },
  
  { boleto: '22296', fecha: new Date(2025, 4, 13), codCliente: '125846', nombreCliente: 'TRANSPORTES COLEGIALES S A C I', vendedor: 'Diego Diaz', producto: 'OH 1621/55 Euro V', cantidad: 1, precioUnitario: 112000, totalOperacion: 112000, usado: 'N/A', valorUsado: 0, formaPago: '', fechaPago: new Date(2025, 4, 14), recibo: '181-769', cuota: '', chequeTransf: 'trf', vtoCheque: null, tipoCambio: 1150, importeARS: 128800000, importeUSD: 112000, ctaCte: 0, saldoFinal: 0, observacion: 'Pago contado precio de chasis USD112.000' },
  
  { boleto: '22297', fecha: new Date(2025, 4, 13), codCliente: '125846', nombreCliente: 'TRANSPORTES COLEGIALES S A C I', vendedor: 'Diego Diaz', producto: 'H5B3L', cantidad: 3, precioUnitario: 91000, totalOperacion: 273000, usado: 'N/A', valorUsado: 0, formaPago: '', fechaPago: new Date(2025, 5, 11), recibo: '181-822', cuota: '', chequeTransf: 'trf', vtoCheque: null, tipoCambio: 1200, importeARS: 60000000, importeUSD: 50000, ctaCte: 50000, observacion: 'PRECIO DE CA USD 91.000 CU INCLUYE A/A' },
  { boleto: '22297', fecha: new Date(2025, 4, 13), codCliente: '125846', nombreCliente: 'TRANSPORTES COLEGIALES S A C I', vendedor: 'Diego Diaz', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 6, 31), recibo: '181-861', cuota: '', chequeTransf: 'trf', vtoCheque: null, tipoCambio: 1300, importeARS: 65000000, importeUSD: 50000, ctaCte: 100000, observacion: '' },
  { boleto: '22297', fecha: new Date(2025, 4, 13), codCliente: '125846', nombreCliente: 'TRANSPORTES COLEGIALES S A C I', vendedor: 'Diego Diaz', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 7, 6), recibo: '181-866', cuota: '', chequeTransf: 'trf', vtoCheque: null, tipoCambio: 1350, importeARS: 135000000, importeUSD: 100000, ctaCte: 200000, observacion: '' },
  { boleto: '22297', fecha: new Date(2025, 4, 13), codCliente: '125846', nombreCliente: 'TRANSPORTES COLEGIALES S A C I', vendedor: 'Diego Diaz', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 7, 21), recibo: '181-700', cuota: '', chequeTransf: 'trf', vtoCheque: null, tipoCambio: 1325, importeARS: 53000000, importeUSD: 40000, ctaCte: 240000, observacion: '' },
  { boleto: '22297', fecha: new Date(2025, 4, 13), codCliente: '125846', nombreCliente: 'TRANSPORTES COLEGIALES S A C I', vendedor: 'Diego Diaz', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 8, 10), recibo: '181-907', cuota: '', chequeTransf: 'trf', vtoCheque: null, tipoCambio: 1370, importeARS: 45210000, importeUSD: 33000, ctaCte: 273000, saldoFinal: 0, observacion: '' },
  
  { boleto: '22298', fecha: new Date(2025, 4, 13), codCliente: '123327', nombreCliente: 'EXPRESO LOMAS DE ZAMORA SA', vendedor: 'Diego Diaz', producto: 'OH 1621 / 55 Euro V', cantidad: 1, precioUnitario: 166000, totalOperacion: 166000, usado: 'N/A', valorUsado: 0, formaPago: '', fechaPago: new Date(2025, 4, 13), recibo: '181-768', cuota: '', chequeTransf: 'trf', vtoCheque: null, tipoCambio: 1190, importeARS: 128520000, importeUSD: 108000, ctaCte: 108000, observacion: 'Precio USD 166.000 TRF de USD 108.000 y el saldo con cheques' },
  { boleto: '22298', fecha: new Date(2025, 4, 13), codCliente: '123327', nombreCliente: 'EXPRESO LOMAS DE ZAMORA SA', vendedor: 'Diego Diaz', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 5, 19), recibo: '181-815', cuota: '', chequeTransf: 'chq', vtoCheque: new Date(2025, 5, 19), tipoCambio: 1200, importeARS: 11600000, importeUSD: 9666.67, ctaCte: 117666.67, observacion: '' },
  { boleto: '22298', fecha: new Date(2025, 4, 13), codCliente: '123327', nombreCliente: 'EXPRESO LOMAS DE ZAMORA SA', vendedor: 'Diego Diaz', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 5, 19), recibo: '181-815', cuota: '', chequeTransf: 'chq', vtoCheque: new Date(2025, 6, 19), tipoCambio: 1200, importeARS: 11600000, importeUSD: 9666.67, ctaCte: 127333.33, observacion: '' },
  { boleto: '22298', fecha: new Date(2025, 4, 13), codCliente: '123327', nombreCliente: 'EXPRESO LOMAS DE ZAMORA SA', vendedor: 'Diego Diaz', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 5, 19), recibo: '181-815', cuota: '', chequeTransf: 'chq', vtoCheque: new Date(2025, 7, 19), tipoCambio: 1200, importeARS: 11600000, importeUSD: 9666.67, ctaCte: 137000, observacion: '' },
  { boleto: '22298', fecha: new Date(2025, 4, 13), codCliente: '123327', nombreCliente: 'EXPRESO LOMAS DE ZAMORA SA', vendedor: 'Diego Diaz', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 5, 19), recibo: '181-815', cuota: '', chequeTransf: 'chq', vtoCheque: new Date(2025, 8, 19), tipoCambio: 1200, importeARS: 11600000, importeUSD: 9666.67, ctaCte: 146666.67, observacion: '' },
  { boleto: '22298', fecha: new Date(2025, 4, 13), codCliente: '123327', nombreCliente: 'EXPRESO LOMAS DE ZAMORA SA', vendedor: 'Diego Diaz', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 5, 19), recibo: '181-815', cuota: '', chequeTransf: 'chq', vtoCheque: new Date(2025, 9, 19), tipoCambio: 1200, importeARS: 11600000, importeUSD: 9666.67, ctaCte: 156333.33, observacion: '' },
  { boleto: '22298', fecha: new Date(2025, 4, 13), codCliente: '123327', nombreCliente: 'EXPRESO LOMAS DE ZAMORA SA', vendedor: 'Diego Diaz', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 5, 19), recibo: '181-815', cuota: '', chequeTransf: 'chq', vtoCheque: new Date(2025, 10, 19), tipoCambio: 1200, importeARS: 11600000, importeUSD: 9666.67, ctaCte: 166000, saldoFinal: 0, observacion: '' },
  
  { boleto: '22300', fecha: new Date(2025, 4, 15), codCliente: '10504', nombreCliente: 'VILLA GALICIA TIGRE S A', vendedor: 'Fernando Uga', producto: 'OF 1621 CM', cantidad: 1, precioUnitario: 178900, totalOperacion: 178900, usado: 'OH 1618 Año 2015', valorUsado: 55000, formaPago: 'Contado', fechaPago: new Date(2025, 4, 15), recibo: '181-770', cuota: '', chequeTransf: 'trf', vtoCheque: null, tipoCambio: 1195, importeARS: 148015000, importeUSD: 123900, ctaCte: 0, saldoFinal: 0, observacion: 'Pago total de contado' },
  
  { boleto: '22301', fecha: new Date(2025, 4, 19), codCliente: '123361', nombreCliente: 'UNION PLATENSE SRL', vendedor: 'Diego Diaz', producto: 'H5B3L + H5B3L', cantidad: 2, precioUnitario: 137000, totalOperacion: 274000, usado: 'N/A', valorUsado: 0, formaPago: '', fechaPago: new Date(2025, 4, 28), recibo: '181-786', cuota: '', chequeTransf: 'trf', vtoCheque: null, tipoCambio: 1210, importeARS: 192390000, importeUSD: 159000, ctaCte: 159000, observacion: '' },
  { boleto: '22301', fecha: new Date(2025, 4, 19), codCliente: '123361', nombreCliente: 'UNION PLATENSE SRL', vendedor: 'Diego Diaz', producto: '', cantidad: 0, precioUnitario: 0, totalOperacion: 0, formaPago: '', fechaPago: new Date(2025, 7, 26), recibo: '181-871', cuota: '', chequeTransf: 'trf', vtoCheque: null, tipoCambio: 1360, importeARS: 156400000, importeUSD: 115000, ctaCte: 274000, saldoFinal: 0, observacion: '' },
];

// Group operations by ticket number
function groupByTicket(operations: Partial<OperationRow>[]): Map<string, Partial<OperationRow>[]> {
  const groups = new Map<string, Partial<OperationRow>[]>();
  
  for (const op of operations) {
    if (!op.boleto) continue;
    if (!groups.has(op.boleto)) {
      groups.set(op.boleto, []);
    }
    groups.get(op.boleto)!.push(op);
  }
  
  return groups;
}

// Get all totals by ticket in format: cliente | boleto | venta usd | usados usd | pagos usd | saldo final
export function getTotalsByTicket(): TotalByTicket[] {
  const groups = groupByTicket(rawOperations);
  const result: TotalByTicket[] = [];
  
  for (const [ticketNum, ops] of groups) {
    const firstOp = ops[0];
    
    // Get total sale (sum of totalOperacion where producto is not empty)
    const ventaUSD = ops
      .filter(op => op.producto && op.producto !== '')
      .reduce((sum, op) => sum + (op.totalOperacion || 0), 0);
    
    // Get total used items value
    const usadosUSD = ops
      .filter(op => op.valorUsado && op.valorUsado > 0)
      .reduce((sum, op) => sum + (op.valorUsado || 0), 0);
    
    // Get total payments (sum of importeUSD where there's a payment date)
    const pagosUSD = ops
      .filter(op => op.fechaPago && op.importeUSD)
      .reduce((sum, op) => sum + (op.importeUSD || 0), 0);
    
    // Calculate saldo final
    const saldoFinal = ventaUSD - usadosUSD - pagosUSD;
    
    result.push({
      clientName: firstOp.nombreCliente || '',
      ticketNumber: ticketNum,
      ventaUSD,
      usadosUSD,
      pagosUSD,
      saldoFinal: Math.round(saldoFinal * 100) / 100,
    });
  }
  
  // Sort by ticket number
  result.sort((a, b) => a.ticketNumber.localeCompare(b.ticketNumber));
  
  return result;
}

// Build ticket object from operations
function buildTicket(ticketNum: string, ops: Partial<OperationRow>[]): Ticket {
  const firstOp = ops[0];
  
  // Products (rows with producto)
  const products = ops
    .filter(op => op.producto && op.producto !== '')
    .map((op, idx) => ({
      id: `${ticketNum}-p${idx}`,
      description: op.producto || '',
      quantity: op.cantidad || 0,
      unitPrice: op.precioUnitario || 0,
      totalPrice: op.totalOperacion || 0,
      usedItem: op.valorUsado && op.valorUsado > 0 ? {
        description: op.usado || 'Usado',
        value: op.valorUsado,
      } : undefined,
    }));
  
  // Payments (rows with fechaPago and importeUSD)
  let runningBalance = products.reduce((sum, p) => sum + p.totalPrice, 0) 
    - products.reduce((sum, p) => sum + (p.usedItem?.value || 0), 0);
  
  const payments = ops
    .filter(op => op.fechaPago && op.importeUSD && op.importeUSD > 0)
    .map((op, idx) => {
      runningBalance -= op.importeUSD!;
      return {
        id: `${ticketNum}-pay${idx}`,
        date: op.fechaPago!,
        detail: op.chequeTransf || 'Pago',
        receiptNumber: op.recibo || '',
        checkDueDate: op.vtoCheque || undefined,
        amountARS: op.importeARS || 0,
        exchangeRate: op.tipoCambio || 0,
        amountUSD: op.importeUSD || 0,
        runningBalance: Math.round(runningBalance * 100) / 100,
      };
    });
  
  const totalSale = products.reduce((sum, p) => sum + p.totalPrice, 0);
  const totalUsed = products.reduce((sum, p) => sum + (p.usedItem?.value || 0), 0);
  const initialBalance = totalSale - totalUsed;
  const totalPayments = payments.reduce((sum, p) => sum + p.amountUSD, 0);
  const finalBalance = initialBalance - totalPayments;
  
  // Get observation from first row with observation
  const observation = ops.find(op => op.observacion && op.observacion !== '')?.observacion || '';
  
  return {
    ticketNumber: ticketNum,
    clientCode: firstOp.codCliente || '',
    clientName: firstOp.nombreCliente || '',
    operationDate: firstOp.fecha || new Date(),
    paymentMethod: firstOp.formaPago || 'Financiación',
    observations: observation,
    products,
    payments,
    totalSale,
    totalUsed,
    initialBalance,
    totalPayments,
    finalBalance: Math.round(finalBalance * 100) / 100,
  };
}

// Get ticket by number
export function getTicketByNumber(ticketNumber: string): Ticket | undefined {
  const groups = groupByTicket(rawOperations);
  const ops = groups.get(ticketNumber);
  if (!ops) return undefined;
  return buildTicket(ticketNumber, ops);
}

// Get tickets by client code
export function getTicketsByClientCode(clientCode: string): Ticket[] {
  const groups = groupByTicket(rawOperations);
  const result: Ticket[] = [];
  
  for (const [ticketNum, ops] of groups) {
    if (ops[0].codCliente === clientCode) {
      result.push(buildTicket(ticketNum, ops));
    }
  }
  
  return result;
}

// Search function
export function searchTicketsOrClient(query: string): {
  type: 'ticket' | 'client' | 'not_found';
  tickets: Ticket[];
  clientName?: string;
} {
  const normalizedQuery = query.toLowerCase().trim();
  
  // First check if it's a ticket number
  const ticket = getTicketByNumber(normalizedQuery) || getTicketByNumber(query);
  if (ticket) {
    return { type: 'ticket', tickets: [ticket] };
  }
  
  // Then check if it's a client code
  const clientTickets = getTicketsByClientCode(normalizedQuery) || getTicketsByClientCode(query);
  if (clientTickets.length > 0) {
    return {
      type: 'client',
      tickets: clientTickets,
      clientName: clientTickets[0].clientName,
    };
  }
  
  // Search by partial match
  const groups = groupByTicket(rawOperations);
  const matches: Ticket[] = [];
  
  for (const [ticketNum, ops] of groups) {
    const firstOp = ops[0];
    if (
      ticketNum.toLowerCase().includes(normalizedQuery) ||
      firstOp.nombreCliente?.toLowerCase().includes(normalizedQuery) ||
      firstOp.codCliente?.toLowerCase().includes(normalizedQuery)
    ) {
      matches.push(buildTicket(ticketNum, ops));
    }
  }
  
  if (matches.length > 0) {
    const uniqueClients = [...new Set(matches.map(t => t.clientCode))];
    if (uniqueClients.length === 1) {
      return {
        type: 'client',
        tickets: matches,
        clientName: matches[0].clientName,
      };
    }
    return { type: 'client', tickets: matches };
  }
  
  return { type: 'not_found', tickets: [] };
}

// Get client summary
export function getClientSummary(tickets: Ticket[]): ClientSummary | null {
  if (tickets.length === 0) return null;
  
  const ticketSummaries: TicketSummary[] = tickets.map(t => {
    let status: 'saldado' | 'pendiente' | 'proceso';
    if (Math.abs(t.finalBalance) < 100) {
      status = 'saldado';
    } else if (t.finalBalance > 1000) {
      status = 'pendiente';
    } else {
      status = 'proceso';
    }
    
    return {
      ticketNumber: t.ticketNumber,
      clientName: t.clientName,
      saleUSD: t.totalSale,
      usedUSD: t.totalUsed,
      initialBalance: t.initialBalance,
      paymentsUSD: t.totalPayments,
      finalBalance: t.finalBalance,
      status,
    };
  });
  
  return {
    clientCode: tickets[0].clientCode,
    clientName: tickets[0].clientName,
    tickets: ticketSummaries,
    totalSale: tickets.reduce((sum, t) => sum + t.totalSale, 0),
    totalUsed: tickets.reduce((sum, t) => sum + t.totalUsed, 0),
    totalPayments: tickets.reduce((sum, t) => sum + t.totalPayments, 0),
    totalBalance: tickets.reduce((sum, t) => sum + t.finalBalance, 0),
  };
}

// Get all tickets
export function getAllTickets(): Ticket[] {
  const groups = groupByTicket(rawOperations);
  const result: Ticket[] = [];
  
  for (const [ticketNum, ops] of groups) {
    result.push(buildTicket(ticketNum, ops));
  }
  
  return result.sort((a, b) => a.ticketNumber.localeCompare(b.ticketNumber));
}
