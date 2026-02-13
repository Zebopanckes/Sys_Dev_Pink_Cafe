"""Models package – registry of all available predictors."""
from .linear_regression import LinearRegressionPredictor
from .random_forest import RandomForestPredictor
from .gradient_boosting import GradientBoostingPredictor
from .arima_model import ARIMAPredictor
from .lstm_model import LSTMPredictor

ALGORITHM_MAP = {
    'linear_regression': LinearRegressionPredictor,
    'random_forest': RandomForestPredictor,
    'gradient_boosting': GradientBoostingPredictor,
    'arima': ARIMAPredictor,
    'lstm': LSTMPredictor,
}

ALL_ALGORITHMS = list(ALGORITHM_MAP.keys())

__all__ = [
    'ALGORITHM_MAP',
    'ALL_ALGORITHMS',
    'LinearRegressionPredictor',
    'RandomForestPredictor',
    'GradientBoostingPredictor',
    'ARIMAPredictor',
    'LSTMPredictor',
]
