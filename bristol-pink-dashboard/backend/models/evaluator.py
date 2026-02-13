"""Model evaluator – computes MAE, RMSE, MAPE for each algorithm."""
import time
import pandas as pd
import numpy as np
from datetime import timedelta
from sklearn.metrics import mean_absolute_error, mean_squared_error

from . import ALGORITHM_MAP, ALL_ALGORITHMS


def _prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['date'] = pd.to_datetime(df['date'])
    df['day_of_week'] = df['date'].dt.dayofweek
    df['day_of_month'] = df['date'].dt.day
    df['week_of_year'] = df['date'].dt.isocalendar().week.astype(int)
    df['month'] = df['date'].dt.month
    df['days_since_start'] = (df['date'] - df['date'].min()).dt.days
    return df


FEATURE_COLS = ['day_of_week', 'day_of_month', 'week_of_year', 'month', 'days_since_start']


def _evaluate_sklearn_model(model, train_df, test_df, products):
    """Evaluate an sklearn-style model (fit/predict_values interface)."""
    all_y_true, all_y_pred = [], []

    for product in products:
        pt = train_df[train_df['product'] == product].copy()
        pte = test_df[test_df['product'] == product].copy()
        if len(pt) < 3 or len(pte) < 1:
            continue
        pt = _prepare_features(pt)
        pte = _prepare_features(pte)
        X_train, y_train = pt[FEATURE_COLS].values, pt['unitsSold'].values
        X_test, y_test = pte[FEATURE_COLS].values, pte['unitsSold'].values
        model.fit(X_train, y_train)
        y_pred = np.maximum(model.predict_values(X_test), 0)
        all_y_true.extend(y_test.tolist())
        all_y_pred.extend(y_pred.tolist())

    return np.array(all_y_true), np.array(all_y_pred)


def _evaluate_ts_model(model_cls, train_df, test_df, products, training_weeks):
    """Evaluate a time-series model (ARIMA / LSTM) by running its predict method
    and comparing against the test period."""
    all_y_true, all_y_pred = [], []

    # The TS models generate forecasts from the end of their data,
    # so we give them only training data and compare to test dates.
    test_dates = set()
    for product in products:
        pte = test_df[test_df['product'] == product]
        for _, row in pte.iterrows():
            test_dates.add(row['date'].strftime('%Y-%m-%d') if hasattr(row['date'], 'strftime') else str(row['date']))

    model = model_cls()
    train_records = train_df.to_dict('records')
    # Forecast 1 week (the test period)
    preds = model.predict(train_records, training_weeks, forecast_weeks=1)

    pred_map = {}
    for p in preds:
        key = (p['date'], p['product'])
        pred_map[key] = p['predicted_sales']

    for product in products:
        pte = test_df[test_df['product'] == product]
        for _, row in pte.iterrows():
            date_str = row['date'].strftime('%Y-%m-%d') if hasattr(row['date'], 'strftime') else str(row['date'])
            key = (date_str, product)
            if key in pred_map:
                all_y_true.append(row['unitsSold'])
                all_y_pred.append(pred_map[key])

    return np.array(all_y_true), np.array(all_y_pred)


def _compute_metrics(y_true, y_pred):
    if len(y_true) == 0:
        return {'mae': 0, 'rmse': 0, 'mape': 0}
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    nonzero = y_true != 0
    if nonzero.any():
        mape = float(np.mean(np.abs((y_true[nonzero] - y_pred[nonzero]) / y_true[nonzero])) * 100)
    else:
        mape = 0.0
    return {
        'mae': round(mae, 2),
        'rmse': round(rmse, 2),
        'mape': round(mape, 2),
    }


TS_MODELS = {'arima', 'lstm'}


class ModelEvaluator:
    """Evaluate one or all algorithms."""

    def __init__(self, algorithm: str = 'linear_regression'):
        self.algorithm = algorithm

    def evaluate(self, sales_data, training_weeks: int):
        """Evaluate a single algorithm. Returns dict of metrics."""
        df = pd.DataFrame(sales_data)
        df['date'] = pd.to_datetime(df['date'])
        max_date = df['date'].max()
        test_start = max_date - timedelta(weeks=1)
        train_start = max_date - timedelta(weeks=training_weeks)

        train_df = df[(df['date'] >= train_start) & (df['date'] < test_start)].copy()
        test_df = df[df['date'] >= test_start].copy()

        if len(train_df) < 3 or len(test_df) < 1:
            return {'mae': 0, 'rmse': 0, 'mape': 0}

        products = train_df['product'].unique()

        t0 = time.time()
        if self.algorithm in TS_MODELS:
            y_true, y_pred = _evaluate_ts_model(
                ALGORITHM_MAP[self.algorithm], train_df, test_df, products, training_weeks
            )
        else:
            model = ALGORITHM_MAP.get(self.algorithm)
            if model is None:
                return {'mae': 0, 'rmse': 0, 'mape': 0}
            y_true, y_pred = _evaluate_sklearn_model(model(), train_df, test_df, products)
        elapsed = round(time.time() - t0, 3)

        metrics = _compute_metrics(y_true, y_pred)
        metrics['training_time'] = elapsed
        return metrics

    @staticmethod
    def compare_all(sales_data, training_weeks: int):
        """Evaluate every registered algorithm. Returns a list of {algorithm, name, mae, rmse, mape, training_time}."""
        results = []
        for algo_key in ALL_ALGORITHMS:
            ev = ModelEvaluator(algo_key)
            metrics = ev.evaluate(sales_data, training_weeks)
            cls = ALGORITHM_MAP[algo_key]
            results.append({
                'algorithm': algo_key,
                'name': cls.name if hasattr(cls, 'name') else algo_key,
                **metrics,
            })
        return results

    @staticmethod
    def compare_training_windows(sales_data, windows: list[int] | None = None):
        """Run every algorithm across multiple training windows.
        Returns {windows: [...], results: {algo: [{window, mae, rmse, mape, training_time}, ...]}}
        """
        if windows is None:
            windows = [3, 4, 5, 6, 7, 8]

        out: dict = {'windows': windows, 'results': {}}

        for algo_key in ALL_ALGORITHMS:
            rows = []
            for w in windows:
                ev = ModelEvaluator(algo_key)
                metrics = ev.evaluate(sales_data, w)
                rows.append({'window': w, **metrics})
            cls = ALGORITHM_MAP[algo_key]
            out['results'][algo_key] = {
                'name': cls.name if hasattr(cls, 'name') else algo_key,
                'data': rows,
            }

        return out
