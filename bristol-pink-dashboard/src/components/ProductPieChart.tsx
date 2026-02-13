import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ChartDataPoint } from '../types';
import { COLORS } from './ProductToggle';
import { useTheme } from '../ThemeContext';

interface ProductPieChartProps {
  chartData: ChartDataPoint[];
  products: string[];
}

export function ProductPieChart({ chartData, products }: ProductPieChartProps) {
  const { theme } = useTheme();

  const totals = useMemo(() => {
    return products.map((p, i) => {
      const total = chartData.reduce((sum, point) => {
        const val = point[p];
        return sum + (typeof val === 'number' ? val : 0);
      }, 0);
      return { name: p, value: total, color: COLORS[i % COLORS.length] };
    }).filter((d) => d.value > 0);
  }, [chartData, products]);

  if (totals.length === 0) return null;

  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  return (
    <div style={{
      backgroundColor: theme.cardBg, borderRadius: 12, padding: '1.25rem',
      boxShadow: theme.shadow, border: `1px solid ${theme.cardBorder}`,
      transition: 'background-color 0.3s ease',
    }}>
      <h3 style={{ margin: '0 0 0.5rem', color: theme.text, fontSize: '1rem', fontWeight: 600 }}>Product Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={totals}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={55}
            paddingAngle={3}
            labelLine={false}
            label={renderLabel}
          >
            {totals.map((d) => (
              <Cell key={d.name} fill={d.color} stroke={theme.cardBg} strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, border: `1px solid ${theme.tooltipBorder}`, fontSize: '0.85rem', backgroundColor: theme.tooltipBg, color: theme.text }}
            formatter={(value: number) => [`${value.toLocaleString()} units`, '']}
          />
          <Legend
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ fontSize: '0.8rem', color: theme.textSecondary }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
