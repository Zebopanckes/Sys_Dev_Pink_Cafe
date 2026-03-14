import { useMemo, useState } from 'react';
import { PredictionData } from '../types';
import { useTheme } from '../ThemeContext';

interface PredictionTableProps {
  predictions: PredictionData[];
}

type SortKey = 'date' | 'product' | 'predictedSales';

export function PredictionTable({ predictions }: PredictionTableProps) {
  const { theme } = useTheme();
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(true);

  const rows = useMemo(() => {
    const mapped = predictions.map((p) => ({
      date: p.date instanceof Date ? p.date.toISOString().split('T')[0] : String(p.date),
      product: p.product,
      predictedSales: p.predictedSales,
      ciLower: p.confidenceInterval[0],
      ciUpper: p.confidenceInterval[1],
    }));

    mapped.sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === 'date') return dir * a.date.localeCompare(b.date);
      if (sortKey === 'product') return dir * a.product.localeCompare(b.product);
      return dir * (a.predictedSales - b.predictedSales);
    });

    return mapped;
  }, [predictions, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
      return;
    }
    setSortKey(key);
    setSortAsc(true);
  };

  const arrow = (key: SortKey) => (sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : '');

  const headerStyle = (key: SortKey): React.CSSProperties => ({
    padding: '0.75rem 1rem',
    textAlign: key === 'product' ? 'left' : 'right',
    cursor: 'pointer',
    backgroundColor: theme.tableHeaderBg,
    borderBottom: '2px solid #e91e63',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    color: theme.text,
  });

  return (
    <div style={{
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      border: `1px solid ${theme.cardBorder}`,
      boxShadow: theme.shadow,
      padding: '1rem',
    }}>
      <h3 style={{ margin: '0 0 0.75rem', color: theme.text, fontSize: '1rem', fontWeight: 600 }}>
        Predicted Sales (Tabular View)
      </h3>
      {rows.length === 0 ? (
        <div style={{ color: theme.textMuted, fontSize: '0.9rem' }}>
          Run a prediction to populate this table.
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              color: theme.text,
              fontSize: '0.86rem',
            }}>
              <thead>
                <tr>
                  <th style={headerStyle('date')} onClick={() => handleSort('date')}>
                    Date{arrow('date')}
                  </th>
                  <th style={headerStyle('product')} onClick={() => handleSort('product')}>
                    Product{arrow('product')}
                  </th>
                  <th style={headerStyle('predictedSales')} onClick={() => handleSort('predictedSales')}>
                    Predicted{arrow('predictedSales')}
                  </th>
                  <th style={{ ...headerStyle('predictedSales'), cursor: 'default' }}>
                    95% CI
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.date}-${row.product}-${i}`} style={{
                    backgroundColor: i % 2 === 0 ? theme.cardBg : theme.tableRowAlt,
                  }}>
                    <td style={{ padding: '0.55rem 1rem', textAlign: 'right' }}>{row.date}</td>
                    <td style={{ padding: '0.55rem 1rem' }}>{row.product}</td>
                    <td style={{ padding: '0.55rem 1rem', textAlign: 'right' }}>{row.predictedSales.toFixed(1)}</td>
                    <td style={{ padding: '0.55rem 1rem', textAlign: 'right' }}>
                      {row.ciLower.toFixed(1)} - {row.ciUpper.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: theme.textMuted, fontSize: '0.8rem', margin: '0.55rem 0 0' }}>
            {rows.length} predicted rows for the currently selected cafe.
          </p>
        </>
      )}
    </div>
  );
}
