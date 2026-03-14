import { useState, useMemo, useEffect, useCallback } from 'react';
import coffeeCsv from './assets/pink_coffee.csv?raw';
import croissantCsv from './assets/pink_croissant.csv?raw';
import { parseCSVText, parseCSVFile } from './services/csvParser';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { SalesRecord, AlgorithmType, ViewMode } from './types';
import { getTopProducts, aggregateByDate } from './services/dataProcessor';
import { TopProducts } from './components/TopProducts';
import { SalesChart } from './components/SalesChart';
import { PredictionChart } from './components/PredictionChart';
import { MonthlyBarChart } from './components/MonthlyBarChart';
import { ProductPieChart } from './components/ProductPieChart';
import { DailyAreaChart } from './components/DailyAreaChart';
import GlobalDropZone from './components/GlobalDropZone';
import { TrainingPeriodSelector } from './components/TrainingPeriodSelector';
import { DataTable } from './components/DataTable';
import { ModelEvaluation } from './components/ModelEvaluation';
import { ModelExplanations } from './components/ModelExplanations';
import { PredictionTable } from './components/PredictionTable';
import { getPredictions } from './services/api';
import { PredictionData } from './types';
import { useTheme } from './ThemeContext';

const CAFES = [
  { id: 'cafe-1', name: 'Bristol Pink - Academy North' },
  { id: 'cafe-2', name: 'Bristol Pink - Academy South' },
  { id: 'cafe-3', name: 'Bristol Pink - City Offices' },
  { id: 'cafe-4', name: 'Bristol Pink - Harbourside' },
  { id: 'cafe-5', name: 'Bristol Pink - Clifton' },
];

const PRIMARY_CAFE_ID = CAFES[0].id;

function buildCafeMap<T>(factory: () => T): Record<string, T> {
  return CAFES.reduce((acc, cafe) => {
    acc[cafe.id] = factory();
    return acc;
  }, {} as Record<string, T>);
}

type PredictionViewMode = 'chart' | 'table' | 'both';

function App() {
  const location = useLocation();
  const { theme, isDark, toggleTheme } = useTheme();
  const [selectedCafeId, setSelectedCafeId] = useState(PRIMARY_CAFE_ID);
  const [salesByCafe, setSalesByCafe] = useState<Record<string, SalesRecord[]>>(() => buildCafeMap(() => []));
  const [predictionsByCafe, setPredictionsByCafe] = useState<Record<string, PredictionData[]>>(() => buildCafeMap(() => []));
  const [trainingWeeks, setTrainingWeeks] = useState(4);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('linear_regression');
  const [isPredicting, setIsPredicting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [predictionViewMode, setPredictionViewMode] = useState<PredictionViewMode>('chart');

  const selectedCafe = useMemo(
    () => CAFES.find((c) => c.id === selectedCafeId) ?? CAFES[0],
    [selectedCafeId]
  );
  const salesRecords = useMemo(
    () => salesByCafe[selectedCafeId] ?? [],
    [salesByCafe, selectedCafeId]
  );
  const predictions = useMemo(
    () => predictionsByCafe[selectedCafeId] ?? [],
    [predictionsByCafe, selectedCafeId]
  );

  const topFoods = useMemo(() => getTopProducts(salesRecords, 'food', 3), [salesRecords]);
  const topCoffees = useMemo(() => getTopProducts(salesRecords, 'coffee', 3), [salesRecords]);
  const chartData = useMemo(() => aggregateByDate(salesRecords), [salesRecords]);

  const products = useMemo(() => {
    const productSet = new Set(salesRecords.map((r) => r.product));
    return Array.from(productSet);
  }, [salesRecords]);

  const handleGlobalFile = useCallback(async (file: File) => {
    try {
      const parsed = await parseCSVFile(file);
      const withProducts = parsed.map((r: SalesRecord) => ({
        ...r,
        product: r.product || (file.name.toLowerCase().includes('croissant') ? 'Croissant' : 'Product'),
      }));
      setSalesByCafe((prev) => ({
        ...prev,
        [selectedCafeId]: [...(prev[selectedCafeId] ?? []), ...withProducts],
      }));
      setPredictionsByCafe((prev) => ({
        ...prev,
        [selectedCafeId]: [],
      }));
    } catch (err) {
      console.error('Failed to load dropped file:', err);
    }
  }, [selectedCafeId]);

  useEffect(() => {
    (async () => {
      try {
        const coffeeRecords = await parseCSVText(coffeeCsv);
        const croissantRecords = await parseCSVText(croissantCsv);
        const cCoffee = coffeeRecords.map((r) => ({ ...r, product: r.product || 'Coffee' }));
        const cCroissant = croissantRecords.map((r) => ({ ...r, product: r.product || 'Croissant' }));
        setSalesByCafe((prev) => ({
          ...prev,
          [PRIMARY_CAFE_ID]: [...cCoffee, ...cCroissant],
        }));
      } catch (err) {
        console.error('Failed to load default CSVs:', err);
      }
    })();
  }, []);

  const handleRunPrediction = useCallback(async () => {
    if (salesRecords.length === 0) return;
    setIsPredicting(true);
    try {
      const result = await getPredictions(salesRecords, trainingWeeks, algorithm);
      setPredictionsByCafe((prev) => ({
        ...prev,
        [selectedCafeId]: result,
      }));
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setIsPredicting(false);
    }
  }, [salesRecords, trainingWeeks, algorithm, selectedCafeId]);

  useEffect(() => {
    if (salesRecords.length > 0 && predictions.length === 0) {
      handleRunPrediction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesRecords]);

  const predictionChartData = useMemo(() => {
    return predictions.reduce<Record<string, Record<string, number | string>>>((acc, p) => {
      const dateStr = p.date instanceof Date
        ? p.date.toISOString().split('T')[0]
        : String(p.date);
      if (!acc[dateStr]) acc[dateStr] = { date: dateStr };
      acc[dateStr][`${p.product}_predicted`] = p.predictedSales;
      acc[dateStr][`${p.product}_ci_lower`] = p.confidenceInterval[0];
      acc[dateStr][`${p.product}_ci_upper`] = p.confidenceInterval[1];
      // Add delta for stacked area rendering (upper - lower)
      acc[dateStr][`${p.product}_ci_delta`] = p.confidenceInterval[1] - p.confidenceInterval[0];
      return acc;
    }, {});
  }, [predictions]);

  const predictionDataArray = Object.values(predictionChartData) as { date: string; [key: string]: number | string | undefined }[];

  const navLinkStyle = (path: string): React.CSSProperties => ({
    display: 'block',
    padding: '0.7rem 1.25rem',
    color: location.pathname === path ? '#e91e63' : theme.textSecondary,
    backgroundColor: location.pathname === path ? (isDark ? '#3d1229' : '#fce4ec') : 'transparent',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: location.pathname === path ? 600 : 400,
    fontSize: '0.9rem',
    transition: 'all 0.15s ease',
    margin: '0 0.5rem',
  });

  const totalRecords = salesRecords.length;
  const totalUnits = salesRecords.reduce((s, r) => s + r.unitsSold, 0);

  return (
    <GlobalDropZone onFile={handleGlobalFile}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.bg, transition: 'background-color 0.3s ease' }}>
        {/* Header */}
        <header style={{
          backgroundColor: theme.headerBg,
          color: '#fff',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(233,30,99,0.2)',
          flexShrink: 0,
          zIndex: 10,
        }}>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
            Bristol Pink Cafe
          </h1>
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginRight: '0.5rem',
              padding: '0.2rem 0.45rem',
              borderRadius: 6,
              backgroundColor: 'rgba(255,255,255,0.16)',
            }}>
              <span style={{ fontSize: '0.76rem', opacity: 0.95 }}>Cafe</span>
              <select
                value={selectedCafeId}
                onChange={(e) => setSelectedCafeId(e.target.value)}
                style={{
                  border: 'none',
                  borderRadius: 4,
                  fontSize: '0.78rem',
                  padding: '0.2rem 0.35rem',
                  color: '#333',
                  minWidth: 165,
                }}
              >
                {CAFES.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>
                    {cafe.name}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>{CAFES.length} total</span>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                padding: '0.35rem 0.7rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.82rem',
                marginRight: '0.5rem',
              }}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={() => setViewMode('chart')}
              style={{
                padding: '0.35rem 0.85rem',
                backgroundColor: viewMode === 'chart' ? '#fff' : 'rgba(255,255,255,0.2)',
                color: viewMode === 'chart' ? '#e91e63' : '#fff',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: '0.82rem',
              }}
            >Charts</button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.35rem 0.85rem',
                backgroundColor: viewMode === 'table' ? '#fff' : 'rgba(255,255,255,0.2)',
                color: viewMode === 'table' ? '#e91e63' : '#fff',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: '0.82rem',
              }}
            >Table</button>
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar - stays fixed in viewport */}
          <nav style={{
            width: 200,
            minWidth: 200,
            backgroundColor: theme.sidebarBg,
            borderRight: `1px solid ${theme.sidebarBorder}`,
            padding: '0.75rem 0',
            overflowY: 'auto',
            transition: 'background-color 0.3s ease',
          }}>
            <Link to="/" style={navLinkStyle('/')}>Dashboard</Link>
            <Link to="/predictions" style={navLinkStyle('/predictions')}>Predictions</Link>
            <Link to="/data" style={navLinkStyle('/data')}>Data Table</Link>
          </nav>

          {/* Main Content - independently scrollable */}
          <main style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
            <Routes>
              <Route
                path="/"
                element={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{
                      backgroundColor: theme.cardBg,
                      borderRadius: 10,
                      border: `1px solid ${theme.cardBorder}`,
                      boxShadow: theme.shadow,
                      padding: '0.65rem 0.9rem',
                      fontSize: '0.83rem',
                      color: theme.textSecondary,
                    }}>
                      Viewing data for <strong style={{ color: theme.text }}>{selectedCafe.name}</strong>
                      {selectedCafeId !== PRIMARY_CAFE_ID && salesRecords.length === 0 && (
                        <span> - this cafe currently has no loaded data.</span>
                      )}
                    </div>
                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: '1rem 1.25rem', boxShadow: theme.shadow, border: `1px solid ${theme.cardBorder}`, transition: 'background-color 0.3s ease' }}>
                        <div style={{ fontSize: '0.75rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Products</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e91e63', marginTop: 2 }}>{products.length}</div>
                      </div>
                      <div style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: '1rem 1.25rem', boxShadow: theme.shadow, border: `1px solid ${theme.cardBorder}`, transition: 'background-color 0.3s ease' }}>
                        <div style={{ fontSize: '0.75rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Total Records</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.text, marginTop: 2 }}>{totalRecords.toLocaleString()}</div>
                      </div>
                      <div style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: '1rem 1.25rem', boxShadow: theme.shadow, border: `1px solid ${theme.cardBorder}`, transition: 'background-color 0.3s ease' }}>
                        <div style={{ fontSize: '0.75rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Total Units Sold</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.text, marginTop: 2 }}>{totalUnits.toLocaleString()}</div>
                      </div>
                    </div>

                    {salesRecords.length > 0 && viewMode === 'chart' && (
                      <>
                        <TopProducts topFoods={topFoods} topCoffees={topCoffees} />
                        <SalesChart chartData={chartData} products={products} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <MonthlyBarChart chartData={chartData} products={products} />
                          <ProductPieChart chartData={chartData} products={products} />
                        </div>
                        <DailyAreaChart chartData={chartData} products={products} />
                      </>
                    )}

                    {salesRecords.length > 0 && viewMode === 'table' && (
                      <DataTable records={salesRecords} />
                    )}
                  </div>
                }
              />
              <Route
                path="/predictions"
                element={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {salesRecords.length === 0 ? (
                      <div style={{
                        textAlign: 'center', padding: '3rem',
                        backgroundColor: theme.cardBg, borderRadius: 12,
                        boxShadow: theme.shadow, border: `1px solid ${theme.cardBorder}`, color: theme.textMuted,
                      }}>
                        Upload sales data on the Dashboard first.
                      </div>
                    ) : (
                      <>
                        <TrainingPeriodSelector
                          weeks={trainingWeeks}
                          onWeeksChange={setTrainingWeeks}
                          algorithm={algorithm}
                          onAlgorithmChange={setAlgorithm}
                          onRunPrediction={handleRunPrediction}
                          isLoading={isPredicting}
                        />
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          backgroundColor: theme.cardBg,
                          borderRadius: 10,
                          border: `1px solid ${theme.cardBorder}`,
                          boxShadow: theme.shadow,
                          padding: '0.5rem',
                          width: 'fit-content',
                        }}>
                          <span style={{ fontSize: '0.8rem', color: theme.textSecondary, margin: '0 0.35rem' }}>
                            Prediction View
                          </span>
                          {([
                            { key: 'chart', label: 'Chart' },
                            { key: 'table', label: 'Table' },
                            { key: 'both', label: 'Both' },
                          ] as const).map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => setPredictionViewMode(opt.key)}
                              style={{
                                padding: '0.35rem 0.8rem',
                                backgroundColor: predictionViewMode === opt.key ? '#e91e63' : theme.inputBg,
                                color: predictionViewMode === opt.key ? '#fff' : theme.textSecondary,
                                border: `1px solid ${predictionViewMode === opt.key ? '#e91e63' : theme.inputBorder}`,
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: 500,
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {(predictionViewMode === 'chart' || predictionViewMode === 'both') && (
                          <PredictionChart
                            historicalData={chartData}
                            predictionData={predictionDataArray}
                            products={products.slice(0, 5)}
                          />
                        )}
                        {(predictionViewMode === 'table' || predictionViewMode === 'both') && (
                          <PredictionTable predictions={predictions} />
                        )}
                        <ModelExplanations />
                        <ModelEvaluation
                          salesRecords={salesRecords}
                          trainingWeeks={trainingWeeks}
                        />
                      </>
                    )}
                  </div>
                }
              />
              <Route
                path="/data"
                element={
                  salesRecords.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '3rem',
                      backgroundColor: theme.cardBg, borderRadius: 12,
                      boxShadow: theme.shadow, border: `1px solid ${theme.cardBorder}`, color: theme.textMuted,
                    }}>
                      Upload sales data on the Dashboard first.
                    </div>
                  ) : (
                    <DataTable records={salesRecords} />
                  )
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </GlobalDropZone>
  );
}

export default App;
