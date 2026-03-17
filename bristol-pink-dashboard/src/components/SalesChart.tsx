import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { ChartDataPoint } from '../types';
import { ProductToggle, COLORS } from './ProductToggle';
import { useTheme } from '../ThemeContext';

interface SalesChartProps {
  chartData: ChartDataPoint[];
  products: string[];
}

export function SalesChart({ chartData, products }: SalesChartProps) {
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

  const chartSummary = useMemo(() => {
    if (chartData.length === 0) {
      return 'No sales data available.';
    }

    const activeProducts = products.filter((p) => visible.has(p));
    const totals = activeProducts.map((product) => {
      const total = chartData.reduce((sum, row) => {
        const value = row[product];
        return sum + (typeof value === 'number' ? value : 0);
      }, 0);
      return { product, total };
    });

    const top = totals.slice().sort((a, b) => b.total - a.total)[0];
    const firstDate = chartData[0]?.date;
    const lastDate = chartData[chartData.length - 1]?.date;
    return `Daily sales chart from ${firstDate} to ${lastDate}. ${activeProducts.length} visible products. Top visible product is ${top?.product ?? 'N/A'} with ${Math.round(top?.total ?? 0)} total units.`;
  }, [chartData, products, visible]);

  if (chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: theme.textMuted, backgroundColor: theme.cardBg, borderRadius: 12 }}>
        No sales data to display. Upload a CSV file to get started.
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: theme.cardBg, borderRadius: 12, padding: '1.25rem',
      boxShadow: theme.shadow, border: `1px solid ${theme.cardBorder}`,
      transition: 'background-color 0.3s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, color: theme.text, fontSize: '1rem', fontWeight: 600 }}>Daily Sales Trend</h3>
        <ProductToggle products={products} visible={visible} onToggle={toggle} />
      </div>
      <p className="sr-only" aria-live="polite">{chartSummary}</p>
      <details style={{ marginBottom: '0.6rem' }}>
        <summary style={{ cursor: 'pointer', color: theme.textSecondary, fontSize: '0.82rem' }}>
          Chart Data Summary
        </summary>
        <p style={{ marginTop: '0.3rem', color: theme.textSecondary, fontSize: '0.82rem' }}>{chartSummary}</p>
      </details>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: theme.chartAxisTick }}
            tickFormatter={(val: string) => {
              const parts = val.split('-');
              return `${parts[2]}/${parts[1]}`;
            }}
          />
          <YAxis tick={{ fontSize: 11, fill: theme.chartAxisTick }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: `1px solid ${theme.tooltipBorder}`, fontSize: '0.85rem', backgroundColor: theme.tooltipBg, color: theme.text }}
            labelFormatter={(label: string) => `Date: ${label}`}
          />
          <Brush dataKey="date" height={28} stroke="#e91e63" fill={theme.cardBg} />
          {products.filter((p) => visible.has(p)).map((p) => {
            const i = products.indexOf(p);
            return (
              <Line
                key={p}
                type="monotone"
                dataKey={p}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
                animationDuration={600}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
