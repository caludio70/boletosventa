
# Plan: Implementar Exportación PDF del Boleto y Revisar WhatsApp

## Problemas Identificados

### 1. Exportación PDF No Funciona
La función `handleExportPDF` en el formulario de Solicitud de Compra solo tiene un `console.log('Export PDF')` - nunca se implementó la lógica real de generación del PDF.

### 2. WhatsApp - Warning de React
Hay un warning en consola: "Function components cannot be given refs" relacionado con el componente `Select` de Radix UI. Esto no debería bloquear WhatsApp, pero indica un problema de compatibilidad con refs.

El botón de WhatsApp actualmente usa `web.whatsapp.com/send?phone=...&text=...` que es la mejor opción disponible. Si sigue siendo rechazado, la alternativa es usar el método "copiar mensaje + abrir WhatsApp manualmente".

---

## Soluciones Propuestas

### Parte 1: Implementar Exportación PDF

Crear una nueva función `exportPurchaseRequestToPDF` en `src/lib/exportUtils.ts` que genere un PDF profesional con el formato del formulario físico de solicitud de compra.

**Estructura del PDF:**
- Encabezado con logo Mercedes-Benz y datos de AUTOBUS S.A.
- Numero de solicitud y fecha
- Tabla de datos del comprador
- Tabla de especificaciones de la unidad
- Tabla de adicionales (si existen)
- Tabla de usados como parte de pago (si existen)
- Resumen de la operacion (precio, adicionales, usados, saldo final)
- Forma de pago y fecha de entrega
- Observaciones

Luego, actualizar `handleExportPDF` en `PurchaseRequestForm.tsx` para llamar a esta nueva funcion.

### Parte 2: WhatsApp - Alternativa Robusta

Agregar un fallback para WhatsApp que funcione incluso si el navegador bloquea el link directo:

1. **Opcion A (actual mejorada)**: Mantener el link directo `web.whatsapp.com`
2. **Opcion B (fallback)**: Agregar un boton "Copiar Mensaje" que copie el texto al portapapeles y muestre instrucciones para pegarlo manualmente en WhatsApp

Esto garantiza que siempre haya una forma de enviar el mensaje.

### Parte 3: Corregir Warning de Refs

Agregar `ref={null}` o usar el patron correcto para los componentes Select que estan causando el warning.

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/lib/exportUtils.ts` | Agregar funcion `exportPurchaseRequestToPDF` |
| `src/components/PurchaseRequestForm.tsx` | Implementar `handleExportPDF`, agregar boton "Copiar Mensaje", corregir refs |

---

## Detalles Tecnicos

### Nueva Funcion PDF

```typescript
export function exportPurchaseRequestToPDF(data: {
  requestNumber: string;
  buyer: BuyerData;
  unit: UnitData;
  price: PriceData;
  additionals: Additional[];
  usedUnits: UsedUnit[];
  paymentMethod: string;
  estimatedDelivery: string;
  observations: string;
  finalBalance: number;
})
```

### Boton Copiar Mensaje

Se agregara junto al boton de WhatsApp actual:
- Icono de copiar
- Funcion `navigator.clipboard.writeText(message)`
- Toast de confirmacion "Mensaje copiado"

### Correccion de Refs

Los componentes `Select` de Radix UI estan siendo envueltos de una manera que causa el warning. Se revisara el uso correcto segun la documentacion de Radix UI.
