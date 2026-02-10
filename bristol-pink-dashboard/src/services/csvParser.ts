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
  return new Date(dateStr).toISOString().split('T')[0];
}

/**
 * Pre-process raw CSV text to handle two-row headers like:
 *   Date,Number Sold,
 *   ,Cappuccino,Americano
 *   01/03/2025,82,100
 * Normalizes to:
 *   Date,Cappuccino,Americano
 *   01/03/2025,82,100
 */
function preprocessCSV(text: string): string {
  const lines = text.split(/\r?\n/);
  if (lines.length < 3) return text;

  const line2 = lines[1].trim();
  // Detect pattern: second line starts with comma and has non-numeric names
  if (line2.startsWith(',')) {
    const productNames = line2.split(',').slice(1).map((s) => s.trim()).filter(Boolean);
    if (productNames.length > 0 && productNames.every((n) => isNaN(Number(n)))) {
      const newHeader = 'Date,' + productNames.join(',');
      return [newHeader, ...lines.slice(2)].join('\n');
    }
  }
  return text;
}

function processRows(rows: CSVRow[], headers: string[]): SalesRecord[] {
  const records: SalesRecord[] = [];
  const productColumns = headers.filter(
    (h) => h && h !== 'Date' && h !== 'Number Sold' && h !== 'Units Sold' && h !== 'Product' && h !== 'Product Name'
  );

  if (productColumns.length > 0) {
    // Wide format: each product column is a separate product
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
    // Long format
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
  return records;
}

export function parseCSVFile(file: File): Promise<SalesRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = e.target?.result as string;
        const records = await parseCSVText(raw);
        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function parseCSVText(text: string): Promise<SalesRecord[]> {
  const normalized = preprocessCSV(text);
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(normalized, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const headers = results.meta.fields || [];
          const records = processRows(results.data, headers);
          resolve(records);
        } catch (err) {
          reject(err);
        }
      },
      error: (error: Error) => reject(error),
    });
  });
}
