import { useState, useEffect } from 'react';
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
  const [range, setRange] = useState<{ startIndex: number; endIndex: number } | null>(null);

  useEffect(() => { setVisible(new Set(products)); }, [products]);

  const toggle = (p: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  const displayedData = range
    ? chartData.slice(range.startIndex, range.endIndex + 1)
    : chartData;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <ProductToggle products={products} visible={visible} onToggle={toggle} />
          {range && (
            <button
              onClick={() => setRange(null)}
              style={{
                border: `1px solid ${theme.inputBorder}`,
                backgroundColor: theme.inputBg,
                color: theme.textSecondary,
                borderRadius: 6,
                padding: '0.2rem 0.5rem',
                cursor: 'pointer',
                fontSize: '0.78rem',
              }}
              aria-label="Reset chart zoom"
            >
              Reset Zoom
            </button>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={displayedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
          <Brush
            dataKey="date"
            height={28}
            stroke="#e91e63"
            fill={theme.cardBg}
            onChange={(next) => {
              if (
                next &&
                typeof next.startIndex === 'number' &&
                typeof next.endIndex === 'number' &&
                next.endIndex > next.startIndex
              ) {
                setRange({ startIndex: next.startIndex, endIndex: next.endIndex });
              }
            }}
          />
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
