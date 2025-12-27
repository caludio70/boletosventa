import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, ExternalLink, Loader2 } from 'lucide-react';
import { checkTicketPDFExists, getTicketPDFUrl } from '@/lib/pdfStorage';

interface PDFViewerProps {
  ticketNumber: string;
}

export function PDFViewer({ ticketNumber }: PDFViewerProps) {
  const [hasPDF, setHasPDF] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkTicketPDFExists(ticketNumber).then(setHasPDF);
  }, [ticketNumber]);

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
      <DialogContent className="max-w-4xl h-[85vh]">
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
        </DialogHeader>
        <div className="flex-1 mt-4 h-full min-h-0">
          <iframe
            src={pdfUrl}
            className="w-full h-full rounded-lg border border-border"
            title={`Boleto ${ticketNumber}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
