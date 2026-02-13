"""LSTM predictor – PyTorch-based model for time-series forecasting."""
import numpy as np
import pandas as pd
from datetime import timedelta
import warnings

warnings.filterwarnings("ignore", category=UserWarning)

try:
    import torch
    import torch.nn as nn
    from sklearn.preprocessing import MinMaxScaler
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

from .base import BasePredictor

LOOKBACK = 7  # days of history per sample


class _LSTMNet(nn.Module):
    """Simple LSTM → Linear network for single-step regression."""

    def __init__(self, input_size: int = 1, hidden_size: int = 32):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, seq_len, input_size)
        _, (h_n, _) = self.lstm(x)          # h_n: (1, batch, hidden)
        out = self.fc(h_n.squeeze(0))       # (batch, 1)
        return out


class LSTMPredictor(BasePredictor):
    """LSTM (Long Short-Term Memory) neural network predictor."""

    name = "LSTM"

    def __init__(self, epochs: int = 50, units: int = 32):
        self.epochs = epochs
        self.units = units

    # ABC stubs – LSTM overrides predict() directly
    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        pass

    def predict_values(self, X: np.ndarray) -> np.ndarray:
        return np.zeros(X.shape[0])

    def predict(self, sales_data, training_weeks: int, forecast_weeks: int = 4):
        if not HAS_TORCH:
            return []

        df = pd.DataFrame(sales_data)
        df['date'] = pd.to_datetime(df['date'])

        cutoff_date = df['date'].max() - timedelta(weeks=training_weeks)
        training_df = df[df['date'] >= cutoff_date].copy()

        products = training_df['product'].unique()
        all_predictions: list[dict] = []

        last_date = df['date'].max()
        n_forecast = forecast_weeks * 7

        for product in products:
            try:
                product_data = training_df[training_df['product'] == product].copy()
                if len(product_data) < LOOKBACK + 3:
                    continue

                product_data = product_data.sort_values('date')
                ts = product_data.set_index('date')['unitsSold'].asfreq('D')
                ts = ts.ffill().bfill().fillna(0)
                values = ts.values.reshape(-1, 1).astype('float32')

                scaler = MinMaxScaler()
                scaled = scaler.fit_transform(values)

                # Build supervised samples
                X_seq, y_seq = [], []
                for i in range(LOOKBACK, len(scaled)):
                    X_seq.append(scaled[i - LOOKBACK:i, 0])
                    y_seq.append(scaled[i, 0])

                if len(X_seq) < 2:
                    continue

                X_arr = np.array(X_seq, dtype=np.float32).reshape(-1, LOOKBACK, 1)
                y_arr = np.array(y_seq, dtype=np.float32).reshape(-1, 1)

                X_t = torch.from_numpy(X_arr)
                y_t = torch.from_numpy(y_arr)

                # Build and train model
                model = _LSTMNet(input_size=1, hidden_size=self.units)
                criterion = nn.MSELoss()
                optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

                model.train()
                batch_size = 8
                n_samples = X_t.shape[0]
                for _ in range(self.epochs):
                    # Mini-batch training
                    indices = torch.randperm(n_samples)
                    for start in range(0, n_samples, batch_size):
                        idx = indices[start:start + batch_size]
                        xb, yb = X_t[idx], y_t[idx]
                        pred = model(xb)
                        loss = criterion(pred, yb)
                        optimizer.zero_grad()
                        loss.backward()
                        optimizer.step()

                # Iteratively forecast
                model.eval()
                last_window = scaled[-LOOKBACK:, 0].tolist()
                preds_scaled = []
                with torch.no_grad():
                    for _ in range(n_forecast):
                        x_in = torch.tensor(
                            [last_window[-LOOKBACK:]],
                            dtype=torch.float32
                        ).unsqueeze(-1)  # (1, LOOKBACK, 1)
                        p = float(model(x_in).item())
                        preds_scaled.append(p)
                        last_window.append(p)

                preds = scaler.inverse_transform(
                    np.array(preds_scaled).reshape(-1, 1)
                ).flatten()

                # Estimate CI from training residuals
                model.eval()
                with torch.no_grad():
                    train_preds_scaled = model(X_t).numpy().flatten()
                train_preds = scaler.inverse_transform(
                    train_preds_scaled.reshape(-1, 1)
                ).flatten()
                train_actual = scaler.inverse_transform(
                    y_arr
                ).flatten()
                residual_std = float(np.std(train_actual - train_preds))

                forecast_dates = [last_date + timedelta(days=i + 1) for i in range(n_forecast)]
                for i, fdate in enumerate(forecast_dates):
                    pred_val = max(0, round(float(preds[i]), 1))
                    ci_lo = max(0, round(pred_val - 1.96 * residual_std, 1))
                    ci_hi = round(pred_val + 1.96 * residual_std, 1)
                    all_predictions.append({
                        'date': fdate.strftime('%Y-%m-%d'),
                        'product': product,
                        'predicted_sales': pred_val,
                        'confidence_interval': [ci_lo, ci_hi],
                    })
            except Exception as e:
                print(f"[LSTM] Error forecasting {product}: {e}")
                continue

        return all_predictions
