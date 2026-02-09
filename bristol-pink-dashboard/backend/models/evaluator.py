import pandas as pd
import numpy as np
from datetime import timedelta
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


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


class ModelEvaluator:
    def __init__(self, algorithm='linear_regression'):
        self.algorithm = algorithm

    def _prepare_features(self, df):
        """Convert dates to numeric features for the model."""
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        df['week_of_year'] = df['date'].dt.isocalendar().week.astype(int)
        df['days_since_start'] = (df['date'] - df['date'].min()).dt.days
        return df

    def evaluate(self, sales_data, training_weeks):
        """Evaluate model accuracy using train/test split."""
        df = pd.DataFrame(sales_data)
        df['date'] = pd.to_datetime(df['date'])

        # Split: use last week as test, rest (within training window) as train
        max_date = df['date'].max()
        test_start = max_date - timedelta(weeks=1)
        train_start = max_date - timedelta(weeks=training_weeks)

        train_df = df[(df['date'] >= train_start) & (df['date'] < test_start)].copy()
        test_df = df[df['date'] >= test_start].copy()

        if len(train_df) < 3 or len(test_df) < 1:
            return {
                'mae': 0,
                'rmse': 0,
                'mape': 0,
                'r2': 0,
            }

        all_y_true = []
        all_y_pred = []

        products = train_df['product'].unique()

        for product in products:
            product_train = train_df[train_df['product'] == product].copy()
            product_test = test_df[test_df['product'] == product].copy()

            if len(product_train) < 3 or len(product_test) < 1:
                continue

            product_train = self._prepare_features(product_train)
            product_test = self._prepare_features(product_test)

            feature_cols = ['day_of_week', 'day_of_month', 'week_of_year', 'days_since_start']

            X_train = product_train[feature_cols].values
            y_train = product_train['unitsSold'].values
            X_test = product_test[feature_cols].values
            y_test = product_test['unitsSold'].values

            model_class = ALGORITHM_MAP.get(self.algorithm, LinearRegression)
            params = MODEL_PARAMS.get(self.algorithm, {})
            model = model_class(**params)
            model.fit(X_train, y_train)

            y_pred = model.predict(X_test)
            y_pred = np.maximum(y_pred, 0)

            all_y_true.extend(y_test.tolist())
            all_y_pred.extend(y_pred.tolist())

        if len(all_y_true) == 0:
            return {'mae': 0, 'rmse': 0, 'mape': 0, 'r2': 0}

        y_true = np.array(all_y_true)
        y_pred = np.array(all_y_pred)

        mae = float(mean_absolute_error(y_true, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        r2 = float(r2_score(y_true, y_pred)) if len(y_true) > 1 else 0.0

        # MAPE: avoid division by zero
        nonzero_mask = y_true != 0
        if nonzero_mask.any():
            mape = float(np.mean(np.abs((y_true[nonzero_mask] - y_pred[nonzero_mask]) / y_true[nonzero_mask])) * 100)
        else:
            mape = 0.0

        return {
            'mae': round(mae, 2),
            'rmse': round(rmse, 2),
            'mape': round(mape, 2),
            'r2': round(r2, 4),
        }
