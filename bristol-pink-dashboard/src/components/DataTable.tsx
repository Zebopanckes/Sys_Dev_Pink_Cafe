import { useState } from 'react';
import { SalesRecord } from '../types';

interface DataTableProps {
  records: SalesRecord[];
}

type SortKey = 'date' | 'product' | 'unitsSold';

export function DataTable({ records }: DataTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sorted = [...records].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    if (sortKey === 'date') return dir * a.date.localeCompare(b.date);
    if (sortKey === 'product') return dir * a.product.localeCompare(b.product);
    return dir * (a.unitsSold - b.unitsSold);
  });

  const headerStyle = (key: SortKey): React.CSSProperties => ({
    padding: '0.75rem 1rem',
    textAlign: 'left' as const,
    cursor: 'pointer',
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #e91e63',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  });

  const arrow = (key: SortKey) => sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : '';

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <thead>
          <tr>
            <th style={headerStyle('date')} onClick={() => handleSort('date')}>
              Date{arrow('date')}
            </th>
            <th style={headerStyle('product')} onClick={() => handleSort('product')}>
              Product{arrow('product')}
            </th>
            <th style={headerStyle('unitsSold')} onClick={() => handleSort('unitsSold')}>
              Units Sold{arrow('unitsSold')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={`${r.date}-${r.product}-${i}`} style={{
              backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa',
            }}>
              <td style={{ padding: '0.5rem 1rem' }}>{r.date}</td>
              <td style={{ padding: '0.5rem 1rem' }}>{r.product}</td>
              <td style={{ padding: '0.5rem 1rem' }}>{r.unitsSold}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.5rem' }}>
        {records.length} records
      </p>
    </div>
  );
}
