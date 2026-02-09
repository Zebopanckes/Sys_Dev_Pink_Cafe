import { AlgorithmType } from '../types';

interface TrainingPeriodSelectorProps {
  weeks: number;
  onWeeksChange: (weeks: number) => void;
  algorithm: AlgorithmType;
  onAlgorithmChange: (algorithm: AlgorithmType) => void;
  onRunPrediction: () => void;
  isLoading: boolean;
}

export function TrainingPeriodSelector({
  weeks,
  onWeeksChange,
  algorithm,
  onAlgorithmChange,
  onRunPrediction,
  isLoading,
}: TrainingPeriodSelectorProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: '1rem 1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      flexWrap: 'wrap',
    }}>
      <div>
        <label style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: 4 }}>
          Training Period
        </label>
        <select
          value={weeks}
          onChange={(e) => onWeeksChange(Number(e.target.value))}
          style={{
            padding: '0.5rem',
            borderRadius: 4,
            border: '1px solid #ddd',
            fontSize: '0.95rem',
          }}
        >
          {[4, 5, 6, 7, 8].map((w) => (
            <option key={w} value={w}>{w} weeks</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: 4 }}>
          Algorithm
        </label>
        <select
          value={algorithm}
          onChange={(e) => onAlgorithmChange(e.target.value as AlgorithmType)}
          style={{
            padding: '0.5rem',
            borderRadius: 4,
            border: '1px solid #ddd',
            fontSize: '0.95rem',
          }}
        >
          <option value="linear_regression">Linear Regression</option>
          <option value="random_forest">Random Forest</option>
          <option value="gradient_boosting">Gradient Boosting</option>
        </select>
      </div>

      <button
        onClick={onRunPrediction}
        disabled={isLoading}
        style={{
          padding: '0.5rem 1.5rem',
          backgroundColor: isLoading ? '#ccc' : '#e91e63',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          fontSize: '0.95rem',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-end',
        }}
      >
        {isLoading ? 'Running...' : 'Run Prediction'}
      </button>
    </div>
  );
}
