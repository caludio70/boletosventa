import { ClientSummary } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { exportClientSummaryToExcel, exportClientSummaryToPDF } from '@/lib/exportUtils';
import { User, FileText, CheckCircle2, AlertCircle, Clock, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientSummaryCardProps {
  summary: ClientSummary;
}

export function ClientSummaryCard({ summary }: ClientSummaryCardProps) {
  const getStatusBadge = (status: 'saldado' | 'pendiente' | 'proceso') => {
    switch (status) {
      case 'saldado':
        return (
          <span className="status-badge status-saldado">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            SALDADO
          </span>
        );
      case 'pendiente':
        return (
          <span className="status-badge status-pendiente">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            PENDIENTE
          </span>
        );
      case 'proceso':
        return (
          <span className="status-badge status-proceso">
            <Clock className="w-3.5 h-3.5 mr-1" />
            EN PROCESO
          </span>
        );
    }
  };

  return (
    <div className="bg-card rounded-xl card-shadow-lg overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="header-gradient text-primary-foreground p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-wide">RESUMEN DE CUENTA</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => exportClientSummaryToExcel(summary)}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => exportClientSummaryToPDF(summary)}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <span className="text-sm opacity-80 ml-2">{formatDate(new Date())}</span>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="p-5 bg-muted/50 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl font-bold text-foreground">{summary.clientName}</h3>
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-sm font-medium rounded">
                {summary.clientCode}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{summary.tickets.length} boleto{summary.tickets.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-table-header text-primary-foreground">
                <th className="px-4 py-3 text-center font-medium">Boleto</th>
                <th className="px-4 py-3 text-right font-medium">Venta USD</th>
                <th className="px-4 py-3 text-right font-medium">Usados USD</th>
                <th className="px-4 py-3 text-right font-medium">Saldo Inicial</th>
                <th className="px-4 py-3 text-right font-medium">Pagos USD</th>
                <th className="px-4 py-3 text-right font-medium">Saldo Final</th>
                <th className="px-4 py-3 text-center font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {summary.tickets.map((ticket, idx) => (
                <tr key={ticket.ticketNumber} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                  <td className="px-4 py-3 text-center font-medium text-primary">{ticket.ticketNumber}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(ticket.saleUSD)}</td>
                  <td className="px-4 py-3 text-right text-destructive">
                    {ticket.usedUSD > 0 ? formatCurrency(ticket.usedUSD) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(ticket.initialBalance)}</td>
                  <td className="px-4 py-3 text-right text-success">{formatCurrency(ticket.paymentsUSD)}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    <span className={
                      ticket.finalBalance < 10 ? 'text-success' : 
                      ticket.finalBalance > 1000 ? 'text-destructive' : 'text-warning'
                    }>
                      {formatCurrency(ticket.finalBalance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(ticket.status)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary text-primary-foreground font-semibold">
                <td className="px-4 py-3 text-center">TOTALES</td>
                <td className="px-4 py-3 text-right">{formatCurrency(summary.totalSale)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(summary.totalUsed)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(summary.totalSale - summary.totalUsed)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(summary.totalPayments)}</td>
                <td className="px-4 py-3 text-right text-lg">{formatCurrency(summary.totalBalance)}</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Total Balance Highlight */}
        <div className="mt-6 flex justify-center">
          <div className={`rounded-xl px-10 py-5 text-center ${
            summary.totalBalance < 10 
              ? 'bg-success text-success-foreground' 
              : 'bg-destructive text-destructive-foreground'
          }`}>
            <span className="block text-sm font-medium opacity-90 mb-1">SALDO TOTAL</span>
            <span className="text-3xl font-bold">{formatCurrency(summary.totalBalance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
