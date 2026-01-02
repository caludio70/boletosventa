import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calculator, Printer, RefreshCw, Info, Calendar, DollarSign, Percent } from 'lucide-react';
import { formatNumber } from '@/lib/formatters';
import { toast } from 'sonner';

// Tabla de tasas de interés de ARCA/AFIP
const TASAS_INTERES = [
  { desde: '2025-07-01', hasta: '2999-12-31', norma: 'R (MEC) 823/2025', resarcitorioMensual: 2.75, resarcitorioDiario: 0.091667, punitarioMensual: 3.5, punitarioDiario: 0.116667 },
  { desde: '2025-03-01', hasta: '2025-06-30', norma: 'R (ME) 3/2024', resarcitorioMensual: 4, resarcitorioDiario: 0.133333, punitarioMensual: 5, punitarioDiario: 0.166667 },
  { desde: '2025-02-01', hasta: '2025-02-28', norma: 'R (ME) 3/2024', resarcitorioMensual: 7.26, resarcitorioDiario: 0.242, punitarioMensual: 8.38, punitarioDiario: 0.279333 },
  { desde: '2024-12-01', hasta: '2025-01-31', norma: 'R (ME) 3/2024', resarcitorioMensual: 7.47, resarcitorioDiario: 0.249, punitarioMensual: 8.62, punitarioDiario: 0.287333 },
  { desde: '2024-10-01', hasta: '2024-11-30', norma: 'R (ME) 3/2024', resarcitorioMensual: 6.41, resarcitorioDiario: 0.213667, punitarioMensual: 7.39, punitarioDiario: 0.246333 },
  { desde: '2024-08-01', hasta: '2024-09-30', norma: 'R (ME) 3/2024', resarcitorioMensual: 6.41, resarcitorioDiario: 0.213667, punitarioMensual: 7.39, punitarioDiario: 0.246333 },
  { desde: '2024-06-01', hasta: '2024-07-31', norma: 'R (ME) 3/2024', resarcitorioMensual: 6.41, resarcitorioDiario: 0.213667, punitarioMensual: 7.39, punitarioDiario: 0.246333 },
  { desde: '2024-04-01', hasta: '2024-05-31', norma: 'R (ME) 3/2024', resarcitorioMensual: 12.07, resarcitorioDiario: 0.402333, punitarioMensual: 13.93, punitarioDiario: 0.464333 },
  { desde: '2024-02-01', hasta: '2024-03-31', norma: 'R (ME) 3/2024', resarcitorioMensual: 15.27, resarcitorioDiario: 0.509, punitarioMensual: 17.62, punitarioDiario: 0.587333 },
  { desde: '2022-09-01', hasta: '2024-01-31', norma: 'R (ME) 559/2022', resarcitorioMensual: 5.91, resarcitorioDiario: 0.197, punitarioMensual: 7.37, punitarioDiario: 0.245667 },
  { desde: '2022-07-01', hasta: '2022-08-31', norma: 'R (MH) 598/2019', resarcitorioMensual: 4.25, resarcitorioDiario: 0.141667, punitarioMensual: 5.19, punitarioDiario: 0.173 },
  { desde: '2022-04-01', hasta: '2022-06-30', norma: 'R (MH) 598/2019', resarcitorioMensual: 3.72, resarcitorioDiario: 0.124, punitarioMensual: 4.56, punitarioDiario: 0.152 },
  { desde: '2022-01-01', hasta: '2022-03-31', norma: 'R (MH) 598/2019', resarcitorioMensual: 3.35, resarcitorioDiario: 0.111667, punitarioMensual: 4.11, punitarioDiario: 0.137 },
  { desde: '2021-10-01', hasta: '2021-12-31', norma: 'R (MH) 598/2019', resarcitorioMensual: 3.35, resarcitorioDiario: 0.111667, punitarioMensual: 4.11, punitarioDiario: 0.137 },
  { desde: '2021-07-01', hasta: '2021-09-30', norma: 'R (MH) 598/2019', resarcitorioMensual: 3.35, resarcitorioDiario: 0.111667, punitarioMensual: 4.11, punitarioDiario: 0.137 },
  { desde: '2021-04-01', hasta: '2021-06-30', norma: 'R (MH) 598/2019', resarcitorioMensual: 3.35, resarcitorioDiario: 0.111667, punitarioMensual: 4.11, punitarioDiario: 0.137 },
  { desde: '2021-01-01', hasta: '2021-03-31', norma: 'R (MH) 598/2019', resarcitorioMensual: 3.35, resarcitorioDiario: 0.111667, punitarioMensual: 4.11, punitarioDiario: 0.137 },
  { desde: '2020-10-01', hasta: '2020-12-31', norma: 'R (MH) 598/2019', resarcitorioMensual: 3.02, resarcitorioDiario: 0.100667, punitarioMensual: 3.71, punitarioDiario: 0.123667 },
  { desde: '2020-07-01', hasta: '2020-09-30', norma: 'R (MH) 598/2019', resarcitorioMensual: 2.76, resarcitorioDiario: 0.092, punitarioMensual: 3.39, punitarioDiario: 0.113 },
  { desde: '2020-04-01', hasta: '2020-06-30', norma: 'R (MH) 598/2019', resarcitorioMensual: 2.5, resarcitorioDiario: 0.083333, punitarioMensual: 3.08, punitarioDiario: 0.102667 },
  { desde: '2020-01-01', hasta: '2020-03-31', norma: 'R (MH) 598/2019', resarcitorioMensual: 3.6, resarcitorioDiario: 0.12, punitarioMensual: 4.41, punitarioDiario: 0.147 },
  { desde: '2019-10-01', hasta: '2019-12-31', norma: 'R (MH) 598/2019', resarcitorioMensual: 5.34, resarcitorioDiario: 0.178, punitarioMensual: 6.49, punitarioDiario: 0.216333 },
  { desde: '2019-08-01', hasta: '2019-09-30', norma: 'R (MH) 598/2019', resarcitorioMensual: 4.73, resarcitorioDiario: 0.157667, punitarioMensual: 5.76, punitarioDiario: 0.192 },
  { desde: '2019-07-01', hasta: '2019-07-31', norma: 'R (MH) 50/2019', resarcitorioMensual: 4.73, resarcitorioDiario: 0.157667, punitarioMensual: 5.76, punitarioDiario: 0.192 },
  { desde: '2019-04-01', hasta: '2019-06-30', norma: 'R (MH) 50/2019', resarcitorioMensual: 3.76, resarcitorioDiario: 0.125333, punitarioMensual: 4.61, punitarioDiario: 0.153667 },
  { desde: '2019-03-01', hasta: '2019-03-31', norma: 'R (MH) 50/2019', resarcitorioMensual: 4.5, resarcitorioDiario: 0.15, punitarioMensual: 5.6, punitarioDiario: 0.186667 },
  { desde: '2011-01-01', hasta: '2019-02-28', norma: 'R (MEyFP) 841/2010', resarcitorioMensual: 3, resarcitorioDiario: 0.1, punitarioMensual: 4, punitarioDiario: 0.133333 },
  { desde: '2006-07-01', hasta: '2010-12-31', norma: 'R (MEyOSP) 492/2006', resarcitorioMensual: 2, resarcitorioDiario: 0.066667, punitarioMensual: 3, punitarioDiario: 0.1 },
  { desde: '2004-09-01', hasta: '2006-06-30', norma: 'R (MEyOSP) 578/2004', resarcitorioMensual: 1.5, resarcitorioDiario: 0.05, punitarioMensual: 2.5, punitarioDiario: 0.083333 },
];

interface CalculationDetail {
  desde: string;
  hasta: string;
  dias: number;
  tasaDiaria: number;
  interes: number;
}

interface CalculationResult {
  fechaInicio: string;
  fechaPago: string;
  importe: number;
  diasTotales: number;
  interesResarcitorio: number;
  interesPunitorio: number;
  interesTotal: number;
  totalAPagar: number;
  detalleResarcitorio: CalculationDetail[];
  detallePunitorio: CalculationDetail[];
}

export function InterestCalculator() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [importe, setImporte] = useState<number>(0);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Find applicable rate for a date
  const findRate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return TASAS_INTERES.find(t => dateStr >= t.desde && dateStr <= t.hasta);
  };

  // Calculate interests
  const calculateInterests = () => {
    if (!fechaInicio || !fechaPago || !importe || importe <= 0) {
      toast.error('Complete todos los campos');
      return;
    }

    const inicio = new Date(fechaInicio);
    const pago = new Date(fechaPago);

    if (pago <= inicio) {
      toast.error('La fecha de pago debe ser posterior a la fecha de inicio');
      return;
    }

    let interesResarcitorio = 0;
    let interesPunitorio = 0;
    const detalleResarcitorio: CalculationDetail[] = [];
    const detallePunitorio: CalculationDetail[] = [];

    let currentDate = new Date(inicio);
    let currentRate = findRate(currentDate);
    let periodStart = new Date(currentDate);

    while (currentDate < pago) {
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const nextRate = findRate(nextDay);
      
      // If rate changes or we reach the end
      if (!nextRate || nextRate.desde !== currentRate?.desde || nextDay >= pago) {
        const periodEnd = nextDay >= pago ? pago : currentDate;
        const dias = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
        
        if (currentRate && dias > 0) {
          const interesResPeriodo = importe * (currentRate.resarcitorioDiario / 100) * dias;
          const interesPunPeriodo = importe * (currentRate.punitarioDiario / 100) * dias;
          
          interesResarcitorio += interesResPeriodo;
          interesPunitorio += interesPunPeriodo;
          
          detalleResarcitorio.push({
            desde: periodStart.toLocaleDateString('es-AR'),
            hasta: periodEnd.toLocaleDateString('es-AR'),
            dias,
            tasaDiaria: currentRate.resarcitorioDiario,
            interes: interesResPeriodo,
          });
          
          detallePunitorio.push({
            desde: periodStart.toLocaleDateString('es-AR'),
            hasta: periodEnd.toLocaleDateString('es-AR'),
            dias,
            tasaDiaria: currentRate.punitarioDiario,
            interes: interesPunPeriodo,
          });
        }
        
        if (nextDay < pago) {
          periodStart = new Date(nextDay);
          currentRate = nextRate;
        }
      }
      
      currentDate = nextDay;
    }

    const diasTotales = Math.ceil((pago.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    const interesTotal = interesResarcitorio + interesPunitorio;

    setResult({
      fechaInicio,
      fechaPago,
      importe,
      diasTotales,
      interesResarcitorio,
      interesPunitorio,
      interesTotal,
      totalAPagar: importe + interesTotal,
      detalleResarcitorio,
      detallePunitorio,
    });

    toast.success('Cálculo realizado');
  };

  // Clear form
  const clearForm = () => {
    setFechaInicio('');
    setFechaPago('');
    setImporte(0);
    setResult(null);
    setShowDetail(false);
  };

  // Print result
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cálculo de Intereses - AUTOBUS S.A.</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
              color: #1f2937;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .header h1 {
              color: #16a34a;
              font-size: 24px;
              margin-bottom: 5px;
            }
            .header p {
              color: #6b7280;
              font-size: 14px;
            }
            .company {
              background: #f0fdf4;
              border: 1px solid #16a34a;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 20px;
              text-align: center;
            }
            .company h2 {
              color: #16a34a;
              font-size: 18px;
              margin-bottom: 5px;
            }
            .section {
              margin-bottom: 20px;
            }
            .section h3 {
              font-size: 14px;
              color: #374151;
              margin-bottom: 10px;
              padding-bottom: 5px;
              border-bottom: 1px solid #e5e7eb;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }
            .grid-item {
              background: #f9fafb;
              padding: 10px;
              border-radius: 6px;
            }
            .grid-item label {
              font-size: 11px;
              color: #6b7280;
              text-transform: uppercase;
            }
            .grid-item .value {
              font-size: 16px;
              font-weight: 600;
              color: #1f2937;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            th, td {
              padding: 8px;
              text-align: left;
              border: 1px solid #e5e7eb;
              font-size: 12px;
            }
            th {
              background: #f3f4f6;
              font-weight: 600;
            }
            .total-row {
              background: #1f2937;
              color: white;
              font-weight: 700;
            }
            .highlight {
              background: #16a34a;
              color: white;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              margin-top: 20px;
            }
            .highlight label {
              font-size: 12px;
              opacity: 0.9;
            }
            .highlight .value {
              font-size: 24px;
              font-weight: 700;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #9ca3af;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Cálculo de Intereses Punitorios</h1>
            <p>Según tasas ARCA (ex-AFIP)</p>
          </div>
          
          <div class="company">
            <h2>AUTOBUS S.A.</h2>
            <p>CUIT: 30-12345678-9</p>
          </div>

          <div class="section">
            <h3>Datos del Cálculo</h3>
            <div class="grid">
              <div class="grid-item">
                <label>Fecha de Inicio</label>
                <div class="value">${result ? new Date(result.fechaInicio).toLocaleDateString('es-AR') : ''}</div>
              </div>
              <div class="grid-item">
                <label>Fecha de Pago</label>
                <div class="value">${result ? new Date(result.fechaPago).toLocaleDateString('es-AR') : ''}</div>
              </div>
              <div class="grid-item">
                <label>Importe de la Demanda</label>
                <div class="value">$ ${result ? formatNumber(result.importe) : '0.00'}</div>
              </div>
              <div class="grid-item">
                <label>Días Transcurridos</label>
                <div class="value">${result?.diasTotales || 0} días</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Resultados</h3>
            <table>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th style="text-align: right;">Importe</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Capital</td>
                  <td style="text-align: right;">$ ${result ? formatNumber(result.importe) : '0.00'}</td>
                </tr>
                <tr>
                  <td>Interés Resarcitorio</td>
                  <td style="text-align: right;">$ ${result ? formatNumber(result.interesResarcitorio) : '0.00'}</td>
                </tr>
                <tr>
                  <td>Interés Punitorio</td>
                  <td style="text-align: right;">$ ${result ? formatNumber(result.interesPunitorio) : '0.00'}</td>
                </tr>
                <tr class="total-row">
                  <td><strong>TOTAL A PAGAR</strong></td>
                  <td style="text-align: right;"><strong>$ ${result ? formatNumber(result.totalAPagar) : '0.00'}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="highlight">
            <label>Total a Pagar</label>
            <div class="value">$ ${result ? formatNumber(result.totalAPagar) : '0.00'}</div>
          </div>

          <div class="footer">
            Documento generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}
            <br>AUTOBUS S.A. - Sistema de Gestión de Operaciones
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Percent className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg">Calculadora de Intereses ARCA</CardTitle>
              <p className="text-sm text-muted-foreground">Cálculo de intereses resarcitorios y punitorios</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Datos del Cálculo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Fecha de Inicio Demanda
                </Label>
                <Input 
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Fecha de Pago
                </Label>
                <Input 
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-3 h-3" />
                Importe de la Demanda
              </Label>
              <Input 
                type="number"
                value={importe || ''}
                onChange={(e) => setImporte(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={calculateInterests} className="gap-2">
                <Calculator className="w-4 h-4" />
                Calcular
              </Button>
              <Button variant="secondary" onClick={clearForm} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card ref={printRef}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Resultado</CardTitle>
              {result && (
                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                  <Printer className="w-4 h-4" />
                  Imprimir
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Días Transcurridos</p>
                    <p className="text-lg font-bold">{result.diasTotales}</p>
                  </Card>
                  <Card className="p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Capital</p>
                    <p className="text-lg font-bold">$ {formatNumber(result.importe)}</p>
                  </Card>
                </div>

                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Capital</TableCell>
                        <TableCell className="text-right">$ {formatNumber(result.importe)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            Interés Resarcitorio
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5"
                              onClick={() => setShowDetail(!showDetail)}
                            >
                              <Info className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-warning">$ {formatNumber(result.interesResarcitorio)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Interés Punitorio</TableCell>
                        <TableCell className="text-right text-destructive">$ {formatNumber(result.interesPunitorio)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <Card className="p-4 bg-success/10 border-success/30">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total a Pagar</span>
                    <span className="text-2xl font-bold text-success">$ {formatNumber(result.totalAPagar)}</span>
                  </div>
                </Card>

                {showDetail && result.detalleResarcitorio.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Detalle por Período</p>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Desde</TableHead>
                            <TableHead>Hasta</TableHead>
                            <TableHead className="text-right">Días</TableHead>
                            <TableHead className="text-right">Tasa %</TableHead>
                            <TableHead className="text-right">Interés Res.</TableHead>
                            <TableHead className="text-right">Interés Pun.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.detalleResarcitorio.map((det, idx) => (
                            <TableRow key={idx} className="table-stripe">
                              <TableCell className="text-xs">{det.desde}</TableCell>
                              <TableCell className="text-xs">{det.hasta}</TableCell>
                              <TableCell className="text-right">{det.dias}</TableCell>
                              <TableCell className="text-right">{det.tasaDiaria}%</TableCell>
                              <TableCell className="text-right">$ {formatNumber(det.interes)}</TableCell>
                              <TableCell className="text-right">$ {formatNumber(result.detallePunitorio[idx]?.interes || 0)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Ingrese los datos para calcular los intereses</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" />
            Evolución de Tasas de Interés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead rowSpan={2}></TableHead>
                  <TableHead rowSpan={2}>Desde</TableHead>
                  <TableHead rowSpan={2}>Hasta</TableHead>
                  <TableHead rowSpan={2}>Norma</TableHead>
                  <TableHead colSpan={2} className="text-center border-l">Resarcitorios</TableHead>
                  <TableHead colSpan={2} className="text-center border-l">Punitorios</TableHead>
                </TableRow>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-right border-l">% Mensual</TableHead>
                  <TableHead className="text-right">% Diario</TableHead>
                  <TableHead className="text-right border-l">% Mensual</TableHead>
                  <TableHead className="text-right">% Diario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={8} className="bg-primary/10 font-medium">Régimen Actual</TableCell>
                </TableRow>
                {TASAS_INTERES.slice(0, 15).map((tasa, idx) => (
                  <TableRow key={idx} className="table-stripe">
                    <TableCell></TableCell>
                    <TableCell className="text-xs">{new Date(tasa.desde).toLocaleDateString('es-AR')}</TableCell>
                    <TableCell className="text-xs">{tasa.hasta === '2999-12-31' ? '—' : new Date(tasa.hasta).toLocaleDateString('es-AR')}</TableCell>
                    <TableCell className="text-xs">{tasa.norma}</TableCell>
                    <TableCell className="text-right border-l">{tasa.resarcitorioMensual}</TableCell>
                    <TableCell className="text-right">{tasa.resarcitorioDiario}</TableCell>
                    <TableCell className="text-right border-l">{tasa.punitarioMensual}</TableCell>
                    <TableCell className="text-right">{tasa.punitarioDiario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
