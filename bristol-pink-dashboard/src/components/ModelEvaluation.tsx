import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from 'recharts';
import { SalesRecord, ModelComparisonResult, TrainingWindowData } from '../types';
import { compareAllModels, compareTrainingWindows } from '../services/api';
import { useTheme } from '../ThemeContext';

const MODEL_COLORS: Record<string, string> = {
  linear_regression: '#e91e63',
  random_forest: '#9c27b0',
  gradient_boosting: '#3f51b5',
  arima: '#00bcd4',
  lstm: '#ff9800',
};

interface ModelEvaluationProps {
  salesRecords: SalesRecord[];
  trainingWeeks: number;
}

export function ModelEvaluation({ salesRecords, trainingWeeks }: ModelEvaluationProps) {
  const { theme } = useTheme();
  const [comparison, setComparison] = useState<ModelComparisonResult[]>([]);
  const [windowData, setWindowData] = useState<TrainingWindowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [windowMetric, setWindowMetric] = useState<'mae' | 'rmse' | 'mape'>('mae');

  const runComparison = useCallback(async () => {
    if (salesRecords.length === 0) return;
    setLoading(true);
    try {
      const [compResult, winResult] = await Promise.all([
        compareAllModels(salesRecords, trainingWeeks),
        compareTrainingWindows(salesRecords),
      ]);
      setComparison(compResult);
      setWindowData(winResult);
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setLoading(false);
    }
  }, [salesRecords, trainingWeeks]);

  useEffect(() => {
    runComparison();
  }, [runComparison]);

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    borderRadius: 12,
    padding: '1.25rem',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
    transition: 'background-color 0.3s ease',
  };

  const headingStyle: React.CSSProperties = {
    margin: '0 0 1rem',
    color: theme.text,
    fontSize: '1rem',
    fontWeight: 600,
  };

  if (loading) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: theme.textMuted }}>Evaluating all models...</div>
      </div>
    );
  }

  if (comparison.length === 0) return null;

  // Prepare bar chart data — one bar group per metric, bars per model
  const metricsBarData = comparison.map((m) => ({
    name: m.name,
    MAE: m.mae,
    RMSE: m.rmse,
    'MAPE (%)': m.mape,
  }));

  const timeBarData = comparison.map((m) => ({
    name: m.name,
    'Time (s)': m.training_time,
  }));

  // Find best model (lowest MAE)
  const bestModel = comparison.reduce((a, b) => (a.mae < b.mae ? a : b));

  // Training window line chart data
  const windowLineData: Record<string, string | number>[] = [];
  if (windowData) {
    for (const w of windowData.windows) {
      const point: Record<string, string | number> = { window: `${w}w` };
      for (const [, info] of Object.entries(windowData.results)) {
        const row = info.data.find((d) => d.window === w);
        if (row) {
          point[info.name] = row[windowMetric];
        }
      }
      windowLineData.push(point);
    }
  }

  const algorithmNames = windowData
    ? Object.values(windowData.results).map((r) => r.name)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Comparison Table */}
      <div style={cardStyle}>
        <h3 style={headingStyle}>Model Comparison — {trainingWeeks} Week Training</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem',
            color: theme.text,
          }}>
            <thead>
              <tr style={{ borderBottom: `2px solid #e91e63` }}>
                <th style={{ padding: '0.6rem 1rem', textAlign: 'left', backgroundColor: theme.tableHeaderBg }}>Model</th>
                <th style={{ padding: '0.6rem 1rem', textAlign: 'right', backgroundColor: theme.tableHeaderBg }}>MAE</th>
                <th style={{ padding: '0.6rem 1rem', textAlign: 'right', backgroundColor: theme.tableHeaderBg }}>RMSE</th>
                <th style={{ padding: '0.6rem 1rem', textAlign: 'right', backgroundColor: theme.tableHeaderBg }}>MAPE (%)</th>
                <th style={{ padding: '0.6rem 1rem', textAlign: 'right', backgroundColor: theme.tableHeaderBg }}>Time (s)</th>
                <th style={{ padding: '0.6rem 1rem', textAlign: 'center', backgroundColor: theme.tableHeaderBg }}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {[...comparison]
                .sort((a, b) => a.mae - b.mae)
                .map((m, i) => (
                  <tr key={m.algorithm} style={{
                    backgroundColor: i % 2 === 0 ? theme.cardBg : theme.tableRowAlt,
                    fontWeight: m.algorithm === bestModel.algorithm ? 600 : 400,
                  }}>
                    <td style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                        backgroundColor: MODEL_COLORS[m.algorithm] || '#999', flexShrink: 0,
                      }} />
                      {m.name}
                      {m.algorithm === bestModel.algorithm && (
                        <span style={{ fontSize: '0.7rem', color: '#4caf50', marginLeft: 4 }}>★ Best</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>{m.mae.toFixed(2)}</td>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>{m.rmse.toFixed(2)}</td>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>{m.mape.toFixed(2)}%</td>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>{m.training_time.toFixed(3)}s</td>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>#{i + 1}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accuracy Bar Chart */}
      <div style={cardStyle}>
        <h3 style={headingStyle}>Accuracy Comparison (MAE / RMSE / MAPE)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metricsBarData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme.chartAxisTick }} />
            <YAxis tick={{ fontSize: 11, fill: theme.chartAxisTick }} />
            <Tooltip contentStyle={{
              borderRadius: 8, border: `1px solid ${theme.tooltipBorder}`,
              fontSize: '0.85rem', backgroundColor: theme.tooltipBg, color: theme.text,
            }} />
            <Legend wrapperStyle={{ fontSize: '0.8rem', color: theme.textSecondary }} />
            <Bar dataKey="MAE" fill="#e91e63" radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="RMSE" fill="#9c27b0" radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="MAPE (%)" fill="#3f51b5" radius={[4, 4, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Training Time Comparison */}
      <div style={cardStyle}>
        <h3 style={headingStyle}>Training Time Comparison</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={timeBarData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
            <XAxis type="number" tick={{ fontSize: 11, fill: theme.chartAxisTick }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: theme.chartAxisTick }} width={80} />
            <Tooltip contentStyle={{
              borderRadius: 8, border: `1px solid ${theme.tooltipBorder}`,
              fontSize: '0.85rem', backgroundColor: theme.tooltipBg, color: theme.text,
            }} formatter={(v: number) => [`${v.toFixed(3)}s`, 'Time']} />
            <Bar dataKey="Time (s)" fill="#ff9800" radius={[0, 4, 4, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Training Window Analysis */}
      {windowData && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, color: theme.text, fontSize: '1rem', fontWeight: 600 }}>
              Performance Across Training Windows
            </h3>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {(['mae', 'rmse', 'mape'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setWindowMetric(metric)}
                  style={{
                    padding: '0.3rem 0.7rem',
                    backgroundColor: windowMetric === metric ? '#e91e63' : theme.inputBg,
                    color: windowMetric === metric ? '#fff' : theme.textSecondary,
                    border: `1px solid ${windowMetric === metric ? '#e91e63' : theme.inputBorder}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                  }}
                >
                  {metric.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={windowLineData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
              <XAxis dataKey="window" tick={{ fontSize: 11, fill: theme.chartAxisTick }} />
              <YAxis tick={{ fontSize: 11, fill: theme.chartAxisTick }} />
              <Tooltip contentStyle={{
                borderRadius: 8, border: `1px solid ${theme.tooltipBorder}`,
                fontSize: '0.85rem', backgroundColor: theme.tooltipBg, color: theme.text,
              }} />
              <Legend wrapperStyle={{ fontSize: '0.8rem', color: theme.textSecondary }} />
              {algorithmNames.map((name, i) => {
                const algoKey = Object.keys(windowData.results).find(
                  (k) => windowData.results[k].name === name
                ) ?? '';
                return (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={MODEL_COLORS[algoKey] || `hsl(${i * 72}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
          <p style={{ fontSize: '0.8rem', color: theme.textMuted, marginTop: '0.5rem', marginBottom: 0 }}>
            Shows how each model's {windowMetric.toUpperCase()} changes as the training window increases from 3 to 8 weeks.
          </p>
        </div>
      )}
    </div>
  );
}
