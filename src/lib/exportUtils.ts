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
