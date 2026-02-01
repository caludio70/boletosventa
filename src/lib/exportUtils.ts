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

// ================================
// Purchase Request PDF Export
// ================================

export interface PurchaseRequestPDFData {
  requestNumber: string;
  buyer: {
    name: string;
    address: string;
    locality: string;
    postalCode: string;
    email: string;
    phone: string;
    idType: string;
    idNumber: string;
    ivaCondition: string;
  };
  unit: {
    quantity: number;
    brand: string;
    model: string;
    bodywork: string;
    type: string;
    year: string;
    condition: '0km' | 'usado';
  };
  price: {
    priceUSD: number;
    dollarReference: number;
    priceARS: number;
  };
  additionals: { concept: string; amount: number }[];
  usedUnits: {
    brand: string;
    model: string;
    year: string;
    domain: string;
    internalNumber: string;
    bodywork: string;
    value: number;
  }[];
  paymentMethod: string;
  estimatedDelivery: string;
  observations: string;
  totalAdditionals: number;
  totalUsed: number;
  finalBalance: number;
}

export async function exportPurchaseRequestToPDF(data: PurchaseRequestPDFData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  
  // Helper to load images
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Helper to draw dotted line
  const drawDottedLine = (x1: number, y: number, x2: number) => {
    doc.setDrawColor(100, 100, 100);
    doc.setLineDashPattern([0.5, 1], 0);
    doc.line(x1, y, x2, y);
    doc.setLineDashPattern([], 0);
  };

  // Helper to draw checkbox
  const drawCheckbox = (x: number, y: number, checked: boolean = false) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(x, y - 3, 4, 4);
    if (checked) {
      doc.setFont('helvetica', 'bold');
      doc.text('X', x + 0.8, y);
    }
  };

  // Helper to draw section title
  const drawSectionTitle = (title: string, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const titleWidth = doc.getTextWidth(title);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(title, titleX, y);
    doc.setLineWidth(0.3);
    doc.line(titleX, y + 1, titleX + titleWidth, y + 1);
    return y + 6;
  };

  try {
    // Load Mercedes-Benz logo
    const mercedesImg = await loadImage('/logos/mercedes-benz-star.png');
    
    // ========== HEADER ==========
    let y = 12;
    
    // Mercedes-Benz star logo (left)
    doc.addImage(mercedesImg, 'PNG', margin, y - 2, 12, 12);
    
    // Mercedes-Benz text and company info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('Mercedes-Benz', margin + 14, y + 4);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Autobus S. A.', margin + 14, y + 9);
    doc.setFont('helvetica', 'normal');
    doc.text('Av. Juan B. Alberdi 7334', margin + 14, y + 13);
    doc.text('(C1440ABY) Ciudad Autónoma de Buenos Aires', margin + 14, y + 17);
    doc.text('Teléfono 4686-5000 (líneas rotativas)', margin + 14, y + 21);
    doc.text('E-mail: administracion@autobussa.com.ar', margin + 14, y + 25);
    
    // Title and number (right side)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('SOLICITUD DE COMPRA', pageWidth - margin - 55, y + 2);
    
    // Request number with box
    doc.setFontSize(10);
    doc.text('N°', pageWidth - margin - 35, y + 8);
    doc.setLineWidth(0.4);
    doc.rect(pageWidth - margin - 32, y + 4, 32, 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(data.requestNumber, pageWidth - margin - 30, y + 8);
    
    // Date boxes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('FECHA', pageWidth - margin - 55, y + 16);
    doc.setLineWidth(0.3);
    // Three date boxes
    const dateBoxY = y + 12;
    const dateBoxWidth = 10;
    for (let i = 0; i < 3; i++) {
      doc.rect(pageWidth - margin - 32 + (i * (dateBoxWidth + 1)), dateBoxY, dateBoxWidth, 6);
    }
    // Fill date
    const today = new Date();
    doc.setFont('helvetica', 'normal');
    doc.text(String(today.getDate()).padStart(2, '0'), pageWidth - margin - 30, y + 16);
    doc.text(String(today.getMonth() + 1).padStart(2, '0'), pageWidth - margin - 19, y + 16);
    doc.text(String(today.getFullYear()).slice(-2), pageWidth - margin - 8, y + 16);
    
    // CUIT and other info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('C.U.I.T.: 30-63148185-6', pageWidth - margin - 55, y + 22);
    doc.text('ING. BRUTOS: 9012073936', pageWidth - margin - 55, y + 26);
    doc.text('I.V.A. RESPONSABLE INSCRIPTO', pageWidth - margin - 55, y + 30);
    
    y += 36;
    
    // ========== DATOS DEL COMPRADOR ==========
    y = drawSectionTitle('DATOS DEL COMPRADOR', y);
    
    // Draw border box
    const buyerBoxHeight = 42;
    doc.setLineWidth(0.3);
    doc.rect(margin, y - 2, contentWidth, buyerBoxHeight);
    
    // Row 1: Señores
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Señores:', margin + 2, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(data.buyer.name || '', margin + 18, y + 4);
    drawDottedLine(margin + 18, y + 5, pageWidth - margin - 2);
    
    // Row 2: Domicilio + CP
    doc.setFont('helvetica', 'normal');
    doc.text('Domicilio:', margin + 2, y + 10);
    doc.text(data.buyer.address || '', margin + 20, y + 10);
    drawDottedLine(margin + 20, y + 11, pageWidth - margin - 45);
    doc.text('Código Postal:', pageWidth - margin - 43, y + 10);
    doc.text(data.buyer.postalCode || '', pageWidth - margin - 20, y + 10);
    drawDottedLine(pageWidth - margin - 20, y + 11, pageWidth - margin - 2);
    
    // Row 3: Localidad + Teléfono
    doc.text('Localidad', margin + 2, y + 16);
    doc.text(data.buyer.locality || '', margin + 18, y + 16);
    drawDottedLine(margin + 18, y + 17, pageWidth - margin - 45);
    doc.text('Teléfono:', pageWidth - margin - 43, y + 16);
    doc.text(data.buyer.phone || '', pageWidth - margin - 28, y + 16);
    drawDottedLine(pageWidth - margin - 28, y + 17, pageWidth - margin - 2);
    
    // Row 4: Email
    doc.text('E-mail:', margin + 2, y + 22);
    doc.text(data.buyer.email || '', margin + 15, y + 22);
    drawDottedLine(margin + 15, y + 23, pageWidth - margin - 2);
    
    // Row 5: DNI + IVA conditions
    doc.text('LE. LC. DNI. CI. N°:', margin + 2, y + 28);
    doc.text(data.buyer.idNumber || '', margin + 32, y + 28);
    drawDottedLine(margin + 32, y + 29, margin + 65);
    
    doc.text('I.V.A.:', margin + 68, y + 28);
    const isRI = data.buyer.ivaCondition === 'responsable_inscripto';
    const isCF = data.buyer.ivaCondition === 'consumidor_final';
    const isExento = data.buyer.ivaCondition === 'exento';
    
    doc.text('Resp. Inscripto', margin + 85, y + 28);
    drawCheckbox(margin + 82, y + 28, isRI);
    
    doc.text('C.U.I.T.:', margin + 115, y + 28);
    doc.text(isRI ? data.buyer.idNumber : '', margin + 130, y + 28);
    drawDottedLine(margin + 130, y + 29, pageWidth - margin - 2);
    
    // Row 6: Consumidor Final / Exento / Vendedor
    doc.text('Consumidor Final', margin + 85, y + 34);
    drawCheckbox(margin + 82, y + 34, isCF);
    
    doc.text('Exento', margin + 115, y + 34);
    drawCheckbox(margin + 112, y + 34, isExento);
    
    doc.text('Vendedor:', margin + 2, y + 34);
    drawDottedLine(margin + 20, y + 35, margin + 75);
    
    y += buyerBoxHeight + 4;
    
    // ========== UNIDAD A ADQUIRIR ==========
    y = drawSectionTitle('UNIDAD A ADQUIRIR', y);
    
    const unitBoxHeight = 28;
    doc.rect(margin, y - 2, contentWidth, unitBoxHeight);
    
    // Row 1: Cantidad + Marca + Carrocería
    const col1 = margin + 2;
    const col2 = margin + 60;
    const col3 = margin + 120;
    
    doc.text('Cantidad:', col1, y + 4);
    doc.text(data.unit.quantity.toString(), col1 + 18, y + 4);
    drawDottedLine(col1 + 18, y + 5, col2 - 5);
    
    doc.text('Marca:', col2, y + 4);
    doc.text(data.unit.brand || '', col2 + 12, y + 4);
    drawDottedLine(col2 + 12, y + 5, col3 - 5);
    
    doc.text('Carrocería:', col3, y + 4);
    doc.text(data.unit.bodywork || '', col3 + 20, y + 4);
    drawDottedLine(col3 + 20, y + 5, pageWidth - margin - 2);
    
    // Row 2: 0km/Usado checkboxes + Modelo + Tipo
    doc.text('0km', col1, y + 10);
    drawCheckbox(col1 + 8, y + 10, data.unit.condition === '0km');
    
    doc.text('Usado', col1, y + 16);
    drawCheckbox(col1 + 12, y + 16, data.unit.condition === 'usado');
    
    doc.text('Modelo:', col2, y + 10);
    doc.text(data.unit.model || '', col2 + 14, y + 10);
    drawDottedLine(col2 + 14, y + 11, col3 - 5);
    
    doc.text('Tipo:', col3, y + 10);
    doc.text(data.unit.type || '', col3 + 10, y + 10);
    drawDottedLine(col3 + 10, y + 11, pageWidth - margin - 2);
    
    // Row 3: Año + Dominio + Config
    doc.text('Año:', col2, y + 16);
    doc.text(data.unit.year || '', col2 + 10, y + 16);
    drawDottedLine(col2 + 10, y + 17, col3 - 5);
    
    doc.text('Dominio:', col2, y + 22);
    drawDottedLine(col2 + 15, y + 23, col3 - 5);
    
    doc.setFontSize(7);
    doc.text('CONFIGURACIÓN DE CARROCERÍA SEGÚN', col3, y + 16);
    doc.text('PLANILLA ADJUNTA.', col3, y + 20);
    doc.setFontSize(8);
    
    y += unitBoxHeight + 4;
    
    // ========== PRECIO DE LA UNIDAD ==========
    y = drawSectionTitle('PRECIO DE LA UNIDAD', y);
    
    const priceBoxHeight = 16;
    doc.rect(margin, y - 2, contentWidth, priceBoxHeight);
    
    // P.U. en U$S (IVA Incluido)
    doc.text('P. U. en U$S', col1, y + 4);
    doc.setFontSize(6);
    doc.text('(IVA Incluido)', col1, y + 7);
    doc.setFontSize(8);
    doc.text(formatCurrency(data.price.priceUSD), col1 + 25, y + 5);
    drawDottedLine(col1 + 25, y + 6, col2 - 5);
    
    doc.text('Dólar de Referencia MBA', col2, y + 5);
    doc.text(`$ ${data.price.dollarReference.toLocaleString('es-AR')}`, col2 + 42, y + 5);
    drawDottedLine(col2 + 42, y + 6, col3 - 5);
    
    doc.text('P. U. en $', col3, y + 5);
    doc.text(`$ ${data.price.priceARS.toLocaleString('es-AR')}`, col3 + 18, y + 5);
    drawDottedLine(col3 + 18, y + 6, pageWidth - margin - 2);
    
    // P.T. row
    const totalUSD = data.price.priceUSD * data.unit.quantity;
    const totalARS = data.price.priceARS * data.unit.quantity;
    
    doc.text('P. T. en U$S', col1, y + 11);
    doc.setFontSize(6);
    doc.text('(IVA Incluido)', col1, y + 14);
    doc.setFontSize(8);
    doc.text(formatCurrency(totalUSD), col1 + 25, y + 12);
    drawDottedLine(col1 + 25, y + 13, col2 - 5);
    
    doc.text('Dólar de Referencia MBA', col2, y + 12);
    doc.text(`$ ${data.price.dollarReference.toLocaleString('es-AR')}`, col2 + 42, y + 12);
    drawDottedLine(col2 + 42, y + 13, col3 - 5);
    
    doc.text('P. T. en $', col3, y + 12);
    doc.text(`$ ${totalARS.toLocaleString('es-AR')}`, col3 + 18, y + 12);
    drawDottedLine(col3 + 18, y + 13, pageWidth - margin - 2);
    
    y += priceBoxHeight + 4;
    
    // ========== FORMA DE PAGO ==========
    y = drawSectionTitle('FORMA DE PAGO', y);
    
    const paymentBoxHeight = 32;
    doc.rect(margin, y - 2, contentWidth, paymentBoxHeight);
    
    // Forma de pago propuesta
    doc.text('Forma de pago propuesta:', col1, y + 4);
    doc.text(data.paymentMethod || '', col1 + 40, y + 4);
    drawDottedLine(col1 + 40, y + 5, pageWidth - margin - 2);
    
    // Additional payment lines
    drawDottedLine(col1, y + 11, pageWidth - margin - 2);
    drawDottedLine(col1, y + 17, pageWidth - margin - 2);
    
    // Checkboxes: Cheque, Pagaré, Prenda
    const isCheque = data.paymentMethod === 'cheque';
    const isPagare = data.paymentMethod === 'pagare';
    const isPrenda = data.paymentMethod === 'prenda';
    
    doc.text('Cheque', margin + 50, y + 23);
    drawCheckbox(margin + 47, y + 23, isCheque);
    
    doc.text('Pagaré', margin + 75, y + 23);
    drawCheckbox(margin + 72, y + 23, isPagare);
    
    doc.text('Prenda', margin + 100, y + 23);
    drawCheckbox(margin + 97, y + 23, isPrenda);
    
    // Fecha de entrega estimada
    doc.text('Fecha de entrega estimada::', col1, y + 29);
    const deliveryDate = data.estimatedDelivery ? formatDate(new Date(data.estimatedDelivery)) : '';
    doc.text(deliveryDate, col1 + 45, y + 29);
    drawDottedLine(col1 + 45, y + 30, margin + 95);
    
    y += paymentBoxHeight + 2;
    
    // ========== ENTREGA DE UNIDADES USADAS ==========
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Entrega de Unidades Usadas:', margin + 2, y);
    y += 4;
    
    const usedBoxHeight = data.usedUnits.length > 0 ? 22 : 18;
    doc.rect(margin, y - 2, contentWidth, usedBoxHeight);
    
    // Headers
    doc.setFont('helvetica', 'normal');
    doc.text('Marca', col1, y + 3);
    doc.text('Modelo', col1 + 35, y + 3);
    doc.text('Año', col3, y + 3);
    doc.text('Cantidad', col3 + 25, y + 3);
    
    // Used unit data (first unit only for simplicity)
    if (data.usedUnits.length > 0) {
      const u = data.usedUnits[0];
      doc.text(u.brand || '', col1 + 12, y + 3);
      doc.text(u.model || '', col1 + 55, y + 3);
      doc.text(u.year || '', col3 + 8, y + 3);
      doc.text('1', col3 + 40, y + 3);
      
      // Row 2: Dominio, Nro interno, Carrocería
      doc.text('Dominio Nro.:', col1, y + 9);
      doc.text(u.domain || '', col1 + 23, y + 9);
      drawDottedLine(col1 + 23, y + 10, col1 + 45);
      
      doc.text('Nro. interno:', col1 + 50, y + 9);
      doc.text(u.internalNumber || '', col1 + 70, y + 9);
      drawDottedLine(col1 + 70, y + 10, col3 - 5);
      
      doc.text('Carrocería:', col3, y + 9);
      doc.text(u.bodywork || '', col3 + 20, y + 9);
      drawDottedLine(col3 + 20, y + 10, pageWidth - margin - 2);
      
      // Row 3: Valores
      doc.text('Valor Unitario', col1, y + 15);
      doc.text(formatCurrency(u.value), col1 + 25, y + 15);
      drawDottedLine(col1 + 25, y + 16, col2 - 5);
      
      doc.text('Valor Total:', col2, y + 15);
      doc.text(formatCurrency(data.totalUsed), col2 + 22, y + 15);
      drawDottedLine(col2 + 22, y + 16, col3 - 5);
    } else {
      drawDottedLine(col1 + 12, y + 4, col1 + 35);
      drawDottedLine(col1 + 55, y + 4, col3 - 5);
      drawDottedLine(col3 + 8, y + 4, col3 + 20);
      drawDottedLine(col3 + 40, y + 4, pageWidth - margin - 2);
      
      doc.text('Dominio Nro.:', col1, y + 9);
      drawDottedLine(col1 + 23, y + 10, col1 + 45);
      doc.text('Nro. interno:', col1 + 50, y + 9);
      drawDottedLine(col1 + 70, y + 10, col3 - 5);
      doc.text('Carrocería:', col3, y + 9);
      drawDottedLine(col3 + 20, y + 10, pageWidth - margin - 2);
      
      doc.text('Valor Unitario', col1, y + 15);
      drawDottedLine(col1 + 25, y + 16, col2 - 5);
      doc.text('Valor Total:', col2, y + 15);
      drawDottedLine(col2 + 22, y + 16, col3 - 5);
    }
    
    y += usedBoxHeight + 2;
    
    // ========== GASTOS ==========
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('GASTOS DE PATENTAMIENTO-TRANSFERENCIA-SELLADOS-INSCRIPCION DE PRENDA-FLETES-GESTORIA-ETC', margin, y + 2);
    y += 4;
    
    const gastosBoxHeight = 10;
    doc.rect(margin, y - 2, contentWidth, gastosBoxHeight);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('A cargo del cliente', col1, y + 3);
    drawCheckbox(col1 + 28, y + 3, true);
    
    doc.text('Otros', col1 + 38, y + 3);
    drawCheckbox(col1 + 48, y + 3, false);
    
    doc.text('VALOR ESTIMADO:', col2, y + 3);
    drawDottedLine(col2 + 32, y + 4, pageWidth - margin - 2);
    
    y += gastosBoxHeight + 2;
    
    // ========== DISCLAIMER ==========
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('PRECIO SUJETO A VARIACIÓN LISTA DE PRECIOS Y/O CONDICIONES COMERCIALES Y/O VALOR DÓLAR MERCEDES BENZ ARGENTINA S.A.', margin, y + 2);
    doc.text('Y/O ARANCELES DE REGISTROS AUTOMOTORES. ENTREGA DE LA UNIDAD SUJETA A DISPONIBILIDAD MERCEDES BENZ ARGENTINA S.A.', margin, y + 5);
    doc.text('LA PRESENTE NO TIENE VALOR COMO RECIBO.', margin, y + 8);
    
    y += 12;
    
    // ========== OBSERVACIONES ==========
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('OBSERVACIONES:', margin, y);
    y += 2;
    
    const obsBoxHeight = 25;
    doc.rect(margin, y, contentWidth, obsBoxHeight);
    
    if (data.observations) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const splitObs = doc.splitTextToSize(data.observations, contentWidth - 4);
      doc.text(splitObs, margin + 2, y + 4);
    }
    
    // Save PDF
    doc.save(`solicitud_compra_${data.requestNumber}_${getDateString()}.pdf`);
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
}

// ================================
// Debt Aging Exports
// ================================

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

// ================================
// Payment Projections Exports
// ================================

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
