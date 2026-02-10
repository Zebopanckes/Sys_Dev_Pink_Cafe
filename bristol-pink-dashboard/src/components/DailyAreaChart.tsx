import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ChartDataPoint } from '../types';
import { ProductToggle, COLORS } from './ProductToggle';

interface DailyAreaChartProps {
  chartData: ChartDataPoint[];
  products: string[];
}

export function DailyAreaChart({ chartData, products }: DailyAreaChartProps) {
  const [visible, setVisible] = useState<Set<string>>(() => new Set(products));

  useEffect(() => { setVisible(new Set(products)); }, [products]);

  const toggle = (p: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  if (chartData.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: 12, padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '1rem', fontWeight: 600 }}>Daily Stacked Area</h3>
        <ProductToggle products={products} visible={visible} onToggle={toggle} />
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(val: string) => {
              const parts = val.split('-');
              return `${parts[2]}/${parts[1]}`;
            }}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #eee', fontSize: '0.85rem' }}
            labelFormatter={(label: string) => `Date: ${label}`}
          />
          {products.filter((p) => visible.has(p)).map((p) => {
            const i = products.indexOf(p);
            return (
              <Area
                key={p}
                type="monotone"
                dataKey={p}
                stackId="1"
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.25}
                strokeWidth={2}
                connectNulls
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
