import Papa from 'papaparse';
import { SalesRecord } from '../types';

interface CSVRow {
  Date?: string;
  Product?: string;
  'Product Name'?: string;
  'Units Sold'?: string;
  [key: string]: any;
}

function normalizeDate(dateStr: string): string {
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  // fallback: try ISO-like
  return new Date(dateStr).toISOString().split('T')[0];
}

export function parseCSVFile(file: File): Promise<SalesRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data;
          const records: SalesRecord[] = [];

          // Detect wide format: header has product columns other than Date
          const headers = results.meta.fields || [];
          const productColumns = headers.filter((h) => h && h !== 'Date' && h !== 'Number Sold' && h !== 'Units Sold' && h !== 'Product' && h !== 'Product Name');

          if (productColumns.length > 0) {
            // wide format: each product column is a separate product
            for (const row of rows) {
              const dateRaw = (row.Date || '').toString();
              if (!dateRaw) continue;
              const date = normalizeDate(dateRaw);
              for (const col of productColumns) {
                const val = row[col];
                const units = Number(val);
                if (!Number.isNaN(units) && String(col).trim() !== '') {
                  records.push({ date, product: String(col).trim(), unitsSold: Math.round(units) });
                }
              }
            }
          } else {
            // long format: rows contain a single product and units
            for (const row of rows) {
              const dateRaw = (row.Date || '').toString();
              if (!dateRaw) continue;
              const date = normalizeDate(dateRaw);
              const product = (row.Product || row['Product Name'] || '').toString().trim();
              const unitsRaw = row['Units Sold'] ?? row['Number Sold'] ?? row['NumberSold'] ?? '';
              const units = parseInt(String(unitsRaw), 10) || 0;
              if (product) {
                records.push({ date, product, unitsSold: units });
              } else if (headers.length === 2 && headers[1] && headers[1].toLowerCase().includes('number')) {
                // If only Date + Number Sold (single product file), infer product from filename later in app
                records.push({ date, product: '', unitsSold: units });
              }
            }
          }

          resolve(records);
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

export function parseCSVText(text: string): Promise<SalesRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // reuse logic by serializing results back to CSV and parsing as file would
        // but easier: process results here similarly
        try {
          const rows = results.data;
          const records: SalesRecord[] = [];
          const headers = results.meta.fields || [];
          const productColumns = headers.filter((h) => h && h !== 'Date' && h !== 'Number Sold' && h !== 'Units Sold' && h !== 'Product' && h !== 'Product Name');

          if (productColumns.length > 0) {
            for (const row of rows) {
              const dateRaw = (row.Date || '').toString();
              if (!dateRaw) continue;
              const date = normalizeDate(dateRaw);
              for (const col of productColumns) {
                const val = row[col];
                const units = Number(val);
                if (!Number.isNaN(units) && String(col).trim() !== '') {
                  records.push({ date, product: String(col).trim(), unitsSold: Math.round(units) });
                }
              }
            }
          } else {
            for (const row of rows) {
              const dateRaw = (row.Date || '').toString();
              if (!dateRaw) continue;
              const date = normalizeDate(dateRaw);
              const product = (row.Product || row['Product Name'] || '').toString().trim();
              const unitsRaw = row['Units Sold'] ?? row['Number Sold'] ?? row['NumberSold'] ?? '';
              const units = parseInt(String(unitsRaw), 10) || 0;
              if (product) {
                records.push({ date, product, unitsSold: units });
              } else if (headers.length === 2 && headers[1] && headers[1].toLowerCase().includes('number')) {
                records.push({ date, product: '', unitsSold: units });
              }
            }
          }

          resolve(records);
        } catch (err) {
          reject(err);
        }
      },
      error: (error: Error) => reject(error),
    });
  });
}
