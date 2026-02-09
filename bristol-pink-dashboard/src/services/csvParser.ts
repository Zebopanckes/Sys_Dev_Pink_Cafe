import Papa from 'papaparse';
import { SalesRecord } from '../types';

interface CSVRow {
  Date: string;
  Product?: string;
  'Product Name'?: string;
  'Units Sold': string;
}

export function parseCSVFile(file: File): Promise<SalesRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const records = results.data.map((row) => {
            const rawRow = row as CSVRow;
            const dateParts = rawRow.Date.trim().split('/');
            const dateStr = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;

            return {
              date: dateStr,
              product: rawRow.Product?.trim() ?? rawRow['Product Name']?.trim() ?? '',
              unitsSold: parseInt(rawRow['Units Sold'], 10) || 0,
            };
          });
          resolve(records.filter((r) => r.product !== '' && r.date !== '--'));
        } catch (error) {
          reject(new Error(`Failed to parse CSV: ${error}`));
        }
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}
