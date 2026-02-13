"""Random Forest predictor."""
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from .base import BasePredictor


class RandomForestPredictor(BasePredictor):
    name = "Random Forest"

    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        self.model.fit(X, y)

    def predict_values(self, X: np.ndarray) -> np.ndarray:
        return np.maximum(self.model.predict(X), 0)
