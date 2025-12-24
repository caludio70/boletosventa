import { useState, useMemo } from 'react';
import { TotalByTicket } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Download, 
  FileSpreadsheet, 
  FileText,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface TotalsByTicketTableProps {
  totals: TotalByTicket[];
}

type SortField = 'clientName' | 'ticketNumber' | 'ventaUSD' | 'saldoFinal';
type SortOrder = 'asc' | 'desc';

export function TotalsByTicketTable({ totals }: TotalsByTicketTableProps) {
  const [ticketFilter, setTicketFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('ticketNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = totals.filter(row => {
      const matchTicket = !ticketFilter || row.ticketNumber.toLowerCase().includes(ticketFilter.toLowerCase());
      const matchClient = !clientFilter || row.clientName.toLowerCase().includes(clientFilter.toLowerCase());
      return matchTicket && matchClient;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'clientName':
          comparison = a.clientName.localeCompare(b.clientName);
          break;
        case 'ticketNumber':
          comparison = a.ticketNumber.localeCompare(b.ticketNumber);
          break;
        case 'ventaUSD':
          comparison = a.ventaUSD - b.ventaUSD;
          break;
        case 'saldoFinal':
          comparison = a.saldoFinal - b.saldoFinal;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [totals, ticketFilter, clientFilter, sortField, sortOrder]);

  const grandTotal = useMemo(() => ({
    ventaUSD: filteredData.reduce((sum, t) => sum + t.ventaUSD, 0),
    usadosUSD: filteredData.reduce((sum, t) => sum + t.usadosUSD, 0),
    pagosUSD: filteredData.reduce((sum, t) => sum + t.pagosUSD, 0),
    saldoFinal: filteredData.reduce((sum, t) => sum + t.saldoFinal, 0),
  }), [filteredData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-3 h-3 inline ml-1" /> : 
      <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  const clearFilters = () => {
    setTicketFilter('');
    setClientFilter('');
  };

  const hasFilters = ticketFilter || clientFilter;

  const getStatusBadge = (saldo: number) => {
    if (Math.abs(saldo) < 100) {
      return <span className="status-badge status-saldado">Saldado</span>;
    } else if (saldo > 1000) {
      return <span className="status-badge status-pendiente">Pendiente</span>;
    }
    return <span className="status-badge status-proceso">En proceso</span>;
  };

  return (
    <div className="bg-card rounded-lg border border-border card-shadow animate-slide-up">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Total por Boleto</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredData.length} de {totals.length} boletos
            </p>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportToExcel(filteredData)}
              className="gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportToPDF(filteredData)}
              className="gap-1.5"
            >
              <FileText className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por boleto..."
              value={ticketFilter}
              onChange={(e) => setTicketFilter(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por cliente..."
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 h-9">
              <X className="w-4 h-4" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-table-header border-b border-border">
              <th 
                className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('clientName')}
              >
                Cliente <SortIcon field="clientName" />
              </th>
              <th 
                className="px-4 py-3 text-center font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('ticketNumber')}
              >
                Boleto <SortIcon field="ticketNumber" />
              </th>
              <th 
                className="px-4 py-3 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('ventaUSD')}
              >
                Venta USD <SortIcon field="ventaUSD" />
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Usados USD
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Pagos USD
              </th>
              <th 
                className="px-4 py-3 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('saldoFinal')}
              >
                Saldo Final <SortIcon field="saldoFinal" />
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr 
                key={row.ticketNumber} 
                className={`${idx % 2 === 0 ? 'bg-card' : 'bg-table-stripe'} hover:bg-accent/50 transition-colors border-b border-border/50`}
              >
                <td className="px-4 py-2.5 text-foreground">
                  <span className="line-clamp-1" title={row.clientName}>
                    {row.clientName}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center font-mono text-foreground font-medium">
                  {row.ticketNumber}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                  {formatCurrency(row.ventaUSD)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-destructive">
                  {row.usadosUSD > 0 ? formatCurrency(row.usadosUSD) : '—'}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-success">
                  {formatCurrency(row.pagosUSD)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                  <span className={
                    Math.abs(row.saldoFinal) < 100 ? 'text-success' : 
                    row.saldoFinal > 1000 ? 'text-destructive' : 'text-warning'
                  }>
                    {formatCurrency(row.saldoFinal)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  {getStatusBadge(row.saldoFinal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-primary text-primary-foreground font-medium">
              <td className="px-4 py-3">
                TOTALES ({filteredData.length} boletos)
              </td>
              <td className="px-4 py-3 text-center">—</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatCurrency(grandTotal.ventaUSD)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatCurrency(grandTotal.usadosUSD)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatCurrency(grandTotal.pagosUSD)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-base font-semibold">
                {formatCurrency(grandTotal.saldoFinal)}
              </td>
              <td className="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="p-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded p-3 text-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Saldados</span>
          <p className="text-xl font-semibold text-success mt-0.5">
            {filteredData.filter(t => Math.abs(t.saldoFinal) < 100).length}
          </p>
        </div>
        <div className="bg-muted/50 rounded p-3 text-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Pendientes</span>
          <p className="text-xl font-semibold text-destructive mt-0.5">
            {filteredData.filter(t => t.saldoFinal > 1000).length}
          </p>
        </div>
        <div className="bg-muted/50 rounded p-3 text-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">En Proceso</span>
          <p className="text-xl font-semibold text-warning mt-0.5">
            {filteredData.filter(t => t.saldoFinal >= 100 && t.saldoFinal <= 1000).length}
          </p>
        </div>
        <div className="bg-muted/50 rounded p-3 text-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Saldo Total</span>
          <p className={`text-lg font-semibold mt-0.5 ${grandTotal.saldoFinal > 100 ? 'text-destructive' : 'text-success'}`}>
            {formatCurrency(grandTotal.saldoFinal)}
          </p>
        </div>
      </div>
    </div>
  );
}
