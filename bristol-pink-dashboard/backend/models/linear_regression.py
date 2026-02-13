"""Linear Regression predictor."""
import numpy as np
from sklearn.linear_model import LinearRegression
from .base import BasePredictor


class LinearRegressionPredictor(BasePredictor):
    name = "Linear Regression"

    def __init__(self):
        self.model = LinearRegression()

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        self.model.fit(X, y)

    def predict_values(self, X: np.ndarray) -> np.ndarray:
        return np.maximum(self.model.predict(X), 0)
