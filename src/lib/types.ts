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
  saleUSD: number;
  usedUSD: number;
  initialBalance: number;
  paymentsUSD: number;
  finalBalance: number;
  status: 'saldado' | 'pendiente' | 'proceso';
}
