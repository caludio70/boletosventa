import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { uploadMultiplePDFs } from '@/lib/pdfStorage';
import { toast } from 'sonner';

interface PDFUploaderProps {
  onUploadComplete?: () => void;
}

export function PDFUploader({ onUploadComplete }: PDFUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');
      
      if (pdfFiles.length === 0) {
        toast.error('Solo se permiten archivos PDF');
        return;
      }

      const results = await uploadMultiplePDFs(pdfFiles);

      if (results.success.length > 0) {
        toast.success(`${results.success.length} PDF(s) subidos: boletos ${results.success.join(', ')}`);
      }
      
      if (results.failed.length > 0) {
        toast.error(`${results.failed.length} archivo(s) fallaron. Asegúrate que el nombre empiece con el número de boleto.`);
      }

      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir los archivos');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        id="pdf-upload"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Subir PDFs
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground mt-1">
        Nombrar archivos: NroBoleto_... (ej: 22302_cliente.pdf)
      </p>
    </div>
  );
}
