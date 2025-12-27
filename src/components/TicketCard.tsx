import { Ticket } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { exportTicketToExcel, exportTicketToPDF } from '@/lib/exportUtils';
import { Calendar, CreditCard, MessageSquare, Package, Receipt, TrendingDown, FileSpreadsheet, FileText as FileTextIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFViewer } from '@/components/PDFViewer';
interface TicketCardProps {
  ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  return (
    <div className="bg-card rounded-xl card-shadow-lg overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="header-gradient p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm sm:text-lg font-semibold tracking-wide break-words text-white">
            <span className="block sm:inline">FICHA DE OPERACIÓN</span>
            <span className="hidden sm:inline"> — </span>
            <span className="block sm:inline">BOLETO N° {ticket.ticketNumber}</span>
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PDFViewer ticketNumber={ticket.ticketNumber} />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => exportTicketToExcel(ticket)}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => exportTicketToPDF(ticket)}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1.5"
            >
              <FileTextIcon className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="p-5 bg-muted/50 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cliente</span>
            <p className="text-lg font-semibold text-foreground mt-0.5">{ticket.clientName}</p>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Fecha Op.
              </span>
              <p className="font-medium mt-0.5">{formatDate(ticket.operationDate)}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Código</span>
              <p className="font-medium mt-0.5">{ticket.clientCode}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              Forma de Pago
            </span>
            <p className="text-sm mt-0.5">{ticket.paymentMethod}</p>
          </div>
          {ticket.observations && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Observaciones
              </span>
              <p className="text-sm text-muted-foreground mt-0.5">{ticket.observations}</p>
            </div>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Productos</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-4 py-3 text-left font-medium">Descripción</th>
                <th className="px-4 py-3 text-center font-medium">Cant.</th>
                <th className="px-4 py-3 text-right font-medium">P. Unit.</th>
                <th className="px-4 py-3 text-right font-medium">Total USD</th>
              </tr>
            </thead>
            <tbody>
              {ticket.products.map((product, idx) => (
                <>
                  <tr key={product.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                    <td className="px-4 py-3 font-medium">{product.description}</td>
                    <td className="px-4 py-3 text-center">{product.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(product.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(product.totalPrice)}</td>
                  </tr>
                  {product.usedItem && (
                    <tr key={`${product.id}-used`} className="bg-destructive/5">
                      <td className="px-4 py-2 text-sm flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-destructive" />
                        <span className="text-destructive">+- Toma usado: {product.usedItem.description}</span>
                      </td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2 text-right text-destructive font-medium">
                        {formatCurrency(-product.usedItem.value)}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Initial Balance */}
        <div className="mt-4 flex justify-end">
          <div className="bg-accent/50 border-2 border-primary/20 rounded-lg px-6 py-3 text-right">
            <span className="text-sm font-medium text-primary">SALDO INICIAL:</span>
            <span className="ml-3 text-xl font-bold text-primary">{formatCurrency(ticket.initialBalance)}</span>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="p-5 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-secondary" />
          <h3 className="font-semibold text-foreground">Detalle de Pagos</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-secondary-foreground">
                <th className="px-3 py-3 text-center font-medium">Fecha</th>
                <th className="px-3 py-3 text-left font-medium">Detalle / Recibo</th>
                <th className="px-3 py-3 text-center font-medium">Vto. Cheque</th>
                <th className="px-3 py-3 text-right font-medium">Importe ARS</th>
                <th className="px-3 py-3 text-center font-medium">T.C.</th>
                <th className="px-3 py-3 text-right font-medium">Pago USD</th>
                <th className="px-3 py-3 text-right font-medium">Saldo USD</th>
              </tr>
            </thead>
            <tbody>
              {ticket.payments.map((payment, idx) => (
                <tr key={payment.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                  <td className="px-3 py-3 text-center">{formatDate(payment.date)}</td>
                  <td className="px-3 py-3">
                    <span className="font-medium">{payment.detail}</span>
                    <span className="text-muted-foreground ml-2">— {payment.receiptNumber}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {payment.checkDueDate ? (
                      formatDate(payment.checkDueDate)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">{formatCurrency(payment.amountARS, 'ARS')}</td>
                  <td className="px-3 py-3 text-center">{payment.exchangeRate.toLocaleString('es-AR')}</td>
                  <td className="px-3 py-3 text-right text-success font-medium">
                    {formatCurrency(payment.amountUSD)}
                  </td>
                  <td className="px-3 py-3 text-right font-bold">
                    <span className={payment.runningBalance < 10 ? 'text-success' : payment.runningBalance > 1000 ? 'text-destructive' : 'text-warning'}>
                      {formatCurrency(payment.runningBalance)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Final Balance */}
        <div className="mt-4 flex justify-end">
          <div className={`rounded-lg px-6 py-4 text-right ${
            ticket.finalBalance < 10 
              ? 'bg-success/10 border-2 border-success' 
              : ticket.finalBalance > 1000 
                ? 'bg-destructive/10 border-2 border-destructive' 
                : 'bg-warning/10 border-2 border-warning'
          }`}>
            <span className={`text-sm font-medium ${
              ticket.finalBalance < 10 ? 'text-success' : ticket.finalBalance > 1000 ? 'text-destructive' : 'text-warning'
            }`}>
              SALDO FINAL:
            </span>
            <span className={`ml-3 text-2xl font-bold ${
              ticket.finalBalance < 10 ? 'text-success' : ticket.finalBalance > 1000 ? 'text-destructive' : 'text-warning'
            }`}>
              {formatCurrency(ticket.finalBalance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
