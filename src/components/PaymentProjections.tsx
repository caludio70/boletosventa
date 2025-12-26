import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  getFuturePayments, 
  getPaymentsByMonth, 
  getPendingBalances,
  FuturePayment,
  MonthlyPaymentSummary 
} from '@/lib/realData';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { 
  Calendar, 
  TrendingUp, 
  Clock, 
  DollarSign,
  ChevronDown,
  ChevronUp,
  Users,
  FileText
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
  
  const futurePayments = useMemo(() => getFuturePayments(), []);
  const monthlyPayments = useMemo(() => getPaymentsByMonth(), []);
  const pendingBalances = useMemo(() => getPendingBalances(), []);
  
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

  // Build client x month matrix for the table
  const clientMonthlyData = useMemo(() => {
    // Get unique clients from future payments
    const clientMap = new Map<string, { clientName: string; months: Map<string, number>; total: number }>();
    
    for (const payment of futurePayments) {
      const monthKey = `${payment.dueDate.getFullYear()}-${payment.dueDate.getMonth()}`;
      
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
    
    return Array.from(clientMap.entries())
      .map(([code, data]) => ({
        clientCode: code,
        clientName: data.clientName,
        months: data.months,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [futurePayments]);

  // Get month columns for the table
  const monthColumns = useMemo(() => {
    return futureMonths.map(m => ({
      key: `${m.year}-${m.monthNumber}`,
      label: `${m.month.substring(0, 3)} ${m.year}`,
      month: m.month,
      year: m.year,
    }));
  }, [futureMonths]);

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
  
  const toggleMonth = (key: string) => {
    setExpandedMonth(expandedMonth === key ? null : key);
  };
  
  return (
    <div className="space-y-6">
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
                            <TableCell className="max-w-[200px] truncate">{payment.clientName}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{payment.ticketNumber}</Badge>
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
              <CardContent>
                <ScrollArea className="w-full">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                          <TableHead className="text-primary-foreground sticky left-0 bg-primary min-w-[200px]">
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
                            <TableCell className="sticky left-0 bg-inherit font-medium max-w-[200px] truncate">
                              {client.clientName}
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
                      <tfoot>
                        <TableRow className="bg-muted font-bold border-t-2 border-border">
                          <TableCell className="sticky left-0 bg-muted font-bold">
                            TOTALES
                          </TableCell>
                          {monthColumns.map(col => (
                            <TableCell key={col.key} className="text-right tabular-nums font-bold">
                              {formatCurrency(columnTotals.get(col.key) || 0)}
                            </TableCell>
                          ))}
                          <TableCell className="text-right tabular-nums font-bold text-lg">
                            {formatCurrency(totalFutureUSD)}
                          </TableCell>
                        </TableRow>
                      </tfoot>
                    </Table>
                  </div>
                </ScrollArea>
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
                        <div className="border-t border-border">
                          <ScrollArea className="max-h-[300px]">
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
                                    <TableCell className="max-w-[150px] truncate">{payment.clientName}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{payment.ticketNumber}</Badge>
                                    </TableCell>
                                    <TableCell>{payment.detail}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(payment.amountUSD)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
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
                          <TableCell className="max-w-[250px] truncate font-medium">
                            {client.clientName}
                          </TableCell>
                          <TableCell>{client.clientCode}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {client.tickets.map(t => (
                                <Badge key={t} variant="outline" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {t}
                                </Badge>
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
    </div>
  );
}
