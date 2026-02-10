import { useState, useEffect, useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Line,
} from 'recharts';
import { ProductToggle, COLORS } from './ProductToggle';

interface PredictionChartData {
  date: string;
  [key: string]: number | string | undefined;
}

interface PredictionChartProps {
  historicalData: PredictionChartData[];
  predictionData: PredictionChartData[];
  products: string[];
}

export function PredictionChart({ historicalData, predictionData, products }: PredictionChartProps) {
  const [visible, setVisible] = useState<Set<string>>(() => new Set(products));

  useEffect(() => { setVisible(new Set(products)); }, [products]);

  const toggle = (p: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  // Build combined data with bridge point so historical→prediction lines are continuous
  const combined = useMemo(() => {
    if (predictionData.length === 0) return [];

    const tailLength = Math.min(14, historicalData.length);
    const histTail = historicalData.slice(-tailLength).map((d) => ({ ...d }));

    // Bridge: copy last historical values into predicted keys so the prediction line starts there
    if (histTail.length > 0) {
      const lastHist = histTail[histTail.length - 1];
      for (const product of products) {
        if (lastHist[product] !== undefined) {
          lastHist[`${product}_predicted`] = lastHist[product];
        }
      }
    }

    return [...histTail, ...predictionData];
  }, [historicalData, predictionData, products]);

  if (predictionData.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '2rem', color: '#999',
        backgroundColor: '#fff', borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0',
      }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#333', fontSize: '1rem', fontWeight: 600 }}>Predictions</h3>
        Run a prediction to see forecasted sales for the next 4 weeks.
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: 12, padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '1rem', fontWeight: 600 }}>Predicted Sales (Next 4 Weeks)</h3>
        <ProductToggle products={products} visible={visible} onToggle={toggle} />
      </div>
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={combined} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
                key={`ci-${p}`}
                type="monotone"
                dataKey={`${p}_ci_upper`}
                name={`${p} CI`}
                stroke="none"
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.08}
                connectNulls
              />
            );
          })}
          {products.filter((p) => visible.has(p)).map((p) => {
            const i = products.indexOf(p);
            return (
              <Line
                key={`hist-${p}`}
                type="monotone"
                dataKey={p}
                name={p}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
                animationDuration={600}
              />
            );
          })}
          {products.filter((p) => visible.has(p)).map((p) => {
            const i = products.indexOf(p);
            return (
              <Line
                key={`pred-${p}`}
                type="monotone"
                dataKey={`${p}_predicted`}
                name={`${p} (predicted)`}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                connectNulls
                animationDuration={600}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
