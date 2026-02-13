import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Theme {
  mode: 'light' | 'dark';
  bg: string;
  cardBg: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  headerBg: string;
  sidebarBg: string;
  sidebarBorder: string;
  inputBg: string;
  inputBorder: string;
  shadow: string;
  gridStroke: string;
  tooltipBg: string;
  tooltipBorder: string;
  tableRowAlt: string;
  tableHeaderBg: string;
  dropOverlay: string;
  chartAxisTick: string;
}

const lightTheme: Theme = {
  mode: 'light',
  bg: '#f7f7f8',
  cardBg: '#fff',
  cardBorder: '#f0f0f0',
  text: '#333',
  textSecondary: '#555',
  textMuted: '#999',
  headerBg: '#e91e63',
  sidebarBg: '#fff',
  sidebarBorder: '#eee',
  inputBg: '#fff',
  inputBorder: '#ddd',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  gridStroke: '#eee',
  tooltipBg: '#fff',
  tooltipBorder: '#eee',
  tableRowAlt: '#fafafa',
  tableHeaderBg: '#f5f5f5',
  dropOverlay: 'rgba(0,0,0,0.35)',
  chartAxisTick: '#666',
};

const darkTheme: Theme = {
  mode: 'dark',
  bg: '#1a1a2e',
  cardBg: '#16213e',
  cardBorder: '#1f3056',
  text: '#e0e0e0',
  textSecondary: '#b0b0b0',
  textMuted: '#777',
  headerBg: '#ad1457',
  sidebarBg: '#0f1a30',
  sidebarBorder: '#1f3056',
  inputBg: '#1a2744',
  inputBorder: '#2a3f60',
  shadow: '0 1px 3px rgba(0,0,0,0.3)',
  gridStroke: '#2a3f60',
  tooltipBg: '#16213e',
  tooltipBorder: '#2a3f60',
  tableRowAlt: '#1a2744',
  tableHeaderBg: '#0f1a30',
  dropOverlay: 'rgba(0,0,0,0.6)',
  chartAxisTick: '#8899aa',
};

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
