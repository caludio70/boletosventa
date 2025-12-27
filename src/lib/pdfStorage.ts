import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'boletos-pdf';

export async function uploadTicketPDF(ticketNumber: string, file: File): Promise<string | null> {
  const fileName = `${ticketNumber}.pdf`;
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error('Error uploading PDF:', error);
    return null;
  }

  return getTicketPDFUrl(ticketNumber);
}

export function getTicketPDFUrl(ticketNumber: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(`${ticketNumber}.pdf`);
  
  return data.publicUrl;
}

export async function checkTicketPDFExists(ticketNumber: string): Promise<boolean> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', { search: `${ticketNumber}.pdf` });

  if (error) {
    console.error('Error checking PDF:', error);
    return false;
  }

  return data.some(file => file.name === `${ticketNumber}.pdf`);
}

export async function deleteTicketPDF(ticketNumber: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([`${ticketNumber}.pdf`]);

  if (error) {
    console.error('Error deleting PDF:', error);
    return false;
  }

  return true;
}

export async function uploadMultiplePDFs(files: File[]): Promise<{ success: string[]; failed: string[] }> {
  const results = { success: [] as string[], failed: [] as string[] };

  for (const file of files) {
    // Extract ticket number from filename (e.g., "22302_JUAN_B_JUSTO_SA.pdf" -> "22302")
    const ticketNumber = file.name.split('_')[0].replace('.pdf', '');
    
    if (!ticketNumber || isNaN(Number(ticketNumber))) {
      results.failed.push(file.name);
      continue;
    }

    const url = await uploadTicketPDF(ticketNumber, file);
    if (url) {
      results.success.push(ticketNumber);
    } else {
      results.failed.push(file.name);
    }
  }

  return results;
}
