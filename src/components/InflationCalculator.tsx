import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Download, ArrowUpDown, Info } from 'lucide-react';
import { formatNumber } from '@/lib/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

// Datos de inflación mensual del IPC INDEC (formato: año-mes -> inflación %)
// Fuente: INDEC (2017+), MIT Sloan Research Paper (pre-2017)
const INFLATION_DATA: Record<string, number> = {
  "2017m1": 1.585, "2017m2": 2.067, "2017m3": 2.314, "2017m4": 2.733, "2017m5": 1.376, "2017m6": 1.176,
  "2017m7": 1.789, "2017m8": 1.406, "2017m9": 1.906, "2017m10": 1.531, "2017m11": 1.34, "2017m12": 3.14,
  "2018m1": 1.763, "2018m2": 2.441, "2018m3": 2.306, "2018m4": 2.78, "2018m5": 2.047, "2018m6": 3.725,
  "2018m7": 3.108, "2018m8": 3.885, "2018m9": 6.512, "2018m10": 5.387, "2018m11": 3.159, "2018m12": 2.617,
  "2019m1": 2.876, "2019m2": 3.797, "2019m3": 4.675, "2019m4": 3.447, "2019m5": 3.05, "2019m6": 2.687,
  "2019m7": 2.217, "2019m8": 3.948, "2019m9": 5.885, "2019m10": 3.311, "2019m11": 4.235, "2019m12": 3.734,
  "2020m1": 2.258, "2020m2": 2.036, "2020m3": 3.348, "2020m4": 1.473, "2020m5": 1.548, "2020m6": 2.255,
  "2020m7": 1.925, "2020m8": 2.712, "2020m9": 2.818, "2020m10": 3.78, "2020m11": 3.142, "2020m12": 4.016,
  "2021m1": 4.042, "2021m2": 3.587, "2021m3": 4.809, "2021m4": 4.084, "2021m5": 3.306, "2021m6": 3.179,
  "2021m7": 2.998, "2021m8": 2.469, "2021m9": 3.546, "2021m10": 3.518, "2021m11": 2.522, "2021m12": 3.851,
  "2022m1": 3.863, "2022m2": 4.694, "2022m3": 6.742, "2022m4": 6.035, "2022m5": 5.05, "2022m6": 5.295,
  "2022m7": 7.406, "2022m8": 6.97, "2022m9": 6.166, "2022m10": 6.347, "2022m11": 4.916, "2022m12": 5.125,
  "2023m1": 6.028, "2023m2": 6.628, "2023m3": 7.675, "2023m4": 8.403, "2023m5": 7.773, "2023m6": 5.951,
  "2023m7": 6.345, "2023m8": 12.442, "2023m9": 12.75, "2023m10": 8.302, "2023m11": 12.811, "2023m12": 25.465,
  "2024m1": 20.615, "2024m2": 13.241, "2024m3": 11.01, "2024m4": 8.833, "2024m5": 4.176, "2024m6": 4.577,
  "2024m7": 4.031, "2024m8": 4.172, "2024m9": 3.469, "2024m10": 2.692, "2024m11": 2.427, "2024m12": 2.704,
  "2025m1": 2.211, "2025m2": 2.402, "2025m3": 3.729, "2025m4": 2.781, "2025m5": 1.501, "2025m6": 1.619,
  "2025m7": 1.902, "2025m8": 1.876, "2025m9": 2.076, "2025m10": 2.342, "2025m11": 2.473,
};

const MONTHS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

// Obtener años disponibles de los datos
const getAvailableYears = () => {
  const years = new Set<number>();
  Object.keys(INFLATION_DATA).forEach(key => {
    const year = parseInt(key.split('m')[0]);
    years.add(year);
  });
  return Array.from(years).sort((a, b) => a - b);
};

const YEARS = getAvailableYears();

export function InflationCalculator() {
  const [amount, setAmount] = useState<string>('1000000');
  const [fromMonth, setFromMonth] = useState<string>('1');
  const [fromYear, setFromYear] = useState<string>('2024');
  const [toMonth, setToMonth] = useState<string>('12');
  const [toYear, setToYear] = useState<string>('2025');

  const result = useMemo(() => {
    const amountValue = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
    if (amountValue <= 0) return null;

    const startYear = parseInt(fromYear);
    const startMonth = parseInt(fromMonth);
    const endYear = parseInt(toYear);
    const endMonth = parseInt(toMonth);

    // Validar que fecha inicio sea anterior a fecha fin
    if (startYear > endYear || (startYear === endYear && startMonth >= endMonth)) {
      return null;
    }

    // Calcular inflación acumulada
    let accumulatedMultiplier = 1;
    const monthlyData: Array<{ period: string; inflation: number; accumulated: number }> = [];

    let currentYear = startYear;
    let currentMonth = startMonth;

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      const key = `${currentYear}m${currentMonth}`;
      const monthlyInflation = INFLATION_DATA[key];

      if (monthlyInflation !== undefined) {
        accumulatedMultiplier *= (1 + monthlyInflation / 100);
        
        const monthLabel = MONTHS.find(m => m.value === String(currentMonth))?.label || '';
        monthlyData.push({
          period: `${monthLabel} ${currentYear}`,
          inflation: monthlyInflation,
          accumulated: (accumulatedMultiplier - 1) * 100,
        });
      }

      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    if (monthlyData.length === 0) return null;

    const totalInflation = (accumulatedMultiplier - 1) * 100;
    const adjustedAmount = amountValue * accumulatedMultiplier;
    const months = monthlyData.length;
    
    // Calcular promedio mensual (geométrico)
    const avgMonthly = (Math.pow(accumulatedMultiplier, 1 / months) - 1) * 100;
    
    // Calcular tasa anualizada
    const annualized = (Math.pow(accumulatedMultiplier, 12 / months) - 1) * 100;

    return {
      originalAmount: amountValue,
      adjustedAmount,
      totalInflation,
      avgMonthly,
      annualized,
      months,
      monthlyData,
    };
  }, [amount, fromMonth, fromYear, toMonth, toYear]);

  const handleSwapDates = () => {
    setFromMonth(toMonth);
    setFromYear(toYear);
    setToMonth(fromMonth);
    setToYear(fromYear);
  };

  const generatePDF = () => {
    if (!result) {
      toast.error('No hay resultado para exportar');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('AUTOBUS S.A.', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Calculadora de Inflación', pageWidth / 2, 28, { align: 'center' });

    // Fecha de generación
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, pageWidth / 2, 35, { align: 'center' });

    // Información del cálculo
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen del Cálculo', 14, 55);

    const fromLabel = `${MONTHS.find(m => m.value === fromMonth)?.label} ${fromYear}`;
    const toLabel = `${MONTHS.find(m => m.value === toMonth)?.label} ${toYear}`;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const summaryData = [
      ['Monto Original', `$ ${formatNumber(result.originalAmount)}`],
      ['Período', `${fromLabel} a ${toLabel}`],
      ['Meses Calculados', `${result.months}`],
      ['Inflación Total', `${formatNumber(result.totalInflation)}%`],
      ['Inflación Promedio Mensual', `${formatNumber(result.avgMonthly)}%`],
      ['Inflación Anualizada', `${formatNumber(result.annualized)}%`],
      ['Monto Ajustado', `$ ${formatNumber(result.adjustedAmount)}`],
    ];

    autoTable(doc, {
      startY: 60,
      head: [],
      body: summaryData,
      theme: 'plain',
      styles: {
        fontSize: 11,
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { halign: 'right' },
      },
    });

    // Tabla de detalle mensual
    const tableStartY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle Mensual', 14, tableStartY);

    autoTable(doc, {
      startY: tableStartY + 5,
      head: [['Período', 'Inflación Mensual', 'Inflación Acumulada']],
      body: result.monthlyData.map(row => [
        row.period,
        `${formatNumber(row.inflation)}%`,
        `${formatNumber(row.accumulated)}%`,
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
    });

    // Footer con fuente
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Fuente: IPC INDEC (2017+), MIT Sloan Research Paper No. 4975-12 (pre-2017)', 14, finalY);
    doc.text('Las fechas se interpretan como el primero del mes.', 14, finalY + 5);

    // Guardar
    const fileName = `Inflacion_${fromLabel.replace(' ', '')}_${toLabel.replace(' ', '')}.pdf`;
    doc.save(fileName);
    toast.success('PDF generado correctamente');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Calculadora de Inflación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto en Pesos (ARS)</Label>
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.,]/g, '');
                setAmount(value);
              }}
              placeholder="1.000.000"
            />
          </div>

          {/* Período */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            {/* Desde */}
            <div className="space-y-2">
              <Label>Desde</Label>
              <div className="flex gap-2">
                <Select value={fromMonth} onValueChange={setFromMonth}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={fromYear} onValueChange={setFromYear}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(year => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Swap button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwapDates}
              className="mb-0.5"
              title="Intercambiar fechas"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>

            {/* Hasta */}
            <div className="space-y-2">
              <Label>Hasta</Label>
              <div className="flex gap-2">
                <Select value={toMonth} onValueChange={setToMonth}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={toYear} onValueChange={setToYear}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(year => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Resultado */}
          {result && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  $ {formatNumber(result.originalAmount)} en {MONTHS.find(m => m.value === fromMonth)?.label} {fromYear}
                </p>
                <p className="text-sm text-muted-foreground">equivale aproximadamente a</p>
                <p className="text-3xl font-bold text-primary">
                  $ {formatNumber(result.adjustedAmount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  en {MONTHS.find(m => m.value === toMonth)?.label} {toYear}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-foreground">
                    {formatNumber(result.totalInflation)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Inflación Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-foreground">
                    {formatNumber(result.avgMonthly)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Promedio Mensual</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-foreground">
                    {formatNumber(result.annualized)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Anualizado</p>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button onClick={generatePDF} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </div>
          )}

          {!result && amount && (
            <div className="mt-6 p-4 bg-destructive/10 rounded-lg border border-destructive/20 text-center">
              <p className="text-sm text-destructive">
                Seleccione un período válido (la fecha "Desde" debe ser anterior a "Hasta")
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fuente de datos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            Fuente de Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            El ajuste de precios se realiza usando el <strong>Índice de Precios al Consumidor (IPC)</strong>.
          </p>
          <p>
            Los datos de inflación posteriores a 2017 son extraídos del{' '}
            <a 
              href="http://www.indec.gob.ar/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              INDEC
            </a>.
          </p>
          <p>
            Los datos anteriores fueron extraídos del trabajo{' '}
            <em>"Online and official price indexes: Measuring Argentina's inflation"</em>{' '}
            (MIT Sloan Research Paper No. 4975-12).
          </p>
          <p className="text-xs pt-2 border-t border-border mt-4">
            Las fechas se interpretan como el primero del mes. Por ejemplo, "Enero 2024" se interpreta como "1 de Enero de 2024".
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
