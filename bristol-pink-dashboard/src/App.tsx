import { useState, useMemo } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { SalesRecord, AlgorithmType, ViewMode } from './types';
import { getTopProducts, aggregateByDate } from './services/dataProcessor';
import { FileUploader } from './components/FileUploader';
import { TopProducts } from './components/TopProducts';
import { SalesChart } from './components/SalesChart';
import { PredictionChart } from './components/PredictionChart';
import { TrainingPeriodSelector } from './components/TrainingPeriodSelector';
import { DataTable } from './components/DataTable';
import { getPredictions } from './services/api';
import { PredictionData } from './types';

function App() {
  const location = useLocation();
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [trainingWeeks, setTrainingWeeks] = useState(4);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('linear_regression');
  const [isPredicting, setIsPredicting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chart');

  const topFoods = useMemo(() => getTopProducts(salesRecords, 'food', 3), [salesRecords]);
  const topCoffees = useMemo(() => getTopProducts(salesRecords, 'coffee', 3), [salesRecords]);
  const chartData = useMemo(() => aggregateByDate(salesRecords), [salesRecords]);

  const products = useMemo(() => {
    const productSet = new Set(salesRecords.map((r) => r.product));
    return Array.from(productSet);
  }, [salesRecords]);

  const handleFileLoaded = (records: SalesRecord[]) => {
    setSalesRecords(records);
    setPredictions([]);
  };

  const handleRunPrediction = async () => {
    if (salesRecords.length === 0) return;
    setIsPredicting(true);
    try {
      const result = await getPredictions(salesRecords, trainingWeeks, algorithm);
      setPredictions(result);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setIsPredicting(false);
    }
  };

  // Build prediction chart data
  const predictionChartData = useMemo(() => {
    return predictions.reduce<Record<string, Record<string, number | string>>>((acc, p) => {
      const dateStr = p.date instanceof Date
        ? p.date.toISOString().split('T')[0]
        : String(p.date);
      if (!acc[dateStr]) acc[dateStr] = { date: dateStr };
      acc[dateStr][`${p.product}_predicted`] = p.predictedSales;
      acc[dateStr][`${p.product}_ci_upper`] = p.confidenceInterval[1];
      return acc;
    }, {});
  }, [predictions]);

  const predictionDataArray = Object.values(predictionChartData);

  const navLinkStyle = (path: string): React.CSSProperties => ({
    display: 'block',
    padding: '0.75rem 1.5rem',
    color: location.pathname === path ? '#e91e63' : '#666',
    backgroundColor: location.pathname === path ? '#fce4ec' : 'transparent',
    borderRadius: 4,
    textDecoration: 'none',
    fontWeight: location.pathname === path ? 600 : 400,
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#e91e63',
        color: '#fff',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
          Bristol Pink Cafe
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setViewMode('chart')}
            style={{
              padding: '0.4rem 1rem',
              backgroundColor: viewMode === 'chart' ? '#fff' : 'rgba(255,255,255,0.2)',
              color: viewMode === 'chart' ? '#e91e63' : '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Charts
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '0.4rem 1rem',
              backgroundColor: viewMode === 'table' ? '#fff' : 'rgba(255,255,255,0.2)',
              color: viewMode === 'table' ? '#e91e63' : '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Table
          </button>
        </div>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <nav style={{
          width: 220,
          backgroundColor: '#fff',
          borderRight: '1px solid #eee',
          padding: '1rem 0',
          minHeight: 'calc(100vh - 60px)',
        }}>
          <Link to="/" style={navLinkStyle('/')}>Dashboard</Link>
          <Link to="/predictions" style={navLinkStyle('/predictions')}>Predictions</Link>
          <Link to="/data" style={navLinkStyle('/data')}>Data Table</Link>
        </nav>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '1.5rem', maxWidth: 'calc(100vw - 220px)' }}>
          <Routes>
            <Route
              path="/"
              element={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <FileUploader onFileLoaded={handleFileLoaded} />
                  {salesRecords.length > 0 && (
                    <>
                      <TopProducts topFoods={topFoods} topCoffees={topCoffees} />
                      {viewMode === 'chart' ? (
                        <SalesChart chartData={chartData} products={products} />
                      ) : (
                        <DataTable records={salesRecords} />
                      )}
                    </>
                  )}
                </div>
              }
            />
            <Route
              path="/predictions"
              element={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {salesRecords.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem',
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      color: '#999',
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
                      <PredictionChart
                        historicalData={chartData}
                        predictionData={predictionDataArray}
                        products={products.slice(0, 5)}
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
                    textAlign: 'center',
                    padding: '3rem',
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    color: '#999',
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
  );
}

export default App;
