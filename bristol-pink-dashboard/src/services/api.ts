import { PredictionData, AccuracyMetrics, AlgorithmType, ModelComparisonResult, TrainingWindowData } from '../types';

const API_BASE = '/api';

export async function getPredictions(
  salesData: { date: string; product: string; unitsSold: number }[],
  trainingWeeks: number,
  algorithm: AlgorithmType
): Promise<PredictionData[]> {
  const response = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sales_data: salesData,
      training_weeks: trainingWeeks,
      algorithm,
    }),
  });

  if (!response.ok) {
    throw new Error(`Prediction failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.predictions.map((p: { date: string; product: string; predicted_sales: number; confidence_interval: [number, number] }) => ({
    date: new Date(p.date),
    product: p.product,
    predictedSales: p.predicted_sales,
    confidenceInterval: p.confidence_interval,
  }));
}

export async function getAccuracyMetrics(
  salesData: { date: string; product: string; unitsSold: number }[],
  trainingWeeks: number,
  algorithm: AlgorithmType
): Promise<AccuracyMetrics> {
  const response = await fetch(`${API_BASE}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sales_data: salesData,
      training_weeks: trainingWeeks,
      algorithm,
    }),
  });

  if (!response.ok) {
    throw new Error(`Evaluation failed: ${response.statusText}`);
  }

  return response.json();
}

export async function compareAllModels(
  salesData: { date: string; product: string; unitsSold: number }[],
  trainingWeeks: number
): Promise<ModelComparisonResult[]> {
  const response = await fetch(`${API_BASE}/evaluate/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sales_data: salesData,
      training_weeks: trainingWeeks,
    }),
  });

  if (!response.ok) {
    throw new Error(`Comparison failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
}

export async function compareTrainingWindows(
  salesData: { date: string; product: string; unitsSold: number }[],
  windows?: number[]
): Promise<TrainingWindowData> {
  const response = await fetch(`${API_BASE}/evaluate/windows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sales_data: salesData,
      windows: windows ?? [3, 4, 5, 6, 7, 8],
    }),
  });

  if (!response.ok) {
    throw new Error(`Window comparison failed: ${response.statusText}`);
  }

  return response.json();
}
