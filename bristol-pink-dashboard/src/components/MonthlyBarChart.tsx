import { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ChartDataPoint } from '../types';
import { ProductToggle, COLORS } from './ProductToggle';
import { useTheme } from '../ThemeContext';

interface MonthlyBarChartProps {
  chartData: ChartDataPoint[];
  products: string[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MonthlyBarChart({ chartData, products }: MonthlyBarChartProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState<Set<string>>(() => new Set(products));

  useEffect(() => { setVisible(new Set(products)); }, [products]);

  const toggle = (p: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  const monthlyData = useMemo(() => {
    const months = new Map<string, Record<string, number | string>>();
    for (const point of chartData) {
      const [year, month] = point.date.split('-');
      const key = `${year}-${month}`;
      if (!months.has(key)) months.set(key, { month: `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}` });
      const m = months.get(key)!;
      for (const p of products) {
        const val = point[p];
        if (typeof val === 'number') {
          m[p] = ((m[p] as number) || 0) + val;
        }
      }
    }
    return Array.from(months.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data);
  }, [chartData, products]);

  if (chartData.length === 0) return null;

  return (
    <div style={{
      backgroundColor: theme.cardBg, borderRadius: 12, padding: '1.25rem',
      boxShadow: theme.shadow, border: `1px solid ${theme.cardBorder}`,
      transition: 'background-color 0.3s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, color: theme.text, fontSize: '1rem', fontWeight: 600 }}>Monthly Sales Totals</h3>
        <ProductToggle products={products} visible={visible} onToggle={toggle} />
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.chartAxisTick }} />
          <YAxis tick={{ fontSize: 11, fill: theme.chartAxisTick }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: `1px solid ${theme.tooltipBorder}`, fontSize: '0.85rem', backgroundColor: theme.tooltipBg, color: theme.text }}
          />
          {products.filter((p) => visible.has(p)).map((p) => {
            const i = products.indexOf(p);
            return (
              <Bar
                key={p}
                dataKey={p}
                fill={COLORS[i % COLORS.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
