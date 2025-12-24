import { Ticket, ClientSummary, TicketSummary } from './types';

export const mockTickets: Ticket[] = [
  {
    ticketNumber: 'BOL-2024-001',
    clientCode: 'CLI-001',
    clientName: 'Transportes del Sur S.A.',
    operationDate: new Date('2024-11-15'),
    paymentMethod: 'Financiación 12 cuotas - Cheques diferidos',
    observations: 'Cliente prioritario. Entrega coordinada para el 20/11. Incluye capacitación gratuita.',
    products: [
      {
        id: '1',
        description: 'Ómnibus Mercedes-Benz O500 RS 1836',
        quantity: 1,
        unitPrice: 185000,
        totalPrice: 185000,
        usedItem: {
          description: 'Ómnibus Scania K380 2018 - Pat. AC123BD',
          value: 45000,
        },
      },
      {
        id: '2',
        description: 'Kit de Seguridad Premium (ABS + ESP)',
        quantity: 1,
        unitPrice: 8500,
        totalPrice: 8500,
      },
    ],
    payments: [
      {
        id: 'p1',
        date: new Date('2024-11-15'),
        detail: 'Anticipo',
        receiptNumber: 'REC-001245',
        amountARS: 15000000,
        exchangeRate: 1050,
        amountUSD: 14285.71,
        runningBalance: 134214.29,
      },
      {
        id: 'p2',
        date: new Date('2024-12-01'),
        detail: 'Cheque Banco Nación',
        receiptNumber: 'CHQ-889912',
        checkDueDate: new Date('2024-12-15'),
        amountARS: 20000000,
        exchangeRate: 1080,
        amountUSD: 18518.52,
        runningBalance: 115695.77,
      },
      {
        id: 'p3',
        date: new Date('2024-12-15'),
        detail: 'Transferencia Bancaria',
        receiptNumber: 'TRF-445566',
        amountARS: 25000000,
        exchangeRate: 1095,
        amountUSD: 22831.05,
        runningBalance: 92864.72,
      },
    ],
    totalSale: 193500,
    totalUsed: 45000,
    initialBalance: 148500,
    totalPayments: 55635.28,
    finalBalance: 92864.72,
  },
  {
    ticketNumber: 'BOL-2024-002',
    clientCode: 'CLI-001',
    clientName: 'Transportes del Sur S.A.',
    operationDate: new Date('2024-10-20'),
    paymentMethod: 'Contado - Transferencia',
    observations: 'Repuestos para flota existente.',
    products: [
      {
        id: '3',
        description: 'Motor Mercedes-Benz OM457LA Reconstruido',
        quantity: 1,
        unitPrice: 28000,
        totalPrice: 28000,
      },
      {
        id: '4',
        description: 'Caja de Cambios ZF 6HP502',
        quantity: 1,
        unitPrice: 15000,
        totalPrice: 15000,
      },
    ],
    payments: [
      {
        id: 'p4',
        date: new Date('2024-10-20'),
        detail: 'Pago Total',
        receiptNumber: 'TRF-334455',
        amountARS: 44100000,
        exchangeRate: 1025,
        amountUSD: 43024.39,
        runningBalance: 0,
      },
    ],
    totalSale: 43000,
    totalUsed: 0,
    initialBalance: 43000,
    totalPayments: 43024.39,
    finalBalance: -24.39,
  },
  {
    ticketNumber: 'BOL-2024-003',
    clientCode: 'CLI-002',
    clientName: 'Flota Patagónica S.R.L.',
    operationDate: new Date('2024-11-01'),
    paymentMethod: 'Financiación 6 cuotas',
    observations: 'Primera compra del cliente. Requiere seguimiento comercial.',
    products: [
      {
        id: '5',
        description: 'Minibus Iveco Daily 70C17 - 24 pasajeros',
        quantity: 2,
        unitPrice: 65000,
        totalPrice: 130000,
      },
    ],
    payments: [
      {
        id: 'p5',
        date: new Date('2024-11-01'),
        detail: 'Anticipo 30%',
        receiptNumber: 'REC-001350',
        amountARS: 40950000,
        exchangeRate: 1050,
        amountUSD: 39000,
        runningBalance: 91000,
      },
      {
        id: 'p6',
        date: new Date('2024-12-01'),
        detail: 'Cuota 1/6',
        receiptNumber: 'REC-001420',
        amountARS: 16380000,
        exchangeRate: 1080,
        amountUSD: 15166.67,
        runningBalance: 75833.33,
      },
    ],
    totalSale: 130000,
    totalUsed: 0,
    initialBalance: 130000,
    totalPayments: 54166.67,
    finalBalance: 75833.33,
  },
];

export function getTicketByNumber(ticketNumber: string): Ticket | undefined {
  return mockTickets.find(t => 
    t.ticketNumber.toLowerCase() === ticketNumber.toLowerCase()
  );
}

export function getTicketsByClientCode(clientCode: string): Ticket[] {
  return mockTickets.filter(t => 
    t.clientCode.toLowerCase() === clientCode.toLowerCase()
  );
}

export function searchTicketsOrClient(query: string): { 
  type: 'ticket' | 'client' | 'not_found';
  tickets: Ticket[];
  clientName?: string;
} {
  const normalizedQuery = query.toLowerCase().trim();
  
  // First check if it's a ticket number
  const ticket = getTicketByNumber(normalizedQuery);
  if (ticket) {
    return { type: 'ticket', tickets: [ticket] };
  }
  
  // Then check if it's a client code
  const clientTickets = getTicketsByClientCode(normalizedQuery);
  if (clientTickets.length > 0) {
    return { 
      type: 'client', 
      tickets: clientTickets,
      clientName: clientTickets[0].clientName 
    };
  }
  
  // Search by partial match in ticket number or client name
  const partialMatches = mockTickets.filter(t => 
    t.ticketNumber.toLowerCase().includes(normalizedQuery) ||
    t.clientName.toLowerCase().includes(normalizedQuery) ||
    t.clientCode.toLowerCase().includes(normalizedQuery)
  );
  
  if (partialMatches.length > 0) {
    const uniqueClients = [...new Set(partialMatches.map(t => t.clientCode))];
    if (uniqueClients.length === 1) {
      return { 
        type: 'client', 
        tickets: partialMatches,
        clientName: partialMatches[0].clientName 
      };
    }
    return { type: 'client', tickets: partialMatches };
  }
  
  return { type: 'not_found', tickets: [] };
}

export function getClientSummary(tickets: Ticket[]): ClientSummary | null {
  if (tickets.length === 0) return null;
  
  const ticketSummaries: TicketSummary[] = tickets.map(t => {
    let status: 'saldado' | 'pendiente' | 'proceso';
    if (t.finalBalance < 10) {
      status = 'saldado';
    } else if (t.finalBalance > 1000) {
      status = 'pendiente';
    } else {
      status = 'proceso';
    }
    
    return {
      ticketNumber: t.ticketNumber,
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
