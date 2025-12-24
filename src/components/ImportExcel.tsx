import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseExcelFile } from '@/lib/excelParser';
import { OperationRow } from '@/lib/types';

interface ImportExcelProps {
  onImport: (data: Partial<OperationRow>[]) => void;
}

export function ImportExcel({ onImport }: ImportExcelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls',
    ];
    
    const isValidType = validTypes.some(type => 
      file.type === type || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
    );

    if (!isValidType) {
      setError('Por favor seleccione un archivo Excel (.xlsx o .xls)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await parseExcelFile(file);
      
      if (data.length === 0) {
        setError('No se encontraron datos válidos en el archivo');
        return;
      }

      // Count unique tickets
      const uniqueTickets = new Set(data.map(row => row.boleto)).size;
      
      onImport(data);
      setSuccess(`Se importaron ${data.length} registros (${uniqueTickets} boletos)`);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Import error:', err);
      setError('Error al procesar el archivo. Verifique el formato.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Importando...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Importar Excel
          </>
        )}
      </Button>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-success bg-success/10 px-3 py-2 rounded">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Formato esperado: Columnas A-W con Boleto, Fecha, Cliente, Productos, Pagos, etc.
      </p>
    </div>
  );
}
