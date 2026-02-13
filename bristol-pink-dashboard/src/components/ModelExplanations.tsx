import { useTheme } from '../ThemeContext';

export function ModelExplanations() {
  const { theme } = useTheme();

  const algorithms = [
    {
      name: 'Linear Regression',
      key: 'linear_regression',
      color: '#e91e63',
      description:
        'Fits a straight-line relationship between date-based features and sales volume. Fast to train and easy to interpret, but assumes a constant linear trend — best suited for data with steady, predictable growth and no strong seasonality.',
      strengths: 'Fast, interpretable, low variance',
      weaknesses: 'Cannot capture non-linear or seasonal patterns',
    },
    {
      name: 'Random Forest',
      key: 'random_forest',
      color: '#9c27b0',
      description:
        'An ensemble of many decision trees, each trained on a random subset of the data. Predictions are averaged across all trees, reducing overfitting. Handles non-linear relationships and seasonal effects much better than linear models.',
      strengths: 'Robust, handles non-linearity, feature importance',
      weaknesses: 'Slower to train, less interpretable',
    },
    {
      name: 'Gradient Boosting',
      key: 'gradient_boosting',
      color: '#3f51b5',
      description:
        'Builds trees sequentially where each new tree corrects the errors of the previous ones. Typically achieves higher accuracy than Random Forest on structured data. Requires careful tuning to avoid overfitting.',
      strengths: 'High accuracy, handles complex patterns',
      weaknesses: 'Prone to overfitting, slower, harder to tune',
    },
    {
      name: 'ARIMA',
      key: 'arima',
      color: '#00bcd4',
      description:
        'AutoRegressive Integrated Moving Average — a classical statistical time-series model. It captures trends and autocorrelation in the series by modelling the relationship between an observation and lagged values. No feature engineering required; works directly on the sales time-series.',
      strengths: 'Purpose-built for time series, built-in confidence intervals',
      weaknesses: 'Assumes stationarity, single-variable only',
    },
    {
      name: 'LSTM',
      key: 'lstm',
      color: '#ff9800',
      description:
        'Long Short-Term Memory — a recurrent neural network designed for sequence data. It can learn complex temporal patterns by maintaining an internal memory cell that selectively remembers or forgets information over long sequences.',
      strengths: 'Learns complex patterns, captures long-range dependencies',
      weaknesses: 'Slowest to train, requires more data, less interpretable',
    },
  ];

  return (
    <div style={{
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      padding: '1.25rem',
      boxShadow: theme.shadow,
      border: `1px solid ${theme.cardBorder}`,
      transition: 'background-color 0.3s ease',
    }}>
      <h3 style={{ margin: '0 0 1rem', color: theme.text, fontSize: '1rem', fontWeight: 600 }}>
        Prediction Models Explained
      </h3>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {algorithms.map((algo) => (
          <div
            key={algo.key}
            style={{
              backgroundColor: theme.inputBg,
              borderRadius: 8,
              padding: '1rem',
              border: `1px solid ${theme.cardBorder}`,
              borderLeft: `4px solid ${algo.color}`,
            }}
          >
            <div style={{ fontWeight: 600, color: theme.text, fontSize: '0.92rem', marginBottom: '0.35rem' }}>
              {algo.name}
            </div>
            <div style={{ fontSize: '0.84rem', color: theme.textSecondary, lineHeight: 1.6, marginBottom: '0.5rem' }}>
              {algo.description}
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
              <div>
                <span style={{ color: '#4caf50', fontWeight: 600 }}>+ </span>
                <span style={{ color: theme.textMuted }}>{algo.strengths}</span>
              </div>
              <div>
                <span style={{ color: '#f44336', fontWeight: 600 }}>− </span>
                <span style={{ color: theme.textMuted }}>{algo.weaknesses}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
