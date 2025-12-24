import * as XLSX from 'xlsx';
import { OperationRow } from './types';

// Parse a date from Excel (can be Date object or string)
function parseExcelDate(value: unknown): Date | null {
  if (!value) return null;
  
  // If it's already a Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  
  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return new Date(date.y, date.m - 1, date.d);
    }
  }
  
  // If it's a string
  if (typeof value === 'string' && value.trim()) {
    const parts = value.split('/');
    if (parts.length === 3) {
      let day: number, month: number, year: number;
      
      if (parts[2].length === 2) {
        // Format: M/D/YY
        month = parseInt(parts[0]) - 1;
        day = parseInt(parts[1]);
        year = 2000 + parseInt(parts[2]);
      } else {
        // Format: DD/MM/YYYY
        day = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        year = parseInt(parts[2]);
      }
      
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return null;
}

// Parse number from various formats
function parseNumber(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  
  const str = String(value)
    .replace(/USD\s*/i, '')
    .replace(/ARS\s*/i, '')
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .trim();
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Column mapping - adjust these based on your Excel structure
const COLUMN_MAP: Record<string, keyof OperationRow> = {
  'A': 'boleto',
  'B': 'fecha',
  'C': 'codCliente',
  'D': 'nombreCliente',
  'E': 'vendedor',
  'F': 'producto',
  'G': 'cantidad',
  'H': 'precioUnitario',
  'I': 'totalOperacion',
  'J': 'usado',
  'K': 'valorUsado',
  'L': 'formaPago',
  'M': 'fechaPago', // Column O in original, but depends on your sheet
  'N': 'recibo',
  'O': 'cuota',
  'P': 'chequeTransf',
  'Q': 'vtoCheque',
  'R': 'tipoCambio',
  'S': 'importeARS',
  'T': 'importeUSD',
  'U': 'ctaCte',
  'V': 'saldoFinal',
  'W': 'observacion',
};

export function parseExcelFile(file: File): Promise<Partial<OperationRow>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays
        const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (rows.length < 2) {
          resolve([]);
          return;
        }
        
        // Skip header row, parse each data row
        const operations: Partial<OperationRow>[] = [];
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          // Check if boleto exists (required field)
          const boleto = row[0];
          if (!boleto) continue;
          
          const op: Partial<OperationRow> = {
            boleto: String(boleto).trim(),
            fecha: parseExcelDate(row[1]),
            codCliente: row[2] ? String(row[2]).trim() : '',
            nombreCliente: row[3] ? String(row[3]).trim() : '',
            vendedor: row[4] ? String(row[4]).trim() : '',
            producto: row[5] ? String(row[5]).trim() : '',
            cantidad: parseNumber(row[6]),
            precioUnitario: parseNumber(row[7]),
            totalOperacion: parseNumber(row[8]),
            usado: row[9] ? String(row[9]).trim() : '',
            valorUsado: parseNumber(row[10]),
            formaPago: row[11] ? String(row[11]).trim() : '',
            // Adjust column indices based on your Excel structure
            fechaPago: parseExcelDate(row[14]), // Column O
            recibo: row[15] ? String(row[15]).trim() : '',
            cuota: row[16] ? String(row[16]).trim() : '',
            chequeTransf: row[17] ? String(row[17]).trim() : '',
            vtoCheque: parseExcelDate(row[18]),
            tipoCambio: parseNumber(row[19]),
            importeARS: parseNumber(row[20]),
            importeUSD: parseNumber(row[21]),
            ctaCte: parseNumber(row[22]),
            saldoFinal: parseNumber(row[23]),
            observacion: row[26] ? String(row[26]).trim() : '',
          };
          
          operations.push(op);
        }
        
        resolve(operations);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
}
