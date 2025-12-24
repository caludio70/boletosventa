import { TotalByTicket } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { Table, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface TotalsByTicketTableProps {
  totals: TotalByTicket[];
}

export function TotalsByTicketTable({ totals }: TotalsByTicketTableProps) {
  const grandTotal = {
    ventaUSD: totals.reduce((sum, t) => sum + t.ventaUSD, 0),
    usadosUSD: totals.reduce((sum, t) => sum + t.usadosUSD, 0),
    pagosUSD: totals.reduce((sum, t) => sum + t.pagosUSD, 0),
    saldoFinal: totals.reduce((sum, t) => sum + t.saldoFinal, 0),
  };

  const getStatusIcon = (saldo: number) => {
    if (Math.abs(saldo) < 100) {
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    } else if (saldo > 1000) {
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
    return <Clock className="w-4 h-4 text-warning" />;
  };

  return (
    <div className="bg-card rounded-xl card-shadow-lg overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="header-gradient text-primary-foreground p-5">
        <div className="flex items-center gap-3">
          <Table className="w-5 h-5" />
          <h2 className="text-lg font-semibold tracking-wide">TOTAL POR BOLETO</h2>
        </div>
      </div>

      {/* Table */}
      <div className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-destructive/80 text-destructive-foreground">
                <th className="px-4 py-3 text-left font-medium">cliente</th>
                <th className="px-4 py-3 text-center font-medium">boleto</th>
                <th className="px-4 py-3 text-right font-medium">venta usd</th>
                <th className="px-4 py-3 text-right font-medium">usados usd</th>
                <th className="px-4 py-3 text-right font-medium">pagos usd</th>
                <th className="px-4 py-3 text-right font-medium">saldo final</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((row, idx) => (
                <tr 
                  key={row.ticketNumber} 
                  className={`${idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-accent/50 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    <span className="line-clamp-1" title={row.clientName}>
                      {row.clientName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-primary font-semibold">
                    {row.ticketNumber}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(row.ventaUSD)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive">
                    {row.usadosUSD > 0 ? formatCurrency(row.usadosUSD) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-success">
                    {formatCurrency(row.pagosUSD)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                      {getStatusIcon(row.saldoFinal)}
                      <span className={
                        Math.abs(row.saldoFinal) < 100 ? 'text-success' : 
                        row.saldoFinal > 1000 ? 'text-destructive' : 'text-warning'
                      }>
                        {formatCurrency(row.saldoFinal)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary text-primary-foreground font-semibold">
                <td className="px-4 py-4" colSpan={2}>
                  <span className="text-base">TOTALES ({totals.length} boletos)</span>
                </td>
                <td className="px-4 py-4 text-right tabular-nums text-base">
                  {formatCurrency(grandTotal.ventaUSD)}
                </td>
                <td className="px-4 py-4 text-right tabular-nums text-base">
                  {formatCurrency(grandTotal.usadosUSD)}
                </td>
                <td className="px-4 py-4 text-right tabular-nums text-base">
                  {formatCurrency(grandTotal.pagosUSD)}
                </td>
                <td className="px-4 py-4 text-right tabular-nums text-lg">
                  {formatCurrency(grandTotal.saldoFinal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Summary Cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saldados</span>
            <p className="text-2xl font-bold text-success mt-1">
              {totals.filter(t => Math.abs(t.saldoFinal) < 100).length}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pendientes</span>
            <p className="text-2xl font-bold text-destructive mt-1">
              {totals.filter(t => t.saldoFinal > 1000).length}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">En Proceso</span>
            <p className="text-2xl font-bold text-warning mt-1">
              {totals.filter(t => t.saldoFinal >= 100 && t.saldoFinal <= 1000).length}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saldo Total</span>
            <p className={`text-xl font-bold mt-1 ${grandTotal.saldoFinal > 100 ? 'text-destructive' : 'text-success'}`}>
              {formatCurrency(grandTotal.saldoFinal)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
