export const COLORS = [
  '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
  '#00bcd4', '#009688', '#4caf50', '#ff9800', '#ff5722',
];

interface ProductToggleProps {
  products: string[];
  visible: Set<string>;
  onToggle: (product: string) => void;
}

export function ProductToggle({ products, visible, onToggle }: ProductToggleProps) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {products.map((p, i) => {
        const color = COLORS[i % COLORS.length];
        const active = visible.has(p);
        return (
          <label
            key={p}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              fontSize: '0.78rem',
              padding: '0.2rem 0.6rem',
              borderRadius: 6,
              backgroundColor: active ? `${color}12` : '#f5f5f5',
              border: `1px solid ${active ? color : '#ddd'}`,
              transition: 'all 0.15s ease',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={() => onToggle(p)}
              style={{ accentColor: color, margin: 0, width: 13, height: 13 }}
            />
            <span style={{ color: active ? color : '#999', fontWeight: 500 }}>{p}</span>
          </label>
        );
      })}
    </div>
  );
}
