"""Thin wrapper kept for backward-compatibility with app.py imports."""
from . import ALGORITHM_MAP
from .linear_regression import LinearRegressionPredictor


class SalesPredictor:
    """Instantiates the right predictor model and delegates to it."""

    def __init__(self, algorithm: str = 'linear_regression'):
        cls = ALGORITHM_MAP.get(algorithm)
        if cls is None:
            cls = LinearRegressionPredictor.__class__
        self._predictor = cls() if callable(cls) else LinearRegressionPredictor()

    def predict(self, sales_data, training_weeks: int, forecast_weeks: int = 4):
        return self._predictor.predict(sales_data, training_weeks, forecast_weeks)
