"""Base class for all prediction models."""
import pandas as pd
import numpy as np
from abc import ABC, abstractmethod
from datetime import timedelta


class BasePredictor(ABC):
    """Abstract base for sales prediction models."""

    name: str = "Base"

    def _prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Convert dates to numeric features."""
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        df['week_of_year'] = df['date'].dt.isocalendar().week.astype(int)
        df['month'] = df['date'].dt.month
        df['days_since_start'] = (df['date'] - df['date'].min()).dt.days
        return df

    @abstractmethod
    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        """Train the model."""
        ...

    @abstractmethod
    def predict_values(self, X: np.ndarray) -> np.ndarray:
        """Return predictions for feature matrix X."""
        ...

    def predict(self, sales_data, training_weeks: int, forecast_weeks: int = 4) -> list[dict]:
        """Generate predictions for each product."""
        df = pd.DataFrame(sales_data)
        df['date'] = pd.to_datetime(df['date'])

        cutoff_date = df['date'].max() - timedelta(weeks=training_weeks)
        training_df = df[df['date'] >= cutoff_date].copy()

        products = training_df['product'].unique()
        all_predictions: list[dict] = []

        last_date = df['date'].max()
        forecast_dates = [last_date + timedelta(days=i + 1) for i in range(forecast_weeks * 7)]

        for product in products:
            product_data = training_df[training_df['product'] == product].copy()
            if len(product_data) < 3:
                continue

            product_data = self._prepare_features(product_data)

            feature_cols = ['day_of_week', 'day_of_month', 'week_of_year', 'month', 'days_since_start']
            X_train = product_data[feature_cols].values
            y_train = product_data['unitsSold'].values

            self.fit(X_train, y_train)

            min_date = product_data['date'].min()
            train_preds = self.predict_values(X_train)
            residual_std = float(np.std(y_train - train_preds))

            for forecast_date in forecast_dates:
                days_since = (forecast_date - min_date).days
                X_pred = np.array([[
                    forecast_date.dayofweek,
                    forecast_date.day,
                    forecast_date.isocalendar()[1],
                    forecast_date.month,
                    days_since,
                ]])

                predicted = max(0, round(float(self.predict_values(X_pred)[0]), 1))
                ci_lower = max(0, round(predicted - 1.96 * residual_std, 1))
                ci_upper = round(predicted + 1.96 * residual_std, 1)

                all_predictions.append({
                    'date': forecast_date.strftime('%Y-%m-%d'),
                    'product': product,
                    'predicted_sales': predicted,
                    'confidence_interval': [ci_lower, ci_upper],
                })

        return all_predictions
