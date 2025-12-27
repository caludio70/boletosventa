import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TicketCard } from '@/components/TicketCard';
import { getTicketsWithoutPayments, getDebtAging, getAgingSummary, getTicketByNumber, DebtAgingItem } from '@/lib/realData';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { AlertTriangle, Clock, DollarSign, FileWarning, Users, Download, FileSpreadsheet, Search, X } from 'lucide-react';
import { Ticket } from '@/lib/types';
import { exportDebtAgingToExcel, exportDebtAgingToPDF } from '@/lib/exportUtils';

export function DebtAging() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [clientFilter, setClientFilter] = useState<string>('');
  const [ticketFilter, setTicketFilter] = useState<string>('');
  const [agingBucketFilter, setAgingBucketFilter] = useState<string>('all');

  const ticketsWithoutPayments = useMemo(() => getTicketsWithoutPayments(), []);
  const allDebtAging = useMemo(() => getDebtAging(), []);
  const agingSummary = useMemo(() => getAgingSummary(), []);

  // Get unique clients for filter dropdown
  const uniqueClients = useMemo(() => {
    const clients = new Map<string, string>();
    allDebtAging.forEach(item => {
      clients.set(item.clientCode, item.clientName);
    });
    return Array.from(clients.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [allDebtAging]);

  // Filter function
  const filterItems = (items: DebtAgingItem[]) => {
    return items.filter(item => {
      const matchesClient = !clientFilter || 
        item.clientName.toLowerCase().includes(clientFilter.toLowerCase()) ||
        item.clientCode.toLowerCase().includes(clientFilter.toLowerCase());
      const matchesTicket = !ticketFilter || 
        item.ticketNumber.toLowerCase().includes(ticketFilter.toLowerCase());
      const matchesBucket = agingBucketFilter === 'all' || item.agingBucket === agingBucketFilter;
      return matchesClient && matchesTicket && matchesBucket;
    });
  };

  const filteredWithoutPayments = useMemo(() => 
    filterItems(ticketsWithoutPayments), 
    [ticketsWithoutPayments, clientFilter, ticketFilter, agingBucketFilter]
  );

  const filteredAllDebt = useMemo(() => 
    filterItems(allDebtAging), 
    [allDebtAging, clientFilter, ticketFilter, agingBucketFilter]
  );

  const totalPending = useMemo(() => 
    filteredAllDebt.reduce((sum, item) => sum + item.balance, 0), 
    [filteredAllDebt]
  );

  const totalWithoutPayments = useMemo(() => 
    filteredWithoutPayments.reduce((sum, item) => sum + item.balance, 0), 
    [filteredWithoutPayments]
  );

  const handleTicketClick = (ticketNumber: string) => {
    const ticket = getTicketByNumber(ticketNumber);
    if (ticket) {
      setSelectedTicket(ticket);
      setModalOpen(true);
    }
  };

  const clearFilters = () => {
    setClientFilter('');
    setTicketFilter('');
    setAgingBucketFilter('all');
  };

  const hasActiveFilters = clientFilter || ticketFilter || agingBucketFilter !== 'all';

  const getBucketColor = (bucket: string) => {
    switch (bucket) {
      case '0-30': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case '31-60': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      case '61-90': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
      case '90+': return 'bg-red-500/10 text-red-600 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getBucketLabel = (bucket: string) => {
    switch (bucket) {
      case '0-30': return '0-30 días';
      case '31-60': return '31-60 días';
      case '61-90': return '61-90 días';
      case '90+': return '+90 días';
      default: return bucket;
    }
  };

  const renderTable = (items: DebtAgingItem[], showPaymentStatus = false) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Boleto</TableHead>
            <TableHead>Fecha Op.</TableHead>
            <TableHead className="text-right">Venta USD</TableHead>
            <TableHead className="text-right">Usados</TableHead>
            {showPaymentStatus && <TableHead className="text-right">Pagos</TableHead>}
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-center">Días</TableHead>
            <TableHead className="text-center">Aging</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showPaymentStatus ? 9 : 8} className="text-center text-muted-foreground py-8">
                No hay registros para mostrar
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.ticketNumber} className="hover:bg-muted/50">
                <TableCell className="font-medium">{item.clientName}</TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-mono text-primary"
                    onClick={() => handleTicketClick(item.ticketNumber)}
                  >
                    {item.ticketNumber}
                  </Button>
                </TableCell>
                <TableCell>{formatDate(item.operationDate)}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(item.totalSale)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(item.totalUsed)}
                </TableCell>
                {showPaymentStatus && (
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.totalPayments)}
                  </TableCell>
                )}
                <TableCell className="text-right font-mono font-semibold text-destructive">
                  {formatCurrency(item.balance)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {item.daysOverdue}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={getBucketColor(item.agingBucket)}>
                    {getBucketLabel(item.agingBucket)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportDebtAgingToExcel(filteredAllDebt, 'aging_deuda')}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportDebtAgingToPDF(filteredAllDebt, 'aging_deuda')}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Input
                placeholder="Buscar cliente..."
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Boleto</label>
              <Input
                placeholder="Número de boleto..."
                value={ticketFilter}
                onChange={(e) => setTicketFilter(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Antigüedad</label>
              <Select value={agingBucketFilter} onValueChange={setAgingBucketFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="0-30">0-30 días</SelectItem>
                  <SelectItem value="31-60">31-60 días</SelectItem>
                  <SelectItem value="61-90">61-90 días</SelectItem>
                  <SelectItem value="90+">+90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredAllDebt.length} de {allDebtAging.length} registros
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deuda Total Pendiente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredAllDebt.length} operaciones pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Ningún Pago</CardTitle>
            <FileWarning className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatCurrency(totalWithoutPayments)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredWithoutPayments.length} boletos sin pagos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crítico (+90 días)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(agingSummary.find(s => s.bucket === '90+')?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {agingSummary.find(s => s.bucket === '90+')?.count || 0} operaciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes con Deuda</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredAllDebt.map(i => i.clientCode)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              clientes únicos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Buckets Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Resumen por Antigüedad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {agingSummary.map((bucket) => (
              <div
                key={bucket.bucket}
                className={`p-4 rounded-lg border ${getBucketColor(bucket.bucket)}`}
              >
                <div className="text-sm font-medium mb-1">
                  {getBucketLabel(bucket.bucket)}
                </div>
                <div className="text-xl font-bold">
                  {formatCurrency(bucket.total)}
                </div>
                <div className="text-xs opacity-70">
                  {bucket.count} operaciones
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="no-payments">
            <TabsList className="mb-4">
              <TabsTrigger value="no-payments" className="gap-2">
                <FileWarning className="h-4 w-4" />
                Sin Pagos ({filteredWithoutPayments.length})
              </TabsTrigger>
              <TabsTrigger value="all-aging" className="gap-2">
                <Clock className="h-4 w-4" />
                Todo el Aging ({filteredAllDebt.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="no-payments">
              <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  <strong>Atención:</strong> Estos boletos no tienen ningún pago registrado.
                </p>
              </div>
              {renderTable(filteredWithoutPayments, false)}
            </TabsContent>

            <TabsContent value="all-aging">
              {renderTable(filteredAllDebt, true)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Boleto</DialogTitle>
          </DialogHeader>
          {selectedTicket && <TicketCard ticket={selectedTicket} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
