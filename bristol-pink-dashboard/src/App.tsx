import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import { getCurrentUser, getPredictions, getStoredUser, logout } from './services/api';
import { PredictionData, AuthUser } from './types';
import { useTheme } from './ThemeContext';
import { LoginForm } from './components/LoginForm';

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
  const [showModelExplanations, setShowModelExplanations] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [authReady, setAuthReady] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const closeModalButtonRef = useRef<HTMLButtonElement | null>(null);

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
  const canRunModels = user?.role === 'manager' || user?.role === 'analyst';

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
      setIngestError(null);
    } catch (err) {
      console.error('Failed to load dropped file:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error while parsing CSV.';
      setIngestError(`Could not import "${file.name}": ${msg}`);
    }
  }, [selectedCafeId]);

  const handleIngestReject = useCallback((reason: string) => {
    setIngestError(reason);
  }, []);

  useEffect(() => {
    (async () => {
      const stored = getStoredUser();
      if (!stored) {
        setAuthReady(true);
        return;
      }
      try {
        const current = await getCurrentUser();
        setUser(current);
      } catch {
        setUser(null);
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const coffeeRecords = await parseCSVText(coffeeCsv);
        const croissantRecords = await parseCSVText(croissantCsv);
        const cCoffee = coffeeRecords.map((r) => ({ ...r, product: r.product || 'Coffee' }));
        const cCroissant = croissantRecords.map((r) => ({ ...r, product: r.product || 'Croissant' }));
        setSalesByCafe((prev) => {
          // Don't clobber data the user may have already dropped
          if ((prev[PRIMARY_CAFE_ID]?.length ?? 0) > 0) return prev;
          return {
            ...prev,
            [PRIMARY_CAFE_ID]: [...cCoffee, ...cCroissant],
          };
        });
      } catch (err) {
        console.error('Failed to load default CSVs:', err);
      }
    })();
  }, []);

  const handleRunPrediction = useCallback(async () => {
    if (salesRecords.length === 0 || !canRunModels) return;
    setIsPredicting(true);
    try {
      const result = await getPredictions(salesRecords, trainingWeeks, algorithm);
      setPredictionsByCafe((prev) => ({
        ...prev,
        [selectedCafeId]: result,
      }));
    } catch (err) {
      console.error('Prediction failed:', err);
      alert(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setIsPredicting(false);
    }
  }, [salesRecords, trainingWeeks, algorithm, selectedCafeId, canRunModels]);

  const handleLogout = useCallback(async () => {
    await logout();
    setUser(null);
  }, []);

  useEffect(() => {
    if (salesRecords.length > 0 && predictions.length === 0) {
      handleRunPrediction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesRecords]);

  useEffect(() => {
    if (!showModelExplanations) return;

    closeModalButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModelExplanations(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showModelExplanations]);

  useEffect(() => {
    if (!ingestError) return;
    const t = window.setTimeout(() => setIngestError(null), 6000);
    return () => window.clearTimeout(t);
  }, [ingestError]);

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

  if (!authReady) {
    return <div style={{ padding: '2rem', fontFamily: 'inherit' }}>Loading authentication...</div>;
  }

  if (!user) {
    return <LoginForm onLoggedIn={setUser} />;
  }

  return (
    <GlobalDropZone onFile={handleGlobalFile} onReject={handleIngestReject}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.bg, transition: 'background-color 0.3s ease' }}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {ingestError && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 10000,
              maxWidth: 380,
              backgroundColor: '#b71c1c',
              color: '#fff',
              padding: '0.75rem 1rem',
              borderRadius: 8,
              boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            <span style={{ flex: 1, lineHeight: 1.35 }}>
              <strong style={{ display: 'block', marginBottom: 2 }}>CSV import failed</strong>
              {ingestError}
            </span>
            <button
              type="button"
              onClick={() => setIngestError(null)}
              aria-label="Dismiss error"
              style={{
                background: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: 4,
                padding: '0 0.5rem',
                cursor: 'pointer',
                lineHeight: 1.5,
              }}
            >
              ×
            </button>
          </div>
        )}
        {/* Header */}
        <header aria-label="Application header" style={{
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
                aria-label="Select cafe location"
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
            <div
              style={{
                fontSize: '0.78rem',
                marginRight: '0.55rem',
                backgroundColor: 'rgba(255,255,255,0.16)',
                borderRadius: 6,
                padding: '0.22rem 0.5rem',
              }}
              aria-label="Current user role"
            >
              {user.username} ({user.role})
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
              onClick={handleLogout}
              style={{
                padding: '0.35rem 0.7rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.82rem',
                marginRight: '0.45rem',
              }}
              aria-label="Sign out"
            >
              Sign out
            </button>
            <button
              onClick={() => setViewMode('chart')}
              aria-pressed={viewMode === 'chart'}
              style={{
                padding: '0.35rem 0.85rem',
                backgroundColor: viewMode === 'chart' ? '#fff' : 'rgba(255,255,255,0.2)',
                color: viewMode === 'chart' ? '#e91e63' : '#fff',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: '0.82rem',
              }}
            >Charts</button>
            <button
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
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
          <nav aria-label="Primary navigation" style={{
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
          <main id="main-content" tabIndex={-1} style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
            <div aria-live="polite" className="sr-only">
              {isPredicting ? 'Prediction is running' : 'Prediction is idle'}
            </div>
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
                    {!canRunModels && (
                      <div style={{
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffe08a',
                        borderRadius: 8,
                        color: '#6b5300',
                        fontSize: '0.85rem',
                        padding: '0.6rem 0.8rem',
                      }}>
                        Your role is <strong>{user.role}</strong>. Prediction and model evaluation are disabled for viewer accounts.
                      </div>
                    )}
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
                          onOpenModelExplanations={() => setShowModelExplanations(true)}
                          isLoading={isPredicting}
                          disabled={!canRunModels}
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
                              aria-pressed={predictionViewMode === opt.key}
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
                        {canRunModels && (
                          <ModelEvaluation
                            salesRecords={salesRecords}
                            trainingWeeks={trainingWeeks}
                          />
                        )}
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
            {showModelExplanations && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  zIndex: 1000,
                }}
                role="dialog"
                aria-modal="true"
                aria-label="Model explanations"
                onClick={() => setShowModelExplanations(false)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: 'min(920px, 100%)',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    backgroundColor: theme.cardBg,
                    borderRadius: 12,
                    padding: '1rem',
                    border: `1px solid ${theme.cardBorder}`,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h2 style={{ margin: 0, color: theme.text, fontSize: '1.05rem' }}>Model Explanations</h2>
                    <button
                      ref={closeModalButtonRef}
                      onClick={() => setShowModelExplanations(false)}
                      style={{
                        border: `1px solid ${theme.inputBorder}`,
                        backgroundColor: theme.inputBg,
                        color: theme.text,
                        borderRadius: 6,
                        padding: '0.35rem 0.7rem',
                        cursor: 'pointer',
                      }}
                      aria-label="Close model explanations"
                    >
                      Close
                    </button>
                  </div>
                  <ModelExplanations />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </GlobalDropZone>
  );
}

export default App;
