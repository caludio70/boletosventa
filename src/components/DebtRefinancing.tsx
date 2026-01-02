import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DollarSign, RefreshCw, FileText, Plus, Trash2, Calculator, Building2 } from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Proposal {
  id: string;
  cuotas: number;
  tasaDirecta: number;
  plan: PaymentPlan[];
  deudaEnPesos: number;
  interesTotal: number;
  totalAPagar: number;
  valorCuota: number;
  coeficiente: number;
}

interface PaymentPlan {
  numero: number;
  fecha: Date;
  capital: number;
  interes: number;
  cuota: number;
  saldo: number;
}

interface ExchangeRates {
  oficial: { compra: number; venta: number };
  loading: boolean;
  lastUpdate: Date | null;
}

export function DebtRefinancing() {
  // Client data
  const [clientName, setClientName] = useState('');
  const [clientCuit, setClientCuit] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [proposalDate, setProposalDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Debt data
  const [concept, setConcept] = useState('');
  const [debtAmount, setDebtAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<'USD' | 'ARS'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  
  // Financing conditions
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [diaVencimiento, setDiaVencimiento] = useState(30);
  const [primerVencimiento, setPrimerVencimiento] = useState('');
  
  // Company data
  const [companyName] = useState('AUTOBUS S.A.');
  const [companyCuit] = useState('30-12345678-9');
  const [companyAddress] = useState('Av. Principal 1234, CABA');
  const [companyContact] = useState('contacto@autobus.com.ar');
  const [observations, setObservations] = useState('');
  
  // Exchange rates
  const [rates, setRates] = useState<ExchangeRates>({
    oficial: { compra: 0, venta: 0 },
    loading: false,
    lastUpdate: null,
  });

  // Dialog for adding proposal
  const [showAddProposal, setShowAddProposal] = useState(false);
  const [newCuotas, setNewCuotas] = useState(6);
  const [newTasa, setNewTasa] = useState(3.5);

  // Initialize primer vencimiento
  useEffect(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setPrimerVencimiento(nextMonth.toISOString().split('T')[0]);
  }, []);

  // Fetch exchange rate from BNA
  const fetchExchangeRate = async () => {
    setRates(prev => ({ ...prev, loading: true }));
    try {
      // Usamos una API pública de cotizaciones de Argentina
      const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
      const data = await response.json();
      
      if (data && data.venta) {
        setRates({
          oficial: { compra: data.compra || 0, venta: data.venta },
          loading: false,
          lastUpdate: new Date(),
        });
        setExchangeRate(data.venta);
        toast.success('Cotización BNA actualizada');
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      toast.error('No se pudo obtener la cotización. Ingrese manualmente.');
      setRates(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  // Get último día hábil
  const getUltimoDiaHabil = (fecha: Date): Date => {
    const dia = fecha.getDay();
    if (dia === 0) {
      fecha.setDate(fecha.getDate() - 2);
    } else if (dia === 6) {
      fecha.setDate(fecha.getDate() - 1);
    }
    return fecha;
  };

  // Calculate siguiente vencimiento
  const calcularSiguienteVencimiento = (fechaBase: Date, diaPreferido: number): Date => {
    const siguiente = new Date(fechaBase);
    siguiente.setMonth(siguiente.getMonth() + 1);
    
    const ultimoDiaMes = new Date(siguiente.getFullYear(), siguiente.getMonth() + 1, 0).getDate();
    const diaFinal = Math.min(diaPreferido, ultimoDiaMes);
    
    siguiente.setDate(diaFinal);
    return getUltimoDiaHabil(siguiente);
  };

  // Generate payment plan
  const generatePlan = (deudaEnPesos: number, cuotas: number, tasa: number): { plan: PaymentPlan[], interesTotal: number, totalAPagar: number, valorCuota: number, coeficiente: number } => {
    const coeficiente = (tasa / 100 * cuotas) + 1;
    const totalAPagar = deudaEnPesos * coeficiente;
    const interesTotal = totalAPagar - deudaEnPesos;
    const valorCuota = totalAPagar / cuotas;
    const capitalPorCuota = deudaEnPesos / cuotas;
    const interesPorCuota = interesTotal / cuotas;

    const plan: PaymentPlan[] = [];
    let fechaActual = new Date(primerVencimiento);
    fechaActual = getUltimoDiaHabil(fechaActual);
    const diaBase = fechaActual.getDate();

    for (let i = 1; i <= cuotas; i++) {
      plan.push({
        numero: i,
        fecha: new Date(fechaActual),
        capital: capitalPorCuota,
        interes: interesPorCuota,
        cuota: valorCuota,
        saldo: deudaEnPesos - (capitalPorCuota * i),
      });

      if (i < cuotas) {
        fechaActual = calcularSiguienteVencimiento(fechaActual, diaBase);
      }
    }

    return { plan, interesTotal, totalAPagar, valorCuota, coeficiente };
  };

  // Add proposal
  const addProposal = () => {
    if (!debtAmount || debtAmount <= 0) {
      toast.error('Ingrese un monto de deuda válido');
      return;
    }
    if (currency === 'USD' && (!exchangeRate || exchangeRate <= 0)) {
      toast.error('Ingrese un tipo de cambio válido');
      return;
    }
    if (!primerVencimiento) {
      toast.error('Ingrese la fecha del primer vencimiento');
      return;
    }

    const deudaEnPesos = currency === 'USD' ? debtAmount * exchangeRate : debtAmount;
    const { plan, interesTotal, totalAPagar, valorCuota, coeficiente } = generatePlan(deudaEnPesos, newCuotas, newTasa);

    const newProposal: Proposal = {
      id: crypto.randomUUID(),
      cuotas: newCuotas,
      tasaDirecta: newTasa,
      plan,
      deudaEnPesos,
      interesTotal,
      totalAPagar,
      valorCuota,
      coeficiente,
    };

    setProposals(prev => [...prev, newProposal]);
    setShowAddProposal(false);
    toast.success(`Propuesta de ${newCuotas} cuotas agregada`);
  };

  // Remove proposal
  const removeProposal = (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
  };

  // Quick add proposals (6 and 12 cuotas)
  const addQuickProposals = () => {
    if (!debtAmount || debtAmount <= 0) {
      toast.error('Ingrese un monto de deuda válido');
      return;
    }
    if (currency === 'USD' && (!exchangeRate || exchangeRate <= 0)) {
      toast.error('Ingrese un tipo de cambio válido');
      return;
    }
    if (!primerVencimiento) {
      toast.error('Ingrese la fecha del primer vencimiento');
      return;
    }

    const deudaEnPesos = currency === 'USD' ? debtAmount * exchangeRate : debtAmount;
    const tasa = 3.5;

    const proposals6 = generatePlan(deudaEnPesos, 6, tasa);
    const proposals12 = generatePlan(deudaEnPesos, 12, tasa);

    setProposals([
      {
        id: crypto.randomUUID(),
        cuotas: 6,
        tasaDirecta: tasa,
        plan: proposals6.plan,
        deudaEnPesos,
        interesTotal: proposals6.interesTotal,
        totalAPagar: proposals6.totalAPagar,
        valorCuota: proposals6.valorCuota,
        coeficiente: proposals6.coeficiente,
      },
      {
        id: crypto.randomUUID(),
        cuotas: 12,
        tasaDirecta: tasa,
        plan: proposals12.plan,
        deudaEnPesos,
        interesTotal: proposals12.interesTotal,
        totalAPagar: proposals12.totalAPagar,
        valorCuota: proposals12.valorCuota,
        coeficiente: proposals12.coeficiente,
      },
    ]);
    toast.success('Propuestas de 6 y 12 cuotas generadas');
  };

  // Generate PDF for proposal
  const generatePDF = (proposal: Proposal) => {
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(companyAddress, 105, 22, { align: 'center' });
    doc.text(`CUIT: ${companyCuit} | ${companyContact}`, 105, 28, { align: 'center' });

    yPos = 45;
    doc.setTextColor(0, 0, 0);
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PROPUESTA DE REFINANCIACIÓN', 105, yPos, { align: 'center' });
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date(proposalDate).toLocaleDateString('es-AR')}`, 105, yPos, { align: 'center' });
    
    yPos += 15;

    // Client data
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 20, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (clientName) {
      doc.text(`Razón Social: ${clientName}`, 20, yPos);
      yPos += 5;
    }
    if (clientCuit) {
      doc.text(`CUIT: ${clientCuit}`, 20, yPos);
      yPos += 5;
    }
    if (clientAddress) {
      doc.text(`Domicilio: ${clientAddress}`, 20, yPos);
      yPos += 5;
    }
    if (concept) {
      doc.text(`Concepto: ${concept}`, 20, yPos);
      yPos += 5;
    }

    yPos += 10;

    // Financial summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN FINANCIERO', 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (currency === 'USD') {
      doc.text(`Deuda Original: USD ${formatNumber(debtAmount)}`, 20, yPos);
      yPos += 5;
      doc.text(`Tipo de Cambio Vendedor BNA: $ ${formatNumber(exchangeRate)}`, 20, yPos);
      yPos += 5;
    }
    
    doc.text(`Capital en Pesos: $ ${formatNumber(proposal.deudaEnPesos)}`, 20, yPos);
    yPos += 5;
    doc.text(`Tasa Mensual: ${proposal.tasaDirecta}%`, 20, yPos);
    yPos += 5;
    doc.text(`Coeficiente: ${proposal.coeficiente.toFixed(4)}`, 20, yPos);
    yPos += 5;
    doc.text(`Cantidad de Cuotas: ${proposal.cuotas}`, 20, yPos);
    yPos += 5;
    doc.text(`Interés Total: $ ${formatNumber(proposal.interesTotal)}`, 20, yPos);
    yPos += 5;
    doc.text(`Total a Pagar: $ ${formatNumber(proposal.totalAPagar)}`, 20, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Valor de Cuota: $ ${formatNumber(proposal.valorCuota)}`, 20, yPos);
    
    yPos += 15;

    // Payment plan table
    doc.setFontSize(12);
    doc.text('CUADRO DE MARCHA', 20, yPos);
    yPos += 5;

    const tableData = proposal.plan.map(cuota => [
      cuota.numero.toString(),
      cuota.fecha.toLocaleDateString('es-AR'),
      '$ ' + formatNumber(cuota.capital),
      '$ ' + formatNumber(cuota.interes),
      '$ ' + formatNumber(cuota.cuota),
      '$ ' + formatNumber(Math.max(0, cuota.saldo)),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Cuota', 'Vencimiento', 'Capital', 'Interés', 'Total', 'Saldo']],
      body: tableData,
      foot: [[
        'TOTAL',
        '',
        '$ ' + formatNumber(proposal.deudaEnPesos),
        '$ ' + formatNumber(proposal.interesTotal),
        '$ ' + formatNumber(proposal.totalAPagar),
        '',
      ]],
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], fontSize: 9, fontStyle: 'bold' },
      footStyles: { fillColor: [31, 41, 55], fontSize: 9, fontStyle: 'bold', textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'right', cellWidth: 30 },
      },
      margin: { left: 20, right: 20 },
    });

    // Observations
    if (observations) {
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVACIONES:', 20, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const splitObs = doc.splitTextToSize(observations, 170);
      doc.text(splitObs, 20, yPos);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${pageCount} | ${companyName} | Propuesta generada el ${new Date().toLocaleDateString('es-AR')}`,
        105,
        290,
        { align: 'center' }
      );
    }

    // Save
    const fileName = `Propuesta_${clientName || 'Cliente'}_${proposal.cuotas}cuotas_${proposalDate}.pdf`;
    doc.save(fileName);
    toast.success('PDF generado correctamente');
  };

  // Clear form
  const clearForm = () => {
    setClientName('');
    setClientCuit('');
    setClientAddress('');
    setConcept('');
    setDebtAmount(0);
    setProposals([]);
    setObservations('');
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setPrimerVencimiento(nextMonth.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Calculator className="w-5 h-5 text-success" />
              </div>
              <div>
                <CardTitle className="text-lg">Refinanciación de Deuda</CardTitle>
                <p className="text-sm text-muted-foreground">Genera propuestas con cuadro de marcha</p>
              </div>
            </div>
            
            {/* Exchange Rate Card */}
            <Card className="bg-gradient-to-r from-primary/10 to-success/10 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">TC Vendedor BNA</p>
                    <p className="text-xl font-bold text-foreground">
                      {rates.oficial.venta > 0 ? `$ ${formatNumber(rates.oficial.venta)}` : '—'}
                    </p>
                    {rates.lastUpdate && (
                      <p className="text-[10px] text-muted-foreground">
                        {rates.lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchExchangeRate}
                    disabled={rates.loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${rates.loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Data */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Datos del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Razón Social / Nombre</Label>
                <Input 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Cliente S.A."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CUIT / DNI</Label>
                <Input 
                  value={clientCuit} 
                  onChange={(e) => setClientCuit(e.target.value)}
                  placeholder="XX-XXXXXXXX-X"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Domicilio</Label>
                <Input 
                  value={clientAddress} 
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Calle y número"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha de Propuesta</Label>
                <Input 
                  type="date"
                  value={proposalDate} 
                  onChange={(e) => setProposalDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debt Data */}
        <Card className="bg-warning/5 border-warning/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Detalles de la Deuda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Concepto / Motivo</Label>
                <Input 
                  value={concept} 
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Facturas pendientes"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Importe de la Deuda</Label>
                <Input 
                  type="number"
                  value={debtAmount || ''} 
                  onChange={(e) => setDebtAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Moneda</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as 'USD' | 'ARS')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - Dólares</SelectItem>
                    <SelectItem value="ARS">ARS - Pesos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {currency === 'USD' && (
                <div className="space-y-1">
                  <Label className="text-xs">Tipo de Cambio (Vendedor BNA)</Label>
                  <Input 
                    type="number"
                    value={exchangeRate || ''} 
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financing Conditions */}
      <Card className="bg-success/5 border-success/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Condiciones de Financiación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Día de Vencimiento</Label>
              <Input 
                type="number"
                value={diaVencimiento} 
                onChange={(e) => setDiaVencimiento(parseInt(e.target.value) || 30)}
                min={1}
                max={31}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Primer Vencimiento</Label>
              <Input 
                type="date"
                value={primerVencimiento} 
                onChange={(e) => setPrimerVencimiento(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={addQuickProposals} className="gap-2">
              <Calculator className="w-4 h-4" />
              Generar 6 y 12 Cuotas
            </Button>
            <Button variant="outline" onClick={() => setShowAddProposal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Agregar Propuesta
            </Button>
            <Button variant="secondary" onClick={clearForm} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Limpiar
            </Button>
          </div>

          {/* Observations */}
          <div className="space-y-1">
            <Label className="text-xs">Observaciones / Condiciones Adicionales</Label>
            <Textarea 
              value={observations} 
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Forma de pago, CBU, condiciones especiales..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Proposals */}
      {proposals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Propuestas Generadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={proposals[0]?.id}>
              <TabsList className="flex-wrap h-auto gap-1">
                {proposals.map((p) => (
                  <TabsTrigger key={p.id} value={p.id} className="gap-2">
                    {p.cuotas} Cuotas
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {p.tasaDirecta}%
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {proposals.map((proposal) => (
                <TabsContent key={proposal.id} value={proposal.id} className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {currency === 'USD' && (
                      <>
                        <Card className="p-3">
                          <p className="text-xs text-muted-foreground">Deuda Original</p>
                          <p className="text-base font-bold">USD {formatNumber(debtAmount)}</p>
                        </Card>
                        <Card className="p-3">
                          <p className="text-xs text-muted-foreground">Tipo de Cambio</p>
                          <p className="text-base font-bold">$ {formatNumber(exchangeRate)}</p>
                        </Card>
                      </>
                    )}
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Capital en Pesos</p>
                      <p className="text-base font-bold">$ {formatNumber(proposal.deudaEnPesos)}</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Tasa Mensual</p>
                      <p className="text-base font-bold">{proposal.tasaDirecta}%</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Interés Total</p>
                      <p className="text-base font-bold text-warning">$ {formatNumber(proposal.interesTotal)}</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Total a Pagar</p>
                      <p className="text-base font-bold text-destructive">$ {formatNumber(proposal.totalAPagar)}</p>
                    </Card>
                    <Card className="p-3 bg-success/10">
                      <p className="text-xs text-muted-foreground">Valor Cuota</p>
                      <p className="text-lg font-bold text-success">$ {formatNumber(proposal.valorCuota)}</p>
                    </Card>
                  </div>

                  {/* Payment Plan Table */}
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-16">Cuota</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead className="text-right">Capital</TableHead>
                          <TableHead className="text-right">Interés</TableHead>
                          <TableHead className="text-right">Total Cuota</TableHead>
                          <TableHead className="text-right">Saldo Pendiente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proposal.plan.map((cuota) => (
                          <TableRow key={cuota.numero} className="table-stripe">
                            <TableCell className="font-medium">{cuota.numero}</TableCell>
                            <TableCell>{cuota.fecha.toLocaleDateString('es-AR')}</TableCell>
                            <TableCell className="text-right">$ {formatNumber(cuota.capital)}</TableCell>
                            <TableCell className="text-right">$ {formatNumber(cuota.interes)}</TableCell>
                            <TableCell className="text-right font-medium">$ {formatNumber(cuota.cuota)}</TableCell>
                            <TableCell className="text-right">$ {formatNumber(Math.max(0, cuota.saldo))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow className="bg-secondary text-secondary-foreground font-bold">
                          <TableCell colSpan={2}>TOTALES</TableCell>
                          <TableCell className="text-right">$ {formatNumber(proposal.deudaEnPesos)}</TableCell>
                          <TableCell className="text-right">$ {formatNumber(proposal.interesTotal)}</TableCell>
                          <TableCell className="text-right">$ {formatNumber(proposal.totalAPagar)}</TableCell>
                          <TableCell className="text-right">—</TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button onClick={() => generatePDF(proposal)} className="gap-2">
                      <FileText className="w-4 h-4" />
                      Descargar PDF
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => removeProposal(proposal.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Add Proposal Dialog */}
      <Dialog open={showAddProposal} onOpenChange={setShowAddProposal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Propuesta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cantidad de Cuotas</Label>
              <Input 
                type="number"
                value={newCuotas} 
                onChange={(e) => setNewCuotas(parseInt(e.target.value) || 6)}
                min={1}
                max={60}
              />
            </div>
            <div className="space-y-2">
              <Label>Tasa Directa Mensual (%)</Label>
              <Input 
                type="number"
                value={newTasa} 
                onChange={(e) => setNewTasa(parseFloat(e.target.value) || 3.5)}
                step="0.1"
              />
            </div>
            <Button onClick={addProposal} className="w-full">
              Agregar Propuesta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
