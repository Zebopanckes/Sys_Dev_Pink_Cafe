import pandas as pd
import numpy as np
from datetime import timedelta
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor


ALGORITHM_MAP = {
    'linear_regression': LinearRegression,
    'random_forest': RandomForestRegressor,
    'gradient_boosting': GradientBoostingRegressor,
}

MODEL_PARAMS = {
    'linear_regression': {},
    'random_forest': {'n_estimators': 100, 'random_state': 42},
    'gradient_boosting': {'n_estimators': 100, 'random_state': 42},
}


class SalesPredictor:
    def __init__(self, algorithm='linear_regression'):
        self.algorithm = algorithm
        model_class = ALGORITHM_MAP.get(algorithm, LinearRegression)
        params = MODEL_PARAMS.get(algorithm, {})
        self.model = model_class(**params)

    def _prepare_features(self, df):
        """Convert dates to numeric features for the model."""
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        df['week_of_year'] = df['date'].dt.isocalendar().week.astype(int)
        df['days_since_start'] = (df['date'] - df['date'].min()).dt.days
        return df

    def predict(self, sales_data, training_weeks, forecast_weeks=4):
        """Generate predictions for each product."""
        df = pd.DataFrame(sales_data)
        df['date'] = pd.to_datetime(df['date'])

        # Filter to training period
        cutoff_date = df['date'].max() - timedelta(weeks=training_weeks)
        training_df = df[df['date'] >= cutoff_date].copy()

        products = training_df['product'].unique()
        all_predictions = []

        last_date = df['date'].max()
        forecast_dates = [
            last_date + timedelta(days=i + 1) for i in range(forecast_weeks * 7)
        ]

        for product in products:
            product_data = training_df[training_df['product'] == product].copy()

            if len(product_data) < 3:
                continue

            product_data = self._prepare_features(product_data)

            feature_cols = ['day_of_week', 'day_of_month', 'week_of_year', 'days_since_start']
            X_train = product_data[feature_cols].values
            y_train = product_data['unitsSold'].values

            self.model.fit(X_train, y_train)

            # Predict future dates
            min_date = product_data['date'].min()
            for forecast_date in forecast_dates:
                days_since = (forecast_date - min_date).days
                X_pred = np.array([[
                    forecast_date.dayofweek,
                    forecast_date.day,
                    forecast_date.isocalendar()[1],
                    days_since,
                ]])

                predicted = max(0, round(self.model.predict(X_pred)[0], 1))

                # Estimate confidence interval from training residuals
                train_preds = self.model.predict(X_train)
                residual_std = np.std(y_train - train_preds)
                ci_lower = max(0, round(predicted - 1.96 * residual_std, 1))
                ci_upper = round(predicted + 1.96 * residual_std, 1)

                all_predictions.append({
                    'date': forecast_date.strftime('%Y-%m-%d'),
                    'product': product,
                    'predicted_sales': predicted,
                    'confidence_interval': [ci_lower, ci_upper],
                })

        return all_predictions
