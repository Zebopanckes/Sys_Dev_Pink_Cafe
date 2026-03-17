import { PredictionData, AccuracyMetrics, AlgorithmType, ModelComparisonResult, TrainingWindowData, AuthUser } from '../types';

const API_BASE = '/api';
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || 'Login failed');
  }

  localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
  return payload.user as AuthUser;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    clearSession();
    throw new Error(payload?.error || 'Authentication expired');
  }
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
  return payload.user as AuthUser;
}

export async function logout(): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    clearSession();
    return;
  }
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
  });
  clearSession();
}

async function parseError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = await response.json();
    return new Error(payload?.error || fallback);
  } catch {
    return new Error(fallback);
  }
}

export async function getPredictions(
  salesData: { date: string; product: string; unitsSold: number }[],
  trainingWeeks: number,
  algorithm: AlgorithmType
): Promise<PredictionData[]> {
  const response = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      sales_data: salesData,
      training_weeks: trainingWeeks,
      algorithm,
    }),
  });

  if (!response.ok) {
    throw await parseError(response, 'Prediction failed');
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
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      sales_data: salesData,
      training_weeks: trainingWeeks,
      algorithm,
    }),
  });

  if (!response.ok) {
    throw await parseError(response, 'Evaluation failed');
  }

  return response.json();
}

export async function compareAllModels(
  salesData: { date: string; product: string; unitsSold: number }[],
  trainingWeeks: number
): Promise<ModelComparisonResult[]> {
  const response = await fetch(`${API_BASE}/evaluate/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      sales_data: salesData,
      training_weeks: trainingWeeks,
    }),
  });

  if (!response.ok) {
    throw await parseError(response, 'Comparison failed');
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
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      sales_data: salesData,
      windows: windows ?? [3, 4, 5, 6, 7, 8],
    }),
  });

  if (!response.ok) {
    throw await parseError(response, 'Window comparison failed');
  }

  return response.json();
}
