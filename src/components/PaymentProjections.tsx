import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  getFuturePayments, 
  getPaymentsByMonth, 
  getPendingBalances,
  getTicketByNumber,
  getTicketsByClientCode,
  getClientSummary,
  FuturePayment,
  MonthlyPaymentSummary 
} from '@/lib/realData';
import { Ticket, ClientSummary } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { TicketCard } from '@/components/TicketCard';
import { ClientSummaryCard } from '@/components/ClientSummaryCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Calendar, 
  TrendingUp, 
  Clock, 
  DollarSign,
  ChevronDown,
  ChevronUp,
  Users,
  FileText,
  Search,
  X,
  User
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export function PaymentProjections() {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedClientSummary, setSelectedClientSummary] = useState<ClientSummary | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientFilter, setClientFilter] = useState<string>('');
  const [ticketFilter, setTicketFilter] = useState<string>('');
  
  const allFuturePayments = useMemo(() => getFuturePayments(), []);
  const allMonthlyPayments = useMemo(() => getPaymentsByMonth(), []);
  const allPendingBalances = useMemo(() => getPendingBalances(), []);

  // Filter future payments
  const futurePayments = useMemo(() => {
    return allFuturePayments.filter(payment => {
      const matchesClient = !clientFilter ||
        payment.clientName.toLowerCase().includes(clientFilter.toLowerCase()) ||
        payment.clientCode.toLowerCase().includes(clientFilter.toLowerCase());
      const matchesTicket = !ticketFilter ||
        payment.ticketNumber.toLowerCase().includes(ticketFilter.toLowerCase());
      return matchesClient && matchesTicket;
    });
  }, [allFuturePayments, clientFilter, ticketFilter]);

  // Filter monthly payments
  const monthlyPayments = useMemo(() => {
    return allMonthlyPayments.map(month => ({
      ...month,
      payments: month.payments.filter(payment => {
        const matchesClient = !clientFilter ||
          payment.clientName.toLowerCase().includes(clientFilter.toLowerCase()) ||
          payment.clientCode.toLowerCase().includes(clientFilter.toLowerCase());
        const matchesTicket = !ticketFilter ||
          payment.ticketNumber.toLowerCase().includes(ticketFilter.toLowerCase());
        return matchesClient && matchesTicket;
      }),
    })).map(month => ({
      ...month,
      totalUSD: month.payments.reduce((sum, p) => sum + p.amountUSD, 0),
      totalARS: month.payments.reduce((sum, p) => sum + p.amountARS, 0),
      paymentCount: month.payments.length,
    })).filter(month => month.payments.length > 0);
  }, [allMonthlyPayments, clientFilter, ticketFilter]);

  // Filter pending balances
  const pendingBalances = useMemo(() => {
    return allPendingBalances.filter(client => {
      const matchesClient = !clientFilter ||
        client.clientName.toLowerCase().includes(clientFilter.toLowerCase()) ||
        client.clientCode.toLowerCase().includes(clientFilter.toLowerCase());
      const matchesTicket = !ticketFilter ||
        client.tickets.some(t => t.toLowerCase().includes(ticketFilter.toLowerCase()));
      return matchesClient && matchesTicket;
    });
  }, [allPendingBalances, clientFilter, ticketFilter]);

  const clearFilters = () => {
    setClientFilter('');
    setTicketFilter('');
  };

  const hasActiveFilters = clientFilter || ticketFilter;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Separate past and future months
  const futureMonths = monthlyPayments.filter(m => {
    const monthDate = new Date(m.year, m.monthNumber, 1);
    return monthDate >= new Date(today.getFullYear(), today.getMonth(), 1);
  });
  
  // Total future payments
  const totalFutureUSD = futurePayments.reduce((sum, p) => sum + p.amountUSD, 0);
  const totalPendingUSD = pendingBalances.reduce((sum, p) => sum + p.totalPending, 0);
  
  // Chart data for monthly payments
  const chartData = futureMonths.map(m => ({
    name: `${m.month.substring(0, 3)} ${m.year}`,
    total: m.totalUSD,
    count: m.paymentCount,
  }));

  // Build client x month matrix for the table - using ALL monthly payments, not just future
  const clientMonthlyData = useMemo(() => {
    const clientMap = new Map<string, { clientName: string; months: Map<string, number>; total: number }>();
    
    // Iterate through all monthly payments (past and future)
    for (const monthData of monthlyPayments) {
      for (const payment of monthData.payments) {
        const monthKey = `${monthData.year}-${monthData.monthNumber}`;
        
        if (!clientMap.has(payment.clientCode)) {
          clientMap.set(payment.clientCode, {
            clientName: payment.clientName,
            months: new Map(),
            total: 0,
          });
        }
        
        const client = clientMap.get(payment.clientCode)!;
        const currentAmount = client.months.get(monthKey) || 0;
        client.months.set(monthKey, currentAmount + payment.amountUSD);
        client.total += payment.amountUSD;
      }
    }
    
    return Array.from(clientMap.entries())
      .map(([code, data]) => ({
        clientCode: code,
        clientName: data.clientName,
        months: data.months,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [monthlyPayments]);

  // Get month columns for the table - use ALL months, not just future
  const monthColumns = useMemo(() => {
    return monthlyPayments.map(m => ({
      key: `${m.year}-${m.monthNumber}`,
      label: `${m.month.substring(0, 3)} ${m.year}`,
      month: m.month,
      year: m.year,
    }));
  }, [monthlyPayments]);

  // Calculate column totals
  const columnTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const client of clientMonthlyData) {
      for (const [monthKey, amount] of client.months) {
        const current = totals.get(monthKey) || 0;
        totals.set(monthKey, current + amount);
      }
    }
    return totals;
  }, [clientMonthlyData]);

  // Calculate grand total for the table (all months, not just future)
  const grandTotalUSD = useMemo(() => {
    return clientMonthlyData.reduce((sum, client) => sum + client.total, 0);
  }, [clientMonthlyData]);
  
  const toggleMonth = (key: string) => {
    setExpandedMonth(expandedMonth === key ? null : key);
  };

  const handleTicketClick = (ticketNumber: string) => {
    const ticket = getTicketByNumber(ticketNumber);
    if (ticket) {
      setSelectedTicket(ticket);
      setIsTicketModalOpen(true);
    }
  };

  const handleClientClick = (clientCode: string) => {
    const tickets = getTicketsByClientCode(clientCode);
    if (tickets.length > 0) {
      const summary = getClientSummary(tickets);
      if (summary) {
        setSelectedClientSummary(summary);
        setIsClientModalOpen(true);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-card border-border card-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              Mostrando resultados filtrados
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cobros Futuros</p>
                <p className="text-2xl font-bold">{formatCurrency(totalFutureUSD)}</p>
                <p className="text-xs text-muted-foreground">{futurePayments.length} cheques pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <DollarSign className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldos Pendientes</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPendingUSD)}</p>
                <p className="text-xs text-muted-foreground">{pendingBalances.length} clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Próximo Mes</p>
                <p className="text-2xl font-bold">
                  {futureMonths.length > 0 ? formatCurrency(futureMonths[0].totalUSD) : formatCurrency(0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {futureMonths.length > 0 ? `${futureMonths[0].month} ${futureMonths[0].year}` : 'Sin datos'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="future" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="future" className="gap-2">
            <Calendar className="h-4 w-4" />
            Pagos Futuros
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Por Mes
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Users className="h-4 w-4" />
            Saldos por Cliente
          </TabsTrigger>
        </TabsList>
        
        {/* Future Payments Tab */}
        <TabsContent value="future" className="mt-4">
          <Card className="bg-card border-border card-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Cheques y Pagos Pendientes de Cobro
              </CardTitle>
            </CardHeader>
            <CardContent>
              {futurePayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay pagos futuros programados
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                        <TableHead className="text-primary-foreground">Vencimiento</TableHead>
                        <TableHead className="text-primary-foreground">Cliente</TableHead>
                        <TableHead className="text-primary-foreground">Boleto</TableHead>
                        <TableHead className="text-primary-foreground">Detalle</TableHead>
                        <TableHead className="text-primary-foreground text-right">Importe USD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {futurePayments.map((payment, idx) => {
                        const daysUntil = Math.ceil((payment.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <TableRow key={idx} className="even:bg-table-stripe">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{formatDate(payment.dueDate)}</span>
                                {daysUntil <= 7 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {daysUntil === 0 ? 'Hoy' : `${daysUntil}d`}
                                  </Badge>
                                )}
                                {daysUntil > 7 && daysUntil <= 30 && (
                                  <Badge variant="outline" className="text-xs border-warning text-warning">
                                    {daysUntil}d
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="link"
                                className="p-0 h-auto font-medium text-foreground hover:text-primary max-w-[200px] truncate"
                                onClick={() => handleClientClick(payment.clientCode)}
                              >
                                {payment.clientName}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="link"
                                className="p-0 h-auto font-mono text-primary"
                                onClick={() => handleTicketClick(payment.ticketNumber)}
                              >
                                {payment.ticketNumber}
                              </Button>
                            </TableCell>
                            <TableCell>{payment.detail}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(payment.amountUSD)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Monthly Summary Tab */}
        <TabsContent value="monthly" className="mt-4 space-y-4">
          {/* Monthly Totals Table by Client */}
          {clientMonthlyData.length > 0 && monthColumns.length > 0 && (
            <Card className="bg-card border-border card-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Cobros por Cliente y Mes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary text-primary-foreground hover:bg-primary sticky top-0 z-10">
                        <TableHead className="text-primary-foreground sticky left-0 bg-primary min-w-[200px] z-20">
                          Cliente
                        </TableHead>
                        {monthColumns.map(col => (
                          <TableHead key={col.key} className="text-primary-foreground text-right min-w-[120px]">
                            {col.label}
                          </TableHead>
                        ))}
                        <TableHead className="text-primary-foreground text-right min-w-[130px] font-bold">
                          Total
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientMonthlyData.map((client, idx) => (
                        <TableRow key={client.clientCode} className={idx % 2 === 0 ? 'bg-card' : 'bg-table-stripe'}>
                          <TableCell className="sticky left-0 bg-inherit z-10">
                            <Button
                              variant="link"
                              className="p-0 h-auto font-medium text-foreground hover:text-primary max-w-[200px] truncate"
                              onClick={() => handleClientClick(client.clientCode)}
                            >
                              {client.clientName}
                            </Button>
                          </TableCell>
                          {monthColumns.map(col => {
                            const amount = client.months.get(col.key) || 0;
                            return (
                              <TableCell key={col.key} className="text-right tabular-nums">
                                {amount > 0 ? formatCurrency(amount) : '—'}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right tabular-nums font-bold">
                            {formatCurrency(client.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <tfoot className="sticky bottom-0 z-10">
                      <TableRow className="bg-muted font-bold border-t-2 border-border">
                        <TableCell className="sticky left-0 bg-muted font-bold z-20">
                          TOTALES
                        </TableCell>
                        {monthColumns.map(col => (
                          <TableCell key={col.key} className="text-right tabular-nums font-bold">
                            {formatCurrency(columnTotals.get(col.key) || 0)}
                          </TableCell>
                        ))}
                        <TableCell className="text-right tabular-nums font-bold text-lg">
                          {formatCurrency(grandTotalUSD)}
                        </TableCell>
                      </TableRow>
                    </tfoot>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <Card className="bg-card border-border card-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Proyección de Cobros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis 
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        className="text-xs fill-muted-foreground"
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Total USD']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.5)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Monthly Details */}
          <Card className="bg-card border-border card-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Detalle por Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {futureMonths.map((monthData) => {
                  const key = `${monthData.year}-${monthData.monthNumber}`;
                  const isExpanded = expandedMonth === key;
                  const isCurrentMonth = monthData.year === today.getFullYear() && monthData.monthNumber === today.getMonth();
                  
                  return (
                    <div key={key} className="border border-border rounded-lg overflow-hidden">
                      <Button
                        variant="ghost"
                        className={`w-full justify-between h-auto py-4 px-4 rounded-none ${isCurrentMonth ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleMonth(key)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <p className="font-medium">
                              {monthData.month} {monthData.year}
                              {isCurrentMonth && (
                                <Badge variant="secondary" className="ml-2 text-xs">Actual</Badge>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {monthData.paymentCount} {monthData.paymentCount === 1 ? 'pago' : 'pagos'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-lg">{formatCurrency(monthData.totalUSD)}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </Button>
                      
                      {isExpanded && (
                        <div className="border-t border-border overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead>Fecha</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Boleto</TableHead>
                                <TableHead>Detalle</TableHead>
                                <TableHead className="text-right">USD</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {monthData.payments.map((payment, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{formatDate(payment.dueDate)}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="link"
                                      className="p-0 h-auto font-medium text-foreground hover:text-primary max-w-[150px] truncate"
                                      onClick={() => handleClientClick(payment.clientCode)}
                                    >
                                      {payment.clientName}
                                    </Button>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="link"
                                      className="p-0 h-auto font-mono text-primary"
                                      onClick={() => handleTicketClick(payment.ticketNumber)}
                                    >
                                      {payment.ticketNumber}
                                    </Button>
                                  </TableCell>
                                  <TableCell>{payment.detail}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(payment.amountUSD)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {futureMonths.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay pagos futuros programados
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Pending Balances Tab */}
        <TabsContent value="pending" className="mt-4">
          <Card className="bg-card border-border card-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Saldos Pendientes por Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingBalances.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay saldos pendientes
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                        <TableHead className="text-primary-foreground">Cliente</TableHead>
                        <TableHead className="text-primary-foreground">Código</TableHead>
                        <TableHead className="text-primary-foreground">Boletos</TableHead>
                        <TableHead className="text-primary-foreground text-right">Saldo Pendiente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingBalances.map((client, idx) => (
                        <TableRow key={idx} className="even:bg-table-stripe">
                          <TableCell>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-medium text-foreground hover:text-primary max-w-[250px] truncate"
                              onClick={() => handleClientClick(client.clientCode)}
                            >
                              {client.clientName}
                            </Button>
                          </TableCell>
                          <TableCell>{client.clientCode}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {client.tickets.map(t => (
                                <button
                                  key={t}
                                  onClick={() => handleTicketClick(t)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
                                  title={`Ver detalle del boleto ${t}`}
                                >
                                  <FileText className="h-3 w-3" />
                                  {t}
                                </button>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-lg">
                            {formatCurrency(client.totalPending)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Total */}
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                    <span className="font-medium">Total Saldos Pendientes:</span>
                    <span className="text-xl font-bold">{formatCurrency(totalPendingUSD)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Modal */}
      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle del Boleto {selectedTicket?.ticketNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && <TicketCard ticket={selectedTicket} />}
        </DialogContent>
      </Dialog>

      {/* Client Summary Modal */}
      <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Resumen del Cliente
            </DialogTitle>
          </DialogHeader>
          {selectedClientSummary && <ClientSummaryCard summary={selectedClientSummary} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
