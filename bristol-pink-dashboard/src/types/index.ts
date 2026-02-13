export interface SalesData {
  date: Date;
  product: string;
  unitsSold: number;
}

export interface SalesRecord {
  date: string;
  product: string;
  unitsSold: number;
}

export interface PredictionData {
  date: Date;
  product: string;
  predictedSales: number;
  confidenceInterval: [number, number];
}

export interface TrainingPeriod {
  weeks: number;
  startDate: Date;
  endDate: Date;
}

export interface TopProduct {
  product: string;
  totalSold: number;
  category: 'food' | 'coffee';
}

export interface ChartDataPoint {
  date: string;
  [product: string]: number | string;
}

export interface AccuracyMetrics {
  mae: number;
  rmse: number;
  mape: number;
  training_time?: number;
}

export interface ModelComparisonResult {
  algorithm: string;
  name: string;
  mae: number;
  rmse: number;
  mape: number;
  training_time: number;
}

export interface WindowResult {
  window: number;
  mae: number;
  rmse: number;
  mape: number;
  training_time: number;
}

export interface TrainingWindowData {
  windows: number[];
  results: Record<string, { name: string; data: WindowResult[] }>;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export type ViewMode = 'chart' | 'table';

export type AlgorithmType =
  | 'linear_regression'
  | 'random_forest'
  | 'gradient_boosting'
  | 'arima'
  | 'lstm';
