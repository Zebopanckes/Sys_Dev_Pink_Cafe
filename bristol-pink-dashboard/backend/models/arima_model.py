"""ARIMA predictor – uses statsmodels auto_arima-style fitting."""
import numpy as np
import pandas as pd
from datetime import timedelta

try:
    from statsmodels.tsa.arima.model import ARIMA as StatsARIMA
    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False

from .base import BasePredictor


class ARIMAPredictor(BasePredictor):
    """ARIMA time-series model.

    Unlike the sklearn-based models this operates directly on the
    time-ordered series (y values only) rather than a feature matrix,
    so we override `predict()` entirely.
    """

    name = "ARIMA"

    def __init__(self, order=(2, 1, 2)):
        self.order = order
        self._model_fit = None

    # -- These are unused for ARIMA but required by the ABC --
    def fit(self, X: np.ndarray, y: np.ndarray) -> None:  # pragma: no cover
        pass

    def predict_values(self, X: np.ndarray) -> np.ndarray:  # pragma: no cover
        return np.zeros(X.shape[0])

    # -- Override the high-level predict method --
    def predict(self, sales_data, training_weeks: int, forecast_weeks: int = 4):
        if not HAS_STATSMODELS:
            # Graceful fallback – return empty predictions
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
            product_data = training_df[training_df['product'] == product].copy()
            if len(product_data) < 5:
                continue

            product_data = product_data.sort_values('date')
            ts = product_data.set_index('date')['unitsSold'].asfreq('D')
            ts = ts.ffill().bfill().fillna(0)

            if len(ts) < 5:
                continue

            try:
                model = StatsARIMA(ts, order=self.order)
                fit = model.fit(method_kwargs={'warn_convergence': False})
                forecast = fit.get_forecast(steps=n_forecast)
                predicted_mean = forecast.predicted_mean.values
                conf_int = forecast.conf_int(alpha=0.05).values
            except Exception:
                # If ARIMA fails for this product, skip
                continue

            forecast_dates = [last_date + timedelta(days=i + 1) for i in range(n_forecast)]
            for i, fdate in enumerate(forecast_dates):
                pred = max(0, round(float(predicted_mean[i]), 1))
                ci_lo = max(0, round(float(conf_int[i, 0]), 1))
                ci_hi = round(float(conf_int[i, 1]), 1)
                all_predictions.append({
                    'date': fdate.strftime('%Y-%m-%d'),
                    'product': product,
                    'predicted_sales': pred,
                    'confidence_interval': [ci_lo, ci_hi],
                })

        return all_predictions
