import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, FileText, Copy, Check, Mail, MessageCircle, Send, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { exportPurchaseRequestToPDF, generatePurchaseRequestPDFBase64 } from '@/lib/exportUtils';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Additional {
  id: string;
  concept: string;
  amount: number;
}

interface UsedUnit {
  id: string;
  brand: string;
  model: string;
  year: string;
  domain: string;
  internalNumber: string;
  bodywork: string;
  value: number;
}

interface BuyerData {
  name: string;
  address: string;
  locality: string;
  postalCode: string;
  email: string;
  phone: string;
  idType: string;
  idNumber: string;
  ivaCondition: string;
}

interface UnitData {
  quantity: number;
  brand: string;
  model: string;
  bodywork: string;
  type: string;
  year: string;
  condition: '0km' | 'usado';
}

interface PriceData {
  priceUSD: number;
  dollarReference: number;
  priceARS: number;
}

export function PurchaseRequestForm() {
  const [requestNumber] = useState(() => `SC-${Date.now().toString().slice(-6)}`);
  
  const [buyer, setBuyer] = useState<BuyerData>({
    name: '',
    address: '',
    locality: '',
    postalCode: '',
    email: '',
    phone: '',
    idType: 'DNI',
    idNumber: '',
    ivaCondition: '',
  });

  const [unit, setUnit] = useState<UnitData>({
    quantity: 1,
    brand: 'Mercedes-Benz',
    model: '',
    bodywork: '',
    type: '',
    year: new Date().getFullYear().toString(),
    condition: '0km',
  });

  const [price, setPrice] = useState<PriceData>({
    priceUSD: 0,
    dollarReference: 0,
    priceARS: 0,
  });

  const [additionals, setAdditionals] = useState<Additional[]>([]);
  const [usedUnits, setUsedUnits] = useState<UsedUnit[]>([]);
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [observations, setObservations] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');

  // Calculations
  const totalAdditionals = additionals.reduce((sum, a) => sum + (a.amount || 0), 0);
  const subtotalRequest = price.priceUSD + totalAdditionals;
  const totalUsed = usedUnits.reduce((sum, u) => sum + (u.value || 0), 0);
  const finalBalance = subtotalRequest - totalUsed;

  const addAdditional = () => {
    setAdditionals([...additionals, { id: crypto.randomUUID(), concept: '', amount: 0 }]);
  };

  const removeAdditional = (id: string) => {
    setAdditionals(additionals.filter(a => a.id !== id));
  };

  const updateAdditional = (id: string, field: keyof Additional, value: string | number) => {
    setAdditionals(additionals.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const addUsedUnit = () => {
    setUsedUnits([...usedUnits, {
      id: crypto.randomUUID(),
      brand: '',
      model: '',
      year: '',
      domain: '',
      internalNumber: '',
      bodywork: '',
      value: 0,
    }]);
  };

  const removeUsedUnit = (id: string) => {
    setUsedUnits(usedUnits.filter(u => u.id !== id));
  };

  const updateUsedUnit = (id: string, field: keyof UsedUnit, value: string | number) => {
    setUsedUnits(usedUnits.map(u => 
      u.id === id ? { ...u, [field]: value } : u
    ));
  };

  const generateApprovalMessage = () => {
    const additionalsDetail = additionals.map(a => `${a.concept}: U$S ${a.amount}`).join(' | ') || 'Sin adicionales';
    const usedDetail = usedUnits.map(u => `${u.brand} ${u.model} ${u.year} (${u.domain})`).join(' | ') || 'Sin usados';
    
    return (
      `🔔 NUEVA SOLICITUD DE COMPRA N°: ${requestNumber}\n` +
      `👤 Cliente: ${buyer.name}\n` +
      `📋 ${buyer.idType}: ${buyer.idNumber}\n` +
      `🚌 Unidad: ${unit.quantity}x ${unit.brand} ${unit.model} ${unit.condition}\n` +
      `🏭 Carrocería: ${unit.bodywork || 'N/A'}\n` +
      `💵 Precio Unidad: U$S ${formatCurrency(price.priceUSD)}\n` +
      `➕ ADICIONALES: ${additionalsDetail}\n` +
      `🔄 USADOS: ${usedDetail}\n` +
      `💰 SALDO FINAL: U$S ${formatCurrency(finalBalance)}\n` +
      `📦 Entrega estimada: ${estimatedDelivery || 'A confirmar'}\n` +
      `💳 Forma de pago: ${paymentMethod || 'A confirmar'}\n` +
      `📝 Observaciones: ${observations || 'Sin observaciones'}`
    );
  };

  const generateEmailUrl = () => {
    const subject = encodeURIComponent(`Solicitud de Compra N° ${requestNumber} - ${buyer.name}`);
    const body = encodeURIComponent(generateApprovalMessage());
    return `mailto:${supervisorEmail}?subject=${subject}&body=${body}`;
  };

  const generateWhatsAppUrl = () => {
    const message = encodeURIComponent(generateApprovalMessage());
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      return `whatsapp://send?text=${message}`;
    }
    return `https://web.whatsapp.com/send?text=${message}`;
  };

  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(generateApprovalMessage());
      setCopied(true);
      toast({
        title: "Mensaje copiado",
        description: "Ahora podés pegarlo manualmente en WhatsApp",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar el mensaje al portapapeles",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportPurchaseRequestToPDF({
        requestNumber,
        buyer,
        unit,
        price,
        additionals: additionals.map(a => ({ concept: a.concept, amount: a.amount })),
        usedUnits: usedUnits.map(u => ({
          brand: u.brand,
          model: u.model,
          year: u.year,
          domain: u.domain,
          internalNumber: u.internalNumber,
          bodywork: u.bodywork,
          value: u.value,
        })),
        paymentMethod,
        estimatedDelivery,
        observations,
        totalAdditionals,
        totalUsed,
        finalBalance,
      });
      toast({
        title: "PDF generado",
        description: `Solicitud ${requestNumber} exportada correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
    }
  };

  const handleSendForApproval = async () => {
    // Validation
    if (!buyer.name.trim()) {
      toast({
        title: "Error",
        description: "Ingrese el nombre del comprador",
        variant: "destructive",
      });
      return;
    }

    if (!supervisorEmail.trim()) {
      toast({
        title: "Error",
        description: "Ingrese el email del supervisor para enviar la solicitud",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(supervisorEmail)) {
      toast({
        title: "Error",
        description: "Ingrese un email válido para el supervisor",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Save request to database
      const { data: savedRequest, error: saveError } = await supabase
        .from('purchase_requests')
        .insert({
          request_number: requestNumber,
          user_id: user?.id,
          buyer_name: buyer.name,
          buyer_address: buyer.address,
          buyer_locality: buyer.locality,
          buyer_postal_code: buyer.postalCode,
          buyer_email: buyer.email,
          buyer_phone: buyer.phone,
          buyer_id_type: buyer.idType,
          buyer_id_number: buyer.idNumber,
          buyer_iva_condition: buyer.ivaCondition,
          unit_quantity: unit.quantity,
          unit_brand: unit.brand,
          unit_model: unit.model,
          unit_bodywork: unit.bodywork,
          unit_type: unit.type,
          unit_year: unit.year,
          unit_condition: unit.condition,
          price_usd: price.priceUSD,
          dollar_reference: price.dollarReference,
          price_ars: price.priceARS,
          additionals: additionals.map(a => ({ concept: a.concept, amount: a.amount })),
          used_units: usedUnits.map(u => ({
            brand: u.brand,
            model: u.model,
            year: u.year,
            domain: u.domain,
            internalNumber: u.internalNumber,
            bodywork: u.bodywork,
            value: u.value,
          })),
          total_additionals: totalAdditionals,
          total_used: totalUsed,
          final_balance: finalBalance,
          payment_method: paymentMethod,
          estimated_delivery: estimatedDelivery || null,
          observations,
          supervisor_email: supervisorEmail,
          status: 'pending',
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving request:', saveError);
        throw new Error('No se pudo guardar la solicitud');
      }

      // 2. Generate PDF as base64
      const pdfBase64 = await generatePurchaseRequestPDFBase64({
        requestNumber,
        buyer,
        unit,
        price,
        additionals: additionals.map(a => ({ concept: a.concept, amount: a.amount })),
        usedUnits: usedUnits.map(u => ({
          brand: u.brand,
          model: u.model,
          year: u.year,
          domain: u.domain,
          internalNumber: u.internalNumber,
          bodywork: u.bodywork,
          value: u.value,
        })),
        paymentMethod,
        estimatedDelivery,
        observations,
        totalAdditionals,
        totalUsed,
        finalBalance,
      });

      // 3. Send email with PDF attachment via edge function
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-purchase-approval', {
        body: {
          requestId: savedRequest.id,
          pdfBase64,
          supervisorEmail,
        },
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        throw new Error('La solicitud se guardó pero no se pudo enviar el email');
      }

      toast({
        title: "✓ Solicitud enviada",
        description: `Se envió la solicitud N° ${requestNumber} a ${supervisorEmail} con el PDF adjunto. El supervisor podrá aprobar o rechazar desde el email.`,
      });

    } catch (error: any) {
      console.error('Error in handleSendForApproval:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/logos/mercedes-benz-logo.png" 
                alt="Mercedes-Benz" 
                className="h-12 object-contain"
              />
              <div>
                <CardTitle className="text-xl">SOLICITUD DE COMPRA</CardTitle>
                <p className="text-sm text-muted-foreground">AUTOBUS S.A.</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-primary">N° {requestNumber}</div>
              <p className="text-xs text-muted-foreground">Av. Juan B. Alberdi 7334</p>
              <p className="text-xs text-muted-foreground">CUIT: 30-63148185-6</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Buyer Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Datos del Comprador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="name">Nombre / Razón Social</Label>
              <Input 
                id="name" 
                value={buyer.name}
                onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                placeholder="Nombre completo o razón social"
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input 
                id="phone" 
                value={buyer.phone}
                onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                placeholder="Teléfono de contacto"
              />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="address">Domicilio</Label>
              <Input 
                id="address" 
                value={buyer.address}
                onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={buyer.email}
                onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="locality">Localidad</Label>
              <Input 
                id="locality" 
                value={buyer.locality}
                onChange={(e) => setBuyer({ ...buyer, locality: e.target.value })}
                placeholder="Ciudad"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input 
                id="postalCode" 
                value={buyer.postalCode}
                onChange={(e) => setBuyer({ ...buyer, postalCode: e.target.value })}
                placeholder="CP"
              />
            </div>
            <div>
              <Label htmlFor="ivaCondition">Condición IVA</Label>
              <Select 
                value={buyer.ivaCondition} 
                onValueChange={(v) => setBuyer({ ...buyer, ivaCondition: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="responsable_inscripto">Responsable Inscripto</SelectItem>
                  <SelectItem value="consumidor_final">Consumidor Final</SelectItem>
                  <SelectItem value="exento">Exento</SelectItem>
                  <SelectItem value="monotributo">Monotributo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="idType">Tipo ID</Label>
              <Select 
                value={buyer.idType} 
                onValueChange={(v) => setBuyer({ ...buyer, idType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="CUIT">CUIT</SelectItem>
                  <SelectItem value="LC">LC</SelectItem>
                  <SelectItem value="LE">LE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="idNumber">Número ID</Label>
              <Input 
                id="idNumber" 
                value={buyer.idNumber}
                onChange={(e) => setBuyer({ ...buyer, idNumber: e.target.value })}
                placeholder="Número de documento"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit to Acquire */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Unidad a Adquirir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <div>
              <Label htmlFor="quantity">Cantidad</Label>
              <Input 
                id="quantity" 
                type="number"
                min="1"
                value={unit.quantity}
                onChange={(e) => setUnit({ ...unit, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input 
                id="brand" 
                value={unit.brand}
                onChange={(e) => setUnit({ ...unit, brand: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input 
                id="model" 
                value={unit.model}
                onChange={(e) => setUnit({ ...unit, model: e.target.value })}
                placeholder="Ej: OF 1722/59"
              />
            </div>
            <div>
              <Label htmlFor="bodywork">Carrocería</Label>
              <Input 
                id="bodywork" 
                value={unit.bodywork}
                onChange={(e) => setUnit({ ...unit, bodywork: e.target.value })}
                placeholder="Ej: UGARTE"
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Input 
                id="type" 
                value={unit.type}
                onChange={(e) => setUnit({ ...unit, type: e.target.value })}
                placeholder="Ej: URBANO"
              />
            </div>
            <div>
              <Label htmlFor="year">Año</Label>
              <Input 
                id="year" 
                value={unit.year}
                onChange={(e) => setUnit({ ...unit, year: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="condition">Condición</Label>
              <Select 
                value={unit.condition} 
                onValueChange={(v: '0km' | 'usado') => setUnit({ ...unit, condition: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0km">0 Km</SelectItem>
                  <SelectItem value="usado">Usado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit Price */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Precio de la Unidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="priceUSD">P.U. en U$S</Label>
              <Input 
                id="priceUSD" 
                type="number"
                min="0"
                step="0.01"
                value={price.priceUSD || ''}
                onChange={(e) => setPrice({ ...price, priceUSD: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="dollarRef">Dólar Referencia MBA</Label>
              <Input 
                id="dollarRef" 
                type="number"
                min="0"
                step="0.01"
                value={price.dollarReference || ''}
                onChange={(e) => {
                  const dollarRef = parseFloat(e.target.value) || 0;
                  setPrice({ 
                    ...price, 
                    dollarReference: dollarRef,
                    priceARS: price.priceUSD * dollarRef
                  });
                }}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="priceARS">P.U. en $ (IVA Incluido)</Label>
              <Input 
                id="priceARS" 
                type="number"
                value={price.priceARS || ''}
                onChange={(e) => setPrice({ ...price, priceARS: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additionals */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Adicionales</CardTitle>
            <Button variant="outline" size="sm" onClick={addAdditional}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {additionals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay adicionales. Haga clic en "Agregar" para incluir conceptos adicionales.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="w-40">Monto U$S</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {additionals.map((additional) => (
                  <TableRow key={additional.id}>
                    <TableCell>
                      <Input 
                        value={additional.concept}
                        onChange={(e) => updateAdditional(additional.id, 'concept', e.target.value)}
                        placeholder="Descripción del concepto"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={additional.amount || ''}
                        onChange={(e) => updateAdditional(additional.id, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeAdditional(additional.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Used Units */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Entrega de Unidades Usadas</CardTitle>
            <Button variant="outline" size="sm" onClick={addUsedUnit}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {usedUnits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay unidades usadas. Haga clic en "Agregar" para incluir unidades como parte de pago.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Año</TableHead>
                    <TableHead>Dominio</TableHead>
                    <TableHead>Nro Interno</TableHead>
                    <TableHead>Carrocería</TableHead>
                    <TableHead className="w-32">Valor U$S</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usedUnits.map((usedUnit) => (
                    <TableRow key={usedUnit.id}>
                      <TableCell>
                        <Input 
                          value={usedUnit.brand}
                          onChange={(e) => updateUsedUnit(usedUnit.id, 'brand', e.target.value)}
                          placeholder="Marca"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={usedUnit.model}
                          onChange={(e) => updateUsedUnit(usedUnit.id, 'model', e.target.value)}
                          placeholder="Modelo"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={usedUnit.year}
                          onChange={(e) => updateUsedUnit(usedUnit.id, 'year', e.target.value)}
                          placeholder="Año"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={usedUnit.domain}
                          onChange={(e) => updateUsedUnit(usedUnit.id, 'domain', e.target.value)}
                          placeholder="Dominio"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={usedUnit.internalNumber}
                          onChange={(e) => updateUsedUnit(usedUnit.id, 'internalNumber', e.target.value)}
                          placeholder="N° Int"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={usedUnit.bodywork}
                          onChange={(e) => updateUsedUnit(usedUnit.id, 'bodywork', e.target.value)}
                          placeholder="Carrocería"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={usedUnit.value || ''}
                          onChange={(e) => updateUsedUnit(usedUnit.id, 'value', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeUsedUnit(usedUnit.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumen de Operación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-card rounded-lg border">
              <p className="text-sm text-muted-foreground">Precio Unidad</p>
              <p className="text-xl font-semibold">U$S {formatCurrency(price.priceUSD)}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <p className="text-sm text-muted-foreground">+ Adicionales</p>
              <p className="text-xl font-semibold">U$S {formatCurrency(totalAdditionals)}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <p className="text-sm text-muted-foreground">- Usados</p>
              <p className="text-xl font-semibold text-destructive">U$S {formatCurrency(totalUsed)}</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary">
              <p className="text-sm text-muted-foreground">SALDO FINAL</p>
              <p className="text-2xl font-bold text-primary">U$S {formatCurrency(finalBalance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method & Delivery */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Forma de Pago y Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod">Forma de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar forma de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contado">Contado</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="pagare">Pagaré</SelectItem>
                  <SelectItem value="prenda">Prenda</SelectItem>
                  <SelectItem value="financiado">Financiado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="delivery">Fecha Estimada de Entrega</Label>
              <Input 
                id="delivery"
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Observaciones Generales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Ingrese observaciones adicionales..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Supervisor Email */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Envío para Aprobación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="supervisorEmail">Email del Supervisor *</Label>
            <Input 
              id="supervisorEmail"
              type="email"
              value={supervisorEmail}
              onChange={(e) => setSupervisorEmail(e.target.value)}
              placeholder="supervisor@empresa.com"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-2">
              El supervisor recibirá un email con el PDF adjunto y botones para aprobar o rechazar la solicitud.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions (sticky bar so it's always visible) */}
      <div className="sticky bottom-0 z-20 -mx-2 sm:mx-0">
        <div className="rounded-lg border border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="p-3 sm:p-4">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyMessage}>
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? 'OK' : 'Copiar'}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={generateWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    WA
                  </a>
                </Button>
              </div>
              <Button 
                onClick={handleSendForApproval} 
                disabled={isSending || !supervisorEmail.trim()}
                className="gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar para Aprobar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
