import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { FileText, Download, ExternalLink, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { checkTicketPDFExists, getTicketPDFUrl } from '@/lib/pdfStorage';

interface PDFViewerProps {
  ticketNumber: string;
}

// Lazy load pdfjs-dist to avoid top-level await issues
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // Use import.meta.url for Vite compatibility
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  }
  return pdfjsLib;
}

export function PDFViewer({ ticketNumber }: PDFViewerProps) {
  const [hasPDF, setHasPDF] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);

  useEffect(() => {
    checkTicketPDFExists(ticketNumber).then(setHasPDF);
  }, [ticketNumber]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    
    const page = await pdfDocRef.current.getPage(pageNum);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Calculate scale to fit the container width while maintaining aspect ratio
    const containerWidth = canvas.parentElement?.clientWidth || 800;
    const viewport = page.getViewport({ scale: 1 });
    const scale = (containerWidth - 32) / viewport.width; // 32px for padding
    const scaledViewport = page.getViewport({ scale: Math.min(scale, 2) }); // Max 2x scale

    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
    }).promise;
  }, []);

  const loadPDF = useCallback(async () => {
    const pdfUrl = getTicketPDFUrl(ticketNumber);
    setIsLoading(true);
    setError(null);
    
    try {
      const pdfjs = await getPdfjs();
      const loadingTask = pdfjs.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      await renderPage(1);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('No se pudo cargar el PDF');
    } finally {
      setIsLoading(false);
    }
  }, [ticketNumber, renderPage]);

  useEffect(() => {
    if (isOpen && hasPDF) {
      loadPDF();
    }
    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [isOpen, hasPDF, loadPDF]);

  useEffect(() => {
    if (pdfDocRef.current && currentPage > 0) {
      renderPage(currentPage);
    }
  }, [currentPage, renderPage]);

  if (hasPDF === null) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-1.5 text-primary-foreground/50">
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (!hasPDF) {
    return null;
  }

  const pdfUrl = getTicketPDFUrl(ticketNumber);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1.5"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Ver Boleto</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Boleto N° {ticketNumber}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                  <ExternalLink className="w-4 h-4" />
                  Abrir
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={pdfUrl} download={`boleto_${ticketNumber}.pdf`} className="gap-1.5">
                  <Download className="w-4 h-4" />
                  Descargar
                </a>
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Vista previa del boleto en formato PDF
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 mt-4 min-h-0 flex flex-col overflow-hidden">
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          {error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-muted/50 rounded-lg p-8">
              <FileText className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground text-center">{error}</p>
              <div className="flex gap-3">
                <Button asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir en nueva pestaña
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={pdfUrl} download={`boleto_${ticketNumber}.pdf`}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </a>
                </Button>
              </div>
            </div>
          )}
          
          {!isLoading && !error && (
            <>
              <div className="flex-1 overflow-auto bg-muted/30 rounded-lg border border-border flex justify-center p-4">
                <canvas ref={canvasRef} className="max-w-full shadow-lg" />
              </div>
              
              {numPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {numPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                    disabled={currentPage >= numPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
