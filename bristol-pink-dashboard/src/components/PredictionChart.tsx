import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

interface PredictionChartData {
  date: string;
  [key: string]: number | string | undefined;
}

interface PredictionChartProps {
  historicalData: PredictionChartData[];
  predictionData: PredictionChartData[];
  products: string[];
}

const COLORS = [
  '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
  '#00bcd4', '#009688', '#4caf50', '#ff9800', '#ff5722',
];

export function PredictionChart({ historicalData, predictionData, products }: PredictionChartProps) {
  if (predictionData.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        color: '#999',
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#333' }}>Predictions</h3>
        Run a prediction to see forecasted sales for the next 4 weeks.
      </div>
    );
  }

  // Combine historical tail + predictions for a continuous chart
  const tailLength = Math.min(14, historicalData.length);
  const combined = [
    ...historicalData.slice(-tailLength),
    ...predictionData,
  ];

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{ margin: '0 0 1rem', color: '#333' }}>Predicted Sales (Next 4 Weeks)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={combined} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          <Tooltip contentStyle={{ borderRadius: 4, border: '1px solid #eee' }} />
          <Legend />
          {products.slice(0, 5).map((product, i) => (
            <Line
              key={`pred-${product}`}
              type="monotone"
              dataKey={`${product}_predicted`}
              name={`${product} (predicted)`}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls
            />
          ))}
          {products.slice(0, 5).map((product, i) => (
            <Area
              key={`ci-${product}`}
              type="monotone"
              dataKey={`${product}_ci_upper`}
              name={`${product} CI`}
              stroke="none"
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.1}
              connectNulls
            />
          ))}
          {products.slice(0, 5).map((product, i) => (
            <Line
              key={`hist-${product}`}
              type="monotone"
              dataKey={product}
              name={product}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
