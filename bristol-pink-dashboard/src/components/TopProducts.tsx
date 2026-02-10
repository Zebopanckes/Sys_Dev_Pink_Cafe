import { TopProduct } from '../types';

interface TopProductsProps {
  topFoods: TopProduct[];
  topCoffees: TopProduct[];
}

export function TopProducts({ topFoods, topCoffees }: TopProductsProps) {
  const renderList = (title: string, products: TopProduct[], color: string) => (
    <div style={{
      flex: 1,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0',
    }}>
      <h3 style={{ margin: '0 0 0.75rem', color, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
      {products.length === 0 ? (
        <p style={{ color: '#999', fontSize: '0.9rem' }}>No data available</p>
      ) : (
        <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {products.map((p, i) => (
            <li key={p.product} style={{
              padding: '0.4rem 0',
              borderBottom: i < products.length - 1 ? '1px solid #f0f0f0' : 'none',
              fontSize: '0.9rem',
            }}>
              <strong>{p.product}</strong>
              <span style={{ float: 'right', color: '#666' }}>
                {p.totalSold.toLocaleString()} units
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      {renderList('Top Foods', topFoods, '#e91e63')}
      {renderList('Top Coffees', topCoffees, '#795548')}
    </div>
  );
}
