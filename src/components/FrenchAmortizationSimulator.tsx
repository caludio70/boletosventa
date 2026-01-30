import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, Download, FileSpreadsheet } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import * as XLSX from 'xlsx';

type Periodicity = 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual';

interface SimulationParams {
  clientName: string;
  clientCuit: string;
  capital: number;
  periods: number;
  tna: number; // Tasa Nominal Anual
  periodicity: Periodicity;
  includeIva: boolean;
  ivaRate: number;
}

interface AmortizationRow {
  period: number;
  beginningBalance: number;
  payment: number;
  principal: number;
  interest: number;
  iva: number;
  totalPayment: number;
  endingBalance: number;
}

interface RateCalculations {
  tna: number;
  tem: number;
  tea: number;
  periodicRate: number;
  periodsPerYear: number;
}

const PERIODICITY_CONFIG: Record<Periodicity, { label: string; periodsPerYear: number }> = {
  monthly: { label: 'Mensual', periodsPerYear: 12 },
  bimonthly: { label: 'Bimestral', periodsPerYear: 6 },
  quarterly: { label: 'Trimestral', periodsPerYear: 4 },
  semiannual: { label: 'Semestral', periodsPerYear: 2 },
  annual: { label: 'Anual', periodsPerYear: 1 },
};

function calculateRates(tna: number, periodicity: Periodicity): RateCalculations {
  const periodsPerYear = PERIODICITY_CONFIG[periodicity].periodsPerYear;
  
  // TNA (Tasa Nominal Anual) - input
  // TEM (Tasa Efectiva Mensual) = TNA / 12
  const tem = tna / 12;
  
  // Tasa periódica = TNA / períodos por año
  const periodicRate = tna / periodsPerYear;
  
  // TEA (Tasa Efectiva Anual) = (1 + TEM)^12 - 1
  const tea = (Math.pow(1 + tem / 100, 12) - 1) * 100;
  
  return {
    tna,
    tem,
    tea,
    periodicRate,
    periodsPerYear,
  };
}

function calculateFrenchAmortization(params: SimulationParams): AmortizationRow[] {
  const { capital, periods, tna, periodicity, includeIva, ivaRate } = params;
  const rates = calculateRates(tna, periodicity);
  const periodicRateDecimal = rates.periodicRate / 100;
  
  // Cuota fija (Sistema Francés): C = P * [r * (1+r)^n] / [(1+r)^n - 1]
  const payment = capital * (periodicRateDecimal * Math.pow(1 + periodicRateDecimal, periods)) / 
                  (Math.pow(1 + periodicRateDecimal, periods) - 1);
  
  const rows: AmortizationRow[] = [];
  let balance = capital;
  
  for (let i = 1; i <= periods; i++) {
    const interest = balance * periodicRateDecimal;
    const principal = payment - interest;
    const iva = includeIva ? interest * (ivaRate / 100) : 0;
    const totalPayment = payment + iva;
    const endingBalance = balance - principal;
    
    rows.push({
      period: i,
      beginningBalance: balance,
      payment,
      principal,
      interest,
      iva,
      totalPayment,
      endingBalance: Math.max(0, endingBalance),
    });
    
    balance = endingBalance;
  }
  
  return rows;
}

function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('es-AR', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
}

export function FrenchAmortizationSimulator() {
  const [params, setParams] = useState<SimulationParams>({
    clientName: '',
    clientCuit: '',
    capital: 0,
    periods: 12,
    tna: 42,
    periodicity: 'monthly',
    includeIva: true,
    ivaRate: 10.5,
  });
  
  const [showResults, setShowResults] = useState(false);
  
  const rates = useMemo(() => calculateRates(params.tna, params.periodicity), [params.tna, params.periodicity]);
  
  const amortizationTable = useMemo(() => {
    if (!showResults || params.capital <= 0 || params.periods <= 0) return [];
    return calculateFrenchAmortization(params);
  }, [params, showResults]);
  
  const totals = useMemo(() => {
    if (amortizationTable.length === 0) return null;
    return {
      totalPayment: amortizationTable.reduce((sum, row) => sum + row.payment, 0),
      totalPrincipal: amortizationTable.reduce((sum, row) => sum + row.principal, 0),
      totalInterest: amortizationTable.reduce((sum, row) => sum + row.interest, 0),
      totalIva: amortizationTable.reduce((sum, row) => sum + row.iva, 0),
      totalWithIva: amortizationTable.reduce((sum, row) => sum + row.totalPayment, 0),
    };
  }, [amortizationTable]);
  
  const handleCalculate = () => {
    if (params.capital > 0 && params.periods > 0 && params.tna > 0) {
      setShowResults(true);
    }
  };
  
  const handleExportExcel = () => {
    if (amortizationTable.length === 0) return;
    
    // Hoja de parámetros
    const paramsData = [
      ['SIMULACIÓN SISTEMA FRANCÉS - AUTOBUS S.A.'],
      [],
      ['Cliente:', params.clientName || 'N/A'],
      ['CUIT:', params.clientCuit || 'N/A'],
      [],
      ['PARÁMETROS DEL PRÉSTAMO'],
      ['Capital:', params.capital],
      ['Cuotas:', params.periods],
      ['Periodicidad:', PERIODICITY_CONFIG[params.periodicity].label],
      [],
      ['TASAS'],
      ['TNA (Tasa Nominal Anual):', `${formatNumber(rates.tna)}%`],
      ['TEM (Tasa Efectiva Mensual):', `${formatNumber(rates.tem)}%`],
      ['TEA (Tasa Efectiva Anual):', `${formatNumber(rates.tea)}%`],
      ['Tasa Periódica:', `${formatNumber(rates.periodicRate)}%`],
      [],
      ['IVA sobre Intereses:', params.includeIva ? `${params.ivaRate}%` : 'No incluido'],
      [],
      ['TOTALES'],
      ['Total Capital:', totals?.totalPrincipal],
      ['Total Intereses:', totals?.totalInterest],
      ['Total IVA:', totals?.totalIva],
      ['Total a Pagar:', totals?.totalWithIva],
    ];
    
    // Hoja de amortización
    const tableHeader = ['Cuota', 'Sdo. Capital', 'Cuota Pura', 'Capital', 'Interés', 'IVA s/Int.', 'Total Cuota'];
    const tableData = amortizationTable.map(row => [
      row.period,
      row.beginningBalance,
      row.payment,
      row.principal,
      row.interest,
      row.iva,
      row.totalPayment,
    ]);
    
    // Fila de totales
    tableData.push([
      'TOTALES' as any,
      '' as any,
      totals?.totalPayment || 0,
      totals?.totalPrincipal || 0,
      totals?.totalInterest || 0,
      totals?.totalIva || 0,
      totals?.totalWithIva || 0,
    ]);
    
    const wb = XLSX.utils.book_new();
    
    // Hoja de parámetros
    const wsParams = XLSX.utils.aoa_to_sheet(paramsData);
    wsParams['!cols'] = [{ wch: 30 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsParams, 'Resumen');
    
    // Hoja de tabla de amortización
    const wsTable = XLSX.utils.aoa_to_sheet([tableHeader, ...tableData]);
    wsTable['!cols'] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTable, 'Tabla Amortización');
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const clientStr = params.clientName ? `_${params.clientName.replace(/\s+/g, '_').substring(0, 20)}` : '';
    XLSX.writeFile(wb, `sistema_frances${clientStr}_${dateStr}.xlsx`);
  };
  
  const handleReset = () => {
    setShowResults(false);
    setParams({
      clientName: '',
      clientCuit: '',
      capital: 0,
      periods: 12,
      tna: 42,
      periodicity: 'monthly',
      includeIva: true,
      ivaRate: 10.5,
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Parámetros del préstamo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulador Sistema Francés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Datos del cliente */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nombre del Cliente</Label>
              <Input
                id="clientName"
                placeholder="Razón social o nombre"
                value={params.clientName}
                onChange={(e) => setParams(p => ({ ...p, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientCuit">CUIT</Label>
              <Input
                id="clientCuit"
                placeholder="XX-XXXXXXXX-X"
                value={params.clientCuit}
                onChange={(e) => setParams(p => ({ ...p, clientCuit: e.target.value }))}
              />
            </div>
          </div>
          
          {/* Parámetros financieros */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="capital">Capital ($)</Label>
              <Input
                id="capital"
                type="number"
                min={0}
                step={1000}
                value={params.capital || ''}
                onChange={(e) => setParams(p => ({ ...p, capital: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="periods">Cantidad de Cuotas</Label>
              <Input
                id="periods"
                type="number"
                min={1}
                max={360}
                value={params.periods || ''}
                onChange={(e) => setParams(p => ({ ...p, periods: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tna">TNA (%)</Label>
              <Input
                id="tna"
                type="number"
                min={0}
                max={1000}
                step={0.1}
                value={params.tna || ''}
                onChange={(e) => setParams(p => ({ ...p, tna: parseFloat(e.target.value) || 0 }))}
                placeholder="42.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="periodicity">Periodicidad</Label>
              <Select
                value={params.periodicity}
                onValueChange={(val) => setParams(p => ({ ...p, periodicity: val as Periodicity }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PERIODICITY_CONFIG).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* IVA */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="includeIva">Incluir IVA sobre Intereses</Label>
              <Select
                value={params.includeIva ? 'yes' : 'no'}
                onValueChange={(val) => setParams(p => ({ ...p, includeIva: val === 'yes' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {params.includeIva && (
              <div className="space-y-2">
                <Label htmlFor="ivaRate">Alícuota IVA (%)</Label>
                <Input
                  id="ivaRate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={params.ivaRate || ''}
                  onChange={(e) => setParams(p => ({ ...p, ivaRate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            )}
          </div>
          
          {/* Botones */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCalculate} disabled={params.capital <= 0 || params.periods <= 0}>
              <Calculator className="w-4 h-4 mr-2" />
              Calcular
            </Button>
            {showResults && (
              <>
                <Button variant="outline" onClick={handleExportExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
                <Button variant="ghost" onClick={handleReset}>
                  Limpiar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Cuadro de tasas */}
      {showResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cálculo de Tasas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-muted/30 p-4 text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">TNA</div>
                <div className="text-2xl font-bold text-primary">{formatNumber(rates.tna)}%</div>
                <div className="text-xs text-muted-foreground">Tasa Nominal Anual</div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">TEM</div>
                <div className="text-2xl font-bold text-primary">{formatNumber(rates.tem)}%</div>
                <div className="text-xs text-muted-foreground">Tasa Efectiva Mensual</div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">TEA</div>
                <div className="text-2xl font-bold text-primary">{formatNumber(rates.tea)}%</div>
                <div className="text-xs text-muted-foreground">Tasa Efectiva Anual</div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Periodicidad</div>
                <div className="text-2xl font-bold text-primary">{PERIODICITY_CONFIG[params.periodicity].label}</div>
                <div className="text-xs text-muted-foreground">Tasa: {formatNumber(rates.periodicRate)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Resumen */}
      {showResults && totals && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen del Préstamo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Capital</div>
                <div className="text-lg font-semibold">{formatCurrency(params.capital, 'ARS')}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Total Intereses</div>
                <div className="text-lg font-semibold">{formatCurrency(totals.totalInterest, 'ARS')}</div>
              </div>
              {params.includeIva && (
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Total IVA</div>
                  <div className="text-lg font-semibold">{formatCurrency(totals.totalIva, 'ARS')}</div>
                </div>
              )}
              <div className="rounded-lg border p-3 bg-primary/5 border-primary/30">
                <div className="text-xs text-muted-foreground">Total a Pagar</div>
                <div className="text-lg font-bold text-primary">{formatCurrency(totals.totalWithIva, 'ARS')}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Cuota Fija</div>
                <div className="text-lg font-semibold">{formatCurrency(amortizationTable[0]?.totalPayment || 0, 'ARS')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Tabla de amortización */}
      {showResults && amortizationTable.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tabla de Amortización</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-16">Cuota</TableHead>
                  <TableHead className="text-right">Sdo. Capital</TableHead>
                  <TableHead className="text-right">Cuota Pura</TableHead>
                  <TableHead className="text-right">Capital</TableHead>
                  <TableHead className="text-right">Interés</TableHead>
                  {params.includeIva && <TableHead className="text-right">IVA s/Int.</TableHead>}
                  <TableHead className="text-right">Total Cuota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amortizationTable.map((row) => (
                  <TableRow key={row.period}>
                    <TableCell className="text-center font-medium">{row.period}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(row.beginningBalance, 'ARS')}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(row.payment, 'ARS')}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(row.principal, 'ARS')}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(row.interest, 'ARS')}</TableCell>
                    {params.includeIva && <TableCell className="text-right font-mono text-sm">{formatCurrency(row.iva, 'ARS')}</TableCell>}
                    <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(row.totalPayment, 'ARS')}</TableCell>
                  </TableRow>
                ))}
                {/* Fila de totales */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell className="text-center">TOTAL</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(totals?.totalPayment || 0, 'ARS')}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(totals?.totalPrincipal || 0, 'ARS')}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(totals?.totalInterest || 0, 'ARS')}</TableCell>
                  {params.includeIva && <TableCell className="text-right font-mono">{formatCurrency(totals?.totalIva || 0, 'ARS')}</TableCell>}
                  <TableCell className="text-right font-mono">{formatCurrency(totals?.totalWithIva || 0, 'ARS')}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
