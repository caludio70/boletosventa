export interface OperationRow {
  boleto: string;
  fecha: Date;
  codCliente: string;
  nombreCliente: string;
  vendedor: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  totalOperacion: number;
  usado: string;
  valorUsado: number;
  chasisMotor: string;
  diferenciaCobrar: number;
  formaPago: string;
  fechaPago: Date | null;
  recibo: string;
  cuota: string;
  chequeTransf: string;
  vtoCheque: Date | null;
  tipoCambio: number;
  importeARS: number;
  importeUSD: number;
  ctaCte: number;
  saldoFinal: number;
  tcSaldo: number;
  saldoPesos: number;
  observacion: string;
}

export interface Product {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  usedItem?: {
    description: string;
    value: number;
  };
}

export interface Payment {
  id: string;
  date: Date;
  detail: string;
  receiptNumber: string;
  checkDueDate?: Date;
  amountARS: number;
  exchangeRate: number;
  amountUSD: number;
  runningBalance: number;
}

export interface Ticket {
  ticketNumber: string;
  clientCode: string;
  clientName: string;
  operationDate: Date;
  paymentMethod: string;
  observations: string;
  products: Product[];
  payments: Payment[];
  totalSale: number;
  totalUsed: number;
  initialBalance: number;
  totalPayments: number;
  finalBalance: number;
}

export interface ClientSummary {
  clientCode: string;
  clientName: string;
  tickets: TicketSummary[];
  totalSale: number;
  totalUsed: number;
  totalPayments: number;
  totalBalance: number;
}

export interface TicketSummary {
  ticketNumber: string;
  clientName: string;
  saleUSD: number;
  usedUSD: number;
  initialBalance: number;
  paymentsUSD: number;
  finalBalance: number;
  status: 'saldado' | 'pendiente' | 'proceso';
}

export interface TotalByTicket {
  clientName: string;
  ticketNumber: string;
  ventaUSD: number;
  usadosUSD: number;
  pagosUSD: number;
  saldoFinal: number;
}
