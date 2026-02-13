import { TopProduct } from '../types';
import { useTheme } from '../ThemeContext';

interface TopProductsProps {
  topFoods: TopProduct[];
  topCoffees: TopProduct[];
}

export function TopProducts({ topFoods, topCoffees }: TopProductsProps) {
  const { theme } = useTheme();
  const renderList = (title: string, products: TopProduct[], color: string) => (
    <div style={{
      flex: 1,
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      padding: '1.25rem',
      boxShadow: theme.shadow,
      border: `1px solid ${theme.cardBorder}`,
      transition: 'background-color 0.3s ease',
    }}>
      <h3 style={{ margin: '0 0 0.75rem', color, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
      {products.length === 0 ? (
        <p style={{ color: theme.textMuted, fontSize: '0.9rem' }}>No data available</p>
      ) : (
        <ol style={{ margin: 0, paddingLeft: '1.25rem', color: theme.text }}>
          {products.map((p, i) => (
            <li key={p.product} style={{
              padding: '0.4rem 0',
              borderBottom: i < products.length - 1 ? `1px solid ${theme.cardBorder}` : 'none',
              fontSize: '0.9rem',
            }}>
              <strong>{p.product}</strong>
              <span style={{ float: 'right', color: theme.textSecondary }}>
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
