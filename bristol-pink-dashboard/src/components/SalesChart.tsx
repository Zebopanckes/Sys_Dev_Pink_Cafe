import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { ChartDataPoint } from '../types';

interface SalesChartProps {
  chartData: ChartDataPoint[];
  products: string[];
}

const COLORS = [
  '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
  '#00bcd4', '#009688', '#4caf50', '#ff9800', '#ff5722',
  '#795548', '#607d8b', '#f44336', '#8bc34a', '#ffeb3b',
];

export function SalesChart({ chartData, products }: SalesChartProps) {
  if (chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
        No sales data to display. Upload a CSV file to get started.
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{ margin: '0 0 1rem', color: '#333' }}>Historical Sales</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(val: string) => {
              const parts = val.split('-');
              return `${parts[2]}/${parts[1]}`;
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: 4, border: '1px solid #eee' }}
            labelFormatter={(label: string) => `Date: ${label}`}
          />
          <Legend />
          <Brush dataKey="date" height={30} stroke="#e91e63" />
          {products.map((product, i) => (
            <Line
              key={product}
              type="monotone"
              dataKey={product}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
