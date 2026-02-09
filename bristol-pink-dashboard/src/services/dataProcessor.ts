import { SalesRecord, TopProduct, ChartDataPoint } from '../types';

const COFFEE_KEYWORDS = [
  'coffee',
  'latte',
  'cappuccino',
  'espresso',
  'americano',
  'mocha',
  'macchiato',
];

function isCoffeeProduct(productName: string): boolean {
  const lower = productName.toLowerCase();
  return COFFEE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function getTopProducts(
  records: SalesRecord[],
  category: 'food' | 'coffee',
  count: number
): TopProduct[] {
  const totals = new Map<string, number>();

  for (const record of records) {
    const productIsCoffee = isCoffeeProduct(record.product);
    const matchesCategory =
      (category === 'coffee' && productIsCoffee) ||
      (category === 'food' && !productIsCoffee);

    if (matchesCategory) {
      const current = totals.get(record.product) ?? 0;
      totals.set(record.product, current + record.unitsSold);
    }
  }

  const products: TopProduct[] = Array.from(totals.entries()).map(
    ([product, totalSold]) => ({
      product,
      totalSold,
      category,
    })
  );

  products.sort((a, b) => b.totalSold - a.totalSold);

  return products.slice(0, count);
}

export function aggregateByDate(records: SalesRecord[]): ChartDataPoint[] {
  const dateMap = new Map<string, Map<string, number>>();

  for (const record of records) {
    if (!dateMap.has(record.date)) {
      dateMap.set(record.date, new Map<string, number>());
    }
    const productMap = dateMap.get(record.date)!;
    const current = productMap.get(record.product) ?? 0;
    productMap.set(record.product, current + record.unitsSold);
  }

  const sortedDates = Array.from(dateMap.keys()).sort();

  return sortedDates.map((date) => {
    const productMap = dateMap.get(date)!;
    const point: ChartDataPoint = { date };
    for (const [product, units] of productMap.entries()) {
      point[product] = units;
    }
    return point;
  });
}

export function aggregateByProduct(
  records: SalesRecord[]
): Map<string, { date: string; units: number }[]> {
  const productMap = new Map<string, Map<string, number>>();

  for (const record of records) {
    if (!productMap.has(record.product)) {
      productMap.set(record.product, new Map<string, number>());
    }
    const dateMap = productMap.get(record.product)!;
    const current = dateMap.get(record.date) ?? 0;
    dateMap.set(record.date, current + record.unitsSold);
  }

  const result = new Map<string, { date: string; units: number }[]>();

  for (const [product, dateMap] of productMap.entries()) {
    const sortedEntries = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, units]) => ({ date, units }));
    result.set(product, sortedEntries);
  }

  return result;
}

export function filterByDateRange(
  records: SalesRecord[],
  start: Date,
  end: Date
): SalesRecord[] {
  return records.filter((record) => {
    const recordDate = new Date(record.date);
    return recordDate >= start && recordDate <= end;
  });
}
