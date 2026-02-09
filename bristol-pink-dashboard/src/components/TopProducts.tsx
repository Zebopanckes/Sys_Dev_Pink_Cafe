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
      borderRadius: 8,
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{ margin: '0 0 1rem', color }}>{title}</h3>
      {products.length === 0 ? (
        <p style={{ color: '#999' }}>No data available</p>
      ) : (
        <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {products.map((p, i) => (
            <li key={p.product} style={{
              padding: '0.5rem 0',
              borderBottom: i < products.length - 1 ? '1px solid #eee' : 'none',
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
    <div style={{ display: 'flex', gap: '1rem' }}>
      {renderList('Top 3 Foods', topFoods, '#e91e63')}
      {renderList('Top 3 Coffees', topCoffees, '#795548')}
    </div>
  );
}
