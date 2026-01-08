import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TotalByTicket, Ticket, ClientSummary } from './types';
import { formatCurrency, formatDate } from './formatters';

export function exportToExcel(data: TotalByTicket[], filename: string = 'totales_boletos') {
  // Prepare data for Excel
  const excelData = data.map(row => ({
    'Cliente': row.clientName,
    'Boleto': row.ticketNumber,
    'Venta USD': row.ventaUSD,
    'Usados USD': row.usadosUSD,
    'Pagos USD': row.pagosUSD,
    'Saldo Final': row.saldoFinal,
    'Estado': getStatus(row.saldoFinal),
  }));

  // Add totals row
  const totals = {
    'Cliente': 'TOTALES',
    'Boleto': `${data.length} boletos`,
    'Venta USD': data.reduce((sum, r) => sum + r.ventaUSD, 0),
    'Usados USD': data.reduce((sum, r) => sum + r.usadosUSD, 0),
    'Pagos USD': data.reduce((sum, r) => sum + r.pagosUSD, 0),
    'Saldo Final': data.reduce((sum, r) => sum + r.saldoFinal, 0),
    'Estado': '',
  };
  excelData.push(totals);

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Totales por Boleto');

  // Set column widths
  ws['!cols'] = [
    { wch: 35 }, // Cliente
    { wch: 10 }, // Boleto
    { wch: 15 }, // Venta
    { wch: 15 }, // Usados
    { wch: 15 }, // Pagos
    { wch: 15 }, // Saldo
    { wch: 12 }, // Estado
  ];

  // Download
  XLSX.writeFile(wb, `${filename}_${getDateString()}.xlsx`);
}

export function exportToPDF(data: TotalByTicket[], filename: string = 'totales_boletos') {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTOBUS S.A. - Total por Boleto', 14, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 22);

  // Table data
  const tableData = data.map(row => [
    row.clientName,
    row.ticketNumber,
    formatCurrency(row.ventaUSD),
    formatCurrency(row.usadosUSD),
    formatCurrency(row.pagosUSD),
    formatCurrency(row.saldoFinal),
    getStatus(row.saldoFinal),
  ]);

  // Totals row
  const totalsRow = [
    'TOTALES',
    `${data.length} boletos`,
    formatCurrency(data.reduce((sum, r) => sum + r.ventaUSD, 0)),
    formatCurrency(data.reduce((sum, r) => sum + r.usadosUSD, 0)),
    formatCurrency(data.reduce((sum, r) => sum + r.pagosUSD, 0)),
    formatCurrency(data.reduce((sum, r) => sum + r.saldoFinal, 0)),
    '',
  ];

  autoTable(doc, {
    head: [['Cliente', 'Boleto', 'Venta USD', 'Usados USD', 'Pagos USD', 'Saldo Final', 'Estado']],
    body: [...tableData, totalsRow],
    startY: 28,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    footStyles: {
      fillColor: [51, 51, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 60 }, // Cliente
      1: { cellWidth: 25, halign: 'center' }, // Boleto
      2: { cellWidth: 30, halign: 'right' }, // Venta
      3: { cellWidth: 30, halign: 'right' }, // Usados
      4: { cellWidth: 30, halign: 'right' }, // Pagos
      5: { cellWidth: 30, halign: 'right' }, // Saldo
      6: { cellWidth: 25, halign: 'center' }, // Estado
    },
    didParseCell: (data) => {
      // Style last row as totals
      if (data.row.index === tableData.length) {
        data.cell.styles.fillColor = [51, 51, 51];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.save(`${filename}_${getDateString()}.pdf`);
}

// Export single ticket to Excel
export function exportTicketToExcel(ticket: Ticket) {
  const wb = XLSX.utils.book_new();
  
  // Products sheet
  const productsData = ticket.products.map(p => ({
    'Descripción': p.description,
    'Cantidad': p.quantity,
    'Precio Unit.': p.unitPrice,
    'Total USD': p.totalPrice,
    'Usado': p.usedItem ? `${p.usedItem.description}: -${p.usedItem.value}` : '',
  }));
  const wsProducts = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Productos');

  // Payments sheet
  const paymentsData = ticket.payments.map(p => ({
    'Fecha': formatDate(p.date),
    'Detalle': p.detail,
    'Recibo': p.receiptNumber,
    'Vto. Cheque': p.checkDueDate ? formatDate(p.checkDueDate) : '',
    'Importe ARS': p.amountARS,
    'T.C.': p.exchangeRate,
    'Pago USD': p.amountUSD,
    'Saldo USD': p.runningBalance,
  }));
  const wsPayments = XLSX.utils.json_to_sheet(paymentsData);
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Pagos');

  XLSX.writeFile(wb, `boleto_${ticket.ticketNumber}_${getDateString()}.xlsx`);
}

// Export single ticket to PDF
export function exportTicketToPDF(ticket: Ticket) {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTOBUS S.A.', 14, 15);
  doc.setFontSize(12);
  doc.text(`FICHA DE OPERACIÓN — BOLETO N° ${ticket.ticketNumber}`, 14, 23);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${ticket.clientName}`, 14, 33);
  doc.text(`Código: ${ticket.clientCode}`, 14, 39);
  doc.text(`Fecha: ${formatDate(ticket.operationDate)}`, 14, 45);
  doc.text(`Forma de Pago: ${ticket.paymentMethod}`, 14, 51);

  // Products table
  const productsData = ticket.products.map(p => [
    p.description,
    p.quantity.toString(),
    formatCurrency(p.unitPrice),
    formatCurrency(p.totalPrice),
  ]);

  autoTable(doc, {
    head: [['Descripción', 'Cant.', 'P. Unit.', 'Total USD']],
    body: productsData,
    startY: 58,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [51, 51, 51] },
  });

  const afterProducts = (doc as any).lastAutoTable.finalY + 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Saldo Inicial: ${formatCurrency(ticket.initialBalance)}`, 140, afterProducts);

  // Payments table
  const paymentsData = ticket.payments.map(p => [
    formatDate(p.date),
    p.detail,
    p.receiptNumber,
    formatCurrency(p.amountARS, 'ARS'),
    p.exchangeRate.toString(),
    formatCurrency(p.amountUSD),
    formatCurrency(p.runningBalance),
  ]);

  autoTable(doc, {
    head: [['Fecha', 'Detalle', 'Recibo', 'ARS', 'T.C.', 'Pago USD', 'Saldo']],
    body: paymentsData,
    startY: afterProducts + 10,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [100, 100, 100] },
  });

  const afterPayments = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`SALDO FINAL: ${formatCurrency(ticket.finalBalance)}`, 140, afterPayments);

  doc.save(`boleto_${ticket.ticketNumber}_${getDateString()}.pdf`);
}

// Export client summary to Excel
export function exportClientSummaryToExcel(summary: ClientSummary) {
  const excelData = summary.tickets.map(t => ({
    'Boleto': t.ticketNumber,
    'Venta USD': t.saleUSD,
    'Usados USD': t.usedUSD,
    'Saldo Inicial': t.initialBalance,
    'Pagos USD': t.paymentsUSD,
    'Saldo Final': t.finalBalance,
    'Estado': t.status.toUpperCase(),
  }));

  excelData.push({
    'Boleto': 'TOTALES',
    'Venta USD': summary.totalSale,
    'Usados USD': summary.totalUsed,
    'Saldo Inicial': summary.totalSale - summary.totalUsed,
    'Pagos USD': summary.totalPayments,
    'Saldo Final': summary.totalBalance,
    'Estado': '',
  });

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen Cliente');

  XLSX.writeFile(wb, `cliente_${summary.clientCode}_${getDateString()}.xlsx`);
}

// Export client summary to PDF
export function exportClientSummaryToPDF(summary: ClientSummary) {
  const doc = new jsPDF('l', 'mm', 'a4');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTOBUS S.A. - RESUMEN DE CUENTA', 14, 15);

  doc.setFontSize(11);
  doc.text(`Cliente: ${summary.clientName}`, 14, 25);
  doc.text(`Código: ${summary.clientCode}`, 14, 31);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 37);

  const tableData = summary.tickets.map(t => [
    t.ticketNumber,
    formatCurrency(t.saleUSD),
    formatCurrency(t.usedUSD),
    formatCurrency(t.initialBalance),
    formatCurrency(t.paymentsUSD),
    formatCurrency(t.finalBalance),
    t.status.toUpperCase(),
  ]);

  const totalsRow = [
    'TOTALES',
    formatCurrency(summary.totalSale),
    formatCurrency(summary.totalUsed),
    formatCurrency(summary.totalSale - summary.totalUsed),
    formatCurrency(summary.totalPayments),
    formatCurrency(summary.totalBalance),
    '',
  ];

  autoTable(doc, {
    head: [['Boleto', 'Venta USD', 'Usados USD', 'Saldo Inicial', 'Pagos USD', 'Saldo Final', 'Estado']],
    body: [...tableData, totalsRow],
    startY: 44,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [51, 51, 51] },
    didParseCell: (data) => {
      if (data.row.index === tableData.length) {
        data.cell.styles.fillColor = [51, 51, 51];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.save(`cliente_${summary.clientCode}_${getDateString()}.pdf`);
}

function getStatus(saldo: number): string {
  if (Math.abs(saldo) < 100) return 'SALDADO';
  if (saldo > 1000) return 'PENDIENTE';
  return 'EN PROCESO';
}

function getDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

// Export Debt Aging to Excel
export function exportDebtAgingToExcel(data: { ticketNumber: string; clientName: string; clientCode: string; operationDate: Date; totalSale: number; totalUsed: number; totalPayments: number; balance: number; daysOverdue: number; agingBucket: string }[], filename: string = 'aging_deuda') {
  const excelData = data.map(row => ({
    'Cliente': row.clientName,
    'Código': row.clientCode,
    'Boleto': row.ticketNumber,
    'Fecha Op.': formatDate(row.operationDate),
    'Venta USD': row.totalSale,
    'Usados USD': row.totalUsed,
    'Pagos USD': row.totalPayments,
    'Saldo USD': row.balance,
    'Días': row.daysOverdue,
    'Aging': row.agingBucket === '90+' ? '+90 días' : `${row.agingBucket} días`,
  }));

  // Add totals row
  const totals = {
    'Cliente': 'TOTALES',
    'Código': '',
    'Boleto': `${data.length} boletos`,
    'Fecha Op.': '',
    'Venta USD': data.reduce((sum, r) => sum + r.totalSale, 0),
    'Usados USD': data.reduce((sum, r) => sum + r.totalUsed, 0),
    'Pagos USD': data.reduce((sum, r) => sum + r.totalPayments, 0),
    'Saldo USD': data.reduce((sum, r) => sum + r.balance, 0),
    'Días': '',
    'Aging': '',
  };
  excelData.push(totals as any);

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Aging de Deuda');

  ws['!cols'] = [
    { wch: 35 }, // Cliente
    { wch: 12 }, // Código
    { wch: 10 }, // Boleto
    { wch: 12 }, // Fecha
    { wch: 15 }, // Venta
    { wch: 15 }, // Usados
    { wch: 15 }, // Pagos
    { wch: 15 }, // Saldo
    { wch: 8 },  // Días
    { wch: 12 }, // Aging
  ];

  XLSX.writeFile(wb, `${filename}_${getDateString()}.xlsx`);
}

// Export Debt Aging to PDF
export function exportDebtAgingToPDF(data: { ticketNumber: string; clientName: string; clientCode: string; operationDate: Date; totalSale: number; totalUsed: number; totalPayments: number; balance: number; daysOverdue: number; agingBucket: string }[], filename: string = 'aging_deuda') {
  const doc = new jsPDF('l', 'mm', 'a4');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTOBUS S.A. - Aging de Deuda', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 22);
  doc.text(`Total registros: ${data.length}`, 14, 28);

  const tableData = data.map(row => [
    row.clientName.substring(0, 30),
    row.ticketNumber,
    formatDate(row.operationDate),
    formatCurrency(row.totalSale),
    formatCurrency(row.totalUsed),
    formatCurrency(row.totalPayments),
    formatCurrency(row.balance),
    row.daysOverdue.toString(),
    row.agingBucket === '90+' ? '+90 días' : `${row.agingBucket} días`,
  ]);

  const totalsRow = [
    'TOTALES',
    `${data.length}`,
    '',
    formatCurrency(data.reduce((sum, r) => sum + r.totalSale, 0)),
    formatCurrency(data.reduce((sum, r) => sum + r.totalUsed, 0)),
    formatCurrency(data.reduce((sum, r) => sum + r.totalPayments, 0)),
    formatCurrency(data.reduce((sum, r) => sum + r.balance, 0)),
    '',
    '',
  ];

  autoTable(doc, {
    head: [['Cliente', 'Boleto', 'Fecha', 'Venta USD', 'Usados', 'Pagos', 'Saldo', 'Días', 'Aging']],
    body: [...tableData, totalsRow],
    startY: 34,
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 22 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
      7: { cellWidth: 15, halign: 'center' },
      8: { cellWidth: 25, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.row.index === tableData.length) {
        data.cell.styles.fillColor = [51, 51, 51];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.save(`${filename}_${getDateString()}.pdf`);
}

// Interface for future payment export
interface FuturePaymentExport {
  dueDate: Date;
  clientName: string;
  clientCode: string;
  ticketNumber: string;
  detail: string;
  amountUSD: number;
}

// Export Future Payments to PDF (portrait)
export function exportFuturePaymentsToPDF(
  data: FuturePaymentExport[],
  totalUSD: number,
  filename: string = 'pagos_futuros'
) {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTOBUS S.A. - Cheques por Vencimiento', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 22);
  doc.text(`Total cheques: ${data.length}`, 14, 28);

  const tableData = data.map(row => [
    formatDate(row.dueDate),
    row.clientName.substring(0, 30),
    row.ticketNumber,
    row.detail.substring(0, 20),
    formatCurrency(row.amountUSD),
  ]);

  const totalsRow = [
    'TOTAL',
    `${data.length} cheques`,
    '',
    '',
    formatCurrency(totalUSD),
  ];

  autoTable(doc, {
    head: [['Vencimiento', 'Cliente', 'Boleto', 'Detalle', 'Importe USD']],
    body: [...tableData, totalsRow],
    startY: 34,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 60 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 40 },
      4: { cellWidth: 30, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.row.index === tableData.length) {
        data.cell.styles.fillColor = [51, 51, 51];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.save(`${filename}_${getDateString()}.pdf`);
}

// Interface for monthly payment export
interface MonthlyPaymentExport {
  clientCode: string;
  clientName: string;
  monthlyAmounts: { month: string; amount: number }[];
  total: number;
}

// Export Monthly Payments to PDF (landscape)
export function exportMonthlyPaymentsToPDF(
  data: MonthlyPaymentExport[],
  months: string[],
  grandTotal: number,
  columnTotals: number[],
  exchangeRate: number,
  filename: string = 'cobros_por_mes'
) {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTOBUS S.A. - Cobros por Cliente y Mes', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 22);
  doc.text(`TC BNA Vendedor: $${exchangeRate.toLocaleString('es-AR')}`, 14, 28);
  doc.text(`Clientes: ${data.length}`, 100, 28);

  const headers = ['Cliente', ...months, 'Total'];
  
  const tableData = data.map(row => {
    const monthValues = months.map(month => {
      const found = row.monthlyAmounts.find(m => m.month === month);
      return found && found.amount > 0 ? formatCurrency(found.amount) : '—';
    });
    return [row.clientName.substring(0, 25), ...monthValues, formatCurrency(row.total)];
  });

  const totalsRow = [
    'TOTALES',
    ...columnTotals.map(t => formatCurrency(t)),
    formatCurrency(grandTotal),
  ];

  // Calculate column widths dynamically
  const clientColWidth = 50;
  const totalColWidth = 28;
  const availableWidth = 297 - 28 - clientColWidth - totalColWidth; // A4 landscape width minus margins
  const monthColWidth = Math.min(25, availableWidth / months.length);

  const columnStyles: any = {
    0: { cellWidth: clientColWidth },
  };
  months.forEach((_, idx) => {
    columnStyles[idx + 1] = { cellWidth: monthColWidth, halign: 'right' };
  });
  columnStyles[months.length + 1] = { cellWidth: totalColWidth, halign: 'right' };

  autoTable(doc, {
    head: [headers],
    body: [...tableData, totalsRow],
    startY: 34,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
    },
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    columnStyles,
    didParseCell: (data) => {
      if (data.row.index === tableData.length) {
        data.cell.styles.fillColor = [51, 51, 51];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.save(`${filename}_${getDateString()}.pdf`);
}

// Interface for pending balances export
interface PendingBalanceExport {
  clientCode: string;
  clientName: string;
  totalPending: number;
  tickets: string[];
}

// Export Pending Balances to PDF (portrait)
export function exportPendingBalancesToPDF(
  data: PendingBalanceExport[],
  totalUSD: number,
  filename: string = 'saldos_pendientes'
) {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTOBUS S.A. - Saldos Pendientes por Cliente', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 22);
  doc.text(`Total clientes: ${data.length}`, 14, 28);

  const tableData = data.map(row => [
    row.clientName.substring(0, 35),
    row.clientCode,
    row.tickets.length.toString(),
    row.tickets.slice(0, 3).join(', ') + (row.tickets.length > 3 ? '...' : ''),
    formatCurrency(row.totalPending),
  ]);

  const totalsRow = [
    'TOTAL',
    `${data.length} clientes`,
    data.reduce((sum, r) => sum + r.tickets.length, 0).toString(),
    '',
    formatCurrency(totalUSD),
  ];

  autoTable(doc, {
    head: [['Cliente', 'Código', 'Boletos', 'Números', 'Saldo USD']],
    body: [...tableData, totalsRow],
    startY: 34,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 45 },
      4: { cellWidth: 30, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.row.index === tableData.length) {
        data.cell.styles.fillColor = [51, 51, 51];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.save(`${filename}_${getDateString()}.pdf`);
}
