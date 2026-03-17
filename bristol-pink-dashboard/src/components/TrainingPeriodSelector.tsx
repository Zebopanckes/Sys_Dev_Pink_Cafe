import { AlgorithmType } from '../types';
import { useTheme } from '../ThemeContext';

interface TrainingPeriodSelectorProps {
  weeks: number;
  onWeeksChange: (weeks: number) => void;
  algorithm: AlgorithmType;
  onAlgorithmChange: (algorithm: AlgorithmType) => void;
  onRunPrediction: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function TrainingPeriodSelector({
  weeks,
  onWeeksChange,
  algorithm,
  onAlgorithmChange,
  onRunPrediction,
  isLoading,
  disabled = false,
}: TrainingPeriodSelectorProps) {
  const { theme } = useTheme();
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      backgroundColor: theme.cardBg,
      borderRadius: 8,
      padding: '1rem 1.5rem',
      boxShadow: theme.shadow,
      border: `1px solid ${theme.cardBorder}`,
      flexWrap: 'wrap',
      transition: 'background-color 0.3s ease',
    }}>
      <div>
        <label style={{ fontSize: '0.85rem', color: theme.textSecondary, display: 'block', marginBottom: 4 }}>
          Training Period
        </label>
        <select
          value={weeks}
          onChange={(e) => onWeeksChange(Number(e.target.value))}
          disabled={disabled}
          aria-label="Training period selector"
          style={{
            padding: '0.5rem',
            borderRadius: 4,
            border: `1px solid ${theme.inputBorder}`,
            backgroundColor: theme.inputBg,
            color: theme.text,
            fontSize: '0.95rem',
          }}
        >
          {[4, 5, 6, 7, 8].map((w) => (
            <option key={w} value={w}>{w} weeks</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ fontSize: '0.85rem', color: theme.textSecondary, display: 'block', marginBottom: 4 }}>
          Algorithm
        </label>
        <select
          value={algorithm}
          onChange={(e) => onAlgorithmChange(e.target.value as AlgorithmType)}
          disabled={disabled}
          aria-label="Algorithm selector"
          style={{
            padding: '0.5rem',
            borderRadius: 4,
            border: `1px solid ${theme.inputBorder}`,
            backgroundColor: theme.inputBg,
            color: theme.text,
            fontSize: '0.95rem',
          }}
        >
          <option value="linear_regression">Linear Regression</option>
          <option value="random_forest">Random Forest</option>
          <option value="gradient_boosting">Gradient Boosting</option>
          <option value="arima">ARIMA</option>
          <option value="lstm">LSTM</option>
        </select>
      </div>

      <button
        onClick={onRunPrediction}
        disabled={isLoading || disabled}
        style={{
          padding: '0.5rem 1.5rem',
          backgroundColor: isLoading || disabled ? '#ccc' : '#e91e63',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          fontSize: '0.95rem',
          cursor: isLoading || disabled ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-end',
        }}
        aria-label="Run prediction"
      >
        {isLoading ? 'Running...' : disabled ? 'Role Restricted' : 'Run Prediction'}
      </button>
    </div>
  );
}
