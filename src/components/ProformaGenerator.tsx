import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LineItem {
  id: string;
  cantidad: number;
  descripcion: string;
  precioUnitario: number;
}

type Currency = 'USD' | 'ARS';

const numberToWords = (num: number, currency: Currency): string => {
  const ones = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
    'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
  const tens = ['', '', 'veinti', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  
  const currencyName = currency === 'USD' ? 'Dólares' : 'Pesos';
  
  if (num === 0) return `${currencyName} cero`;
  
  const integer = Math.floor(num);
  const decimal = Math.round((num - integer) * 100);
  
  let result = '';
  
  if (integer >= 1000000) {
    const millions = Math.floor(integer / 1000000);
    result += millions === 1 ? 'un millón ' : `${numberToWordsHelper(millions)} millones `;
  }
  
  const thousands = Math.floor((integer % 1000000) / 1000);
  if (thousands > 0) {
    result += thousands === 1 ? 'mil ' : `${numberToWordsHelper(thousands)} mil `;
  }
  
  const remainder = integer % 1000;
  if (remainder > 0) {
    result += numberToWordsHelper(remainder);
  }
  
  return `son ${currencyName} ${result.trim()} con ${decimal}/100`;
  
  function numberToWordsHelper(n: number): string {
    if (n <= 20) return ones[n];
    if (n < 30) return `veinti${ones[n - 20]}`;
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return one === 0 ? tens[ten] : `${tens[ten]} y ${ones[one]}`;
    }
    if (n === 100) return 'cien';
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return rest === 0 ? hundreds[hundred] : `${hundreds[hundred]} ${numberToWordsHelper(rest)}`;
  }
};

export function ProformaGenerator() {
  const [cliente, setCliente] = useState({ senores: '', cuit: '', domicilio: '' });
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), cantidad: 1, descripcion: '', precioUnitario: 0 }
  ]);
  const [ivaRate, setIvaRate] = useState(10.5);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [formaPago, setFormaPago] = useState('A convenir');
  const [plazoEntrega, setPlazoEntrega] = useState('A convenir');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), cantidad: 1, descripcion: '', precioUnitario: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calcularSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
  };

  const calcularIVA = () => {
    return calcularSubtotal() * (ivaRate / 100);
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularIVA();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(value);
  };

  const generarPDF = async () => {
    if (!cliente.senores.trim()) {
      toast.error('Debe completar el campo Señor/es');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Cargar imágenes
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      // Cargar imagen de firma
      const firmaImg = await loadImage('/logos/jose-viegas-firma.png');
      
      // Header logos y datos empresa
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Mercedes-Benz', 15, 20);
      
      // Firma en encabezado (lado derecho)
      doc.addImage(firmaImg, 'PNG', pageWidth - 55, 8, 40, 25);
      
      doc.setFontSize(10);
      doc.text(`FECHA: ${new Date(fecha).toLocaleDateString('es-AR')}`, pageWidth - 55, 38);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('AUTOBUS SA', 15, 35);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Concesionario Oficial Mercedes Benz', 15, 41);
      doc.text('Av. Juan B. Alberdi 7334 - C.A.B.A.', 15, 46);
      doc.text('CUIT: 30-63148185-6   IVA Responsable Inscripto', 15, 51);
      
      // Datos cliente
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Señor/es: ${cliente.senores}`, 15, 65);
      doc.setFont('helvetica', 'normal');
      doc.text(`CUIT: ${cliente.cuit}`, 15, 71);
      doc.text(`Domicilio: ${cliente.domicilio}`, 15, 77);
      
      // Tabla de items
      const tableData = items.map(item => {
        const importeSinIva = item.cantidad * item.precioUnitario;
        const importeConIva = importeSinIva * (1 + ivaRate / 100);
        return [
          item.cantidad.toString(),
          item.descripcion,
          formatCurrency(item.precioUnitario),
          formatCurrency(importeSinIva),
          formatCurrency(importeConIva)
        ];
      });

      autoTable(doc, {
        startY: 85,
        head: [['Cantidad', 'Descripción', 'P.UNIT S./IVA', 'IMPORTE S./IVA', 'IMPORTE C./IVA']],
        body: tableData,
        headStyles: { 
          fillColor: [200, 200, 200], 
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 },
          1: { cellWidth: 80 },
          2: { halign: 'right', cellWidth: 25 },
          3: { halign: 'right', cellWidth: 30 },
          4: { halign: 'right', cellWidth: 30 }
        },
        margin: { left: 15, right: 15 }
      });

      // Totales
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFontSize(10);
      doc.text(`sub-total s/iva: ${formatCurrency(calcularSubtotal())}`, pageWidth - 15, finalY, { align: 'right' });
      doc.text(`iva ${ivaRate.toFixed(2)}%: ${formatCurrency(calcularIVA())}`, pageWidth - 15, finalY + 6, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(`total: ${formatCurrency(calcularTotal())}`, pageWidth - 15, finalY + 12, { align: 'right' });
      
      // Monto en letras
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const montoEnLetras = numberToWords(calcularTotal(), currency);
      doc.text(montoEnLetras, 15, finalY + 25);
      
      // Forma de pago y plazo
      doc.text(`Forma de pago: ${formaPago}`, 15, finalY + 35);
      doc.text(`Plazo de entrega: ${plazoEntrega}`, 15, finalY + 41);
      
      // Pie - leyenda
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const leyenda = currency === 'USD' 
        ? 'Cotización Sujeta a modificaciones lista Precios MERCEDES BENZ y/o valor dólar.'
        : 'Cotización Sujeta a modificaciones lista Precios MERCEDES BENZ.';
      doc.text(leyenda, 15, finalY + 55);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('COTIZACIÓN SIN VALOR FISCAL', pageWidth / 2, finalY + 65, { align: 'center' });
      
      // Firma en pie de página (lado derecho)
      doc.addImage(firmaImg, 'PNG', pageWidth - 55, pageHeight - 40, 40, 25);
      
      // Guardar PDF
      const fileName = `PROFORMA_${cliente.senores.replace(/\s+/g, '_').substring(0, 20)}_${fecha}.pdf`;
      doc.save(fileName);
      toast.success('PDF generado correctamente');
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border card-shadow animate-slide-up">
      <div className="border-b border-border p-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generador de Proforma / Cotización
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete los datos y genere el PDF de la cotización
        </p>
      </div>

      <CardContent className="p-4 space-y-6">
        {/* Fecha y Moneda */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input 
              id="fecha" 
              type="date" 
              value={fecha} 
              onChange={(e) => setFecha(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">Dólares (USD)</SelectItem>
                <SelectItem value="ARS">Pesos (ARS)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ivaRate">Alícuota IVA (%)</Label>
            <Input 
              id="ivaRate" 
              type="number" 
              step="0.5"
              min="0"
              max="100"
              value={ivaRate} 
              onChange={(e) => setIvaRate(parseFloat(e.target.value) || 0)} 
            />
          </div>
        </div>

        {/* Datos Cliente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Datos del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senores">Señor/es *</Label>
              <Input 
                id="senores" 
                placeholder="Nombre o Razón Social"
                value={cliente.senores} 
                onChange={(e) => setCliente({...cliente, senores: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cuit">CUIT</Label>
                <Input 
                  id="cuit" 
                  placeholder="XX-XXXXXXXX-X"
                  value={cliente.cuit} 
                  onChange={(e) => setCliente({...cliente, cuit: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domicilio">Domicilio</Label>
                <Input 
                  id="domicilio" 
                  placeholder="Dirección completa"
                  value={cliente.domicilio} 
                  onChange={(e) => setCliente({...cliente, domicilio: e.target.value})} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Items de la Cotización</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Agregar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="p-3 bg-muted/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                  {items.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeItem(item.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Cantidad</Label>
                    <Input 
                      type="number" 
                      min="1"
                      value={item.cantidad} 
                      onChange={(e) => updateItem(item.id, 'cantidad', parseInt(e.target.value) || 1)} 
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Descripción</Label>
                    <Textarea 
                      placeholder="Descripción del producto o servicio..."
                      value={item.descripcion} 
                      onChange={(e) => updateItem(item.id, 'descripcion', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Precio Unit. s/IVA ({currency})</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={item.precioUnitario} 
                      onChange={(e) => updateItem(item.id, 'precioUnitario', parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Forma de Pago y Plazo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="formaPago">Forma de Pago</Label>
            <Input 
              id="formaPago" 
              value={formaPago} 
              onChange={(e) => setFormaPago(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plazoEntrega">Plazo de Entrega</Label>
            <Input 
              id="plazoEntrega" 
              value={plazoEntrega} 
              onChange={(e) => setPlazoEntrega(e.target.value)} 
            />
          </div>
        </div>

        {/* Resumen y Totales */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1 text-sm">
                <p className="flex justify-between gap-8">
                  <span className="text-muted-foreground">Subtotal s/IVA:</span>
                  <span className="font-medium tabular-nums">{currency} {formatCurrency(calcularSubtotal())}</span>
                </p>
                <p className="flex justify-between gap-8">
                  <span className="text-muted-foreground">IVA ({ivaRate}%):</span>
                  <span className="font-medium tabular-nums">{currency} {formatCurrency(calcularIVA())}</span>
                </p>
                <p className="flex justify-between gap-8 text-base font-semibold">
                  <span>Total c/IVA:</span>
                  <span className="text-primary tabular-nums">{currency} {formatCurrency(calcularTotal())}</span>
                </p>
              </div>
              <Button onClick={generarPDF} size="lg" className="gap-2">
                <FileText className="w-5 h-5" />
                Generar PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </div>
  );
}
