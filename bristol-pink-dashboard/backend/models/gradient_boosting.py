"""Gradient Boosting predictor."""
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from .base import BasePredictor


class GradientBoostingPredictor(BasePredictor):
    name = "Gradient Boosting"

    def __init__(self):
        self.model = GradientBoostingRegressor(n_estimators=100, random_state=42)

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        self.model.fit(X, y)

    def predict_values(self, X: np.ndarray) -> np.ndarray:
        return np.maximum(self.model.predict(X), 0)
