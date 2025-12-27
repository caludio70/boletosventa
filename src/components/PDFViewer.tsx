import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { checkTicketPDFExists, getTicketPDFUrl } from '@/lib/pdfStorage';

interface PDFViewerProps {
  ticketNumber: string;
}

export function PDFViewer({ ticketNumber }: PDFViewerProps) {
  const [hasPDF, setHasPDF] = useState<boolean | null>(null);

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

  const handleOpenPDF = () => {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={handleOpenPDF}
      className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1.5"
    >
      <FileText className="w-4 h-4" />
      <span className="hidden sm:inline">Ver Boleto</span>
    </Button>
  );
}
