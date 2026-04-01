from __future__ import annotations

from datetime import date, timedelta

import numpy as np
import pytest

from app import app
from models import arima_model, evaluator, lstm_model
from models.gradient_boosting import GradientBoostingPredictor
from models.linear_regression import LinearRegressionPredictor
from models.predictor import SalesPredictor
from models.random_forest import RandomForestPredictor


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def _sample_sales_data(days: int = 40) -> list[dict]:
    rows: list[dict] = []
    start = date(2025, 1, 1)
    for i in range(days):
        d = (start + timedelta(days=i)).isoformat()
        rows.append({"date": d, "product": "Cappuccino", "unitsSold": 80 + (i % 9)})
        rows.append({"date": d, "product": "Croissant", "unitsSold": 48 + (i % 7)})
    return rows


def _login(client, username: str = "manager", password: str = "manager123") -> str:
    res = client.post("/api/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200
    return res.get_json()["token"]


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_auth_me_and_logout_flow(client):
    token = _login(client)

    me = client.get("/api/auth/me", headers=_headers(token))
    assert me.status_code == 200
    assert me.get_json()["user"]["username"] == "manager"

    out = client.post("/api/auth/logout", headers=_headers(token))
    assert out.status_code == 200

    me_again = client.get("/api/auth/me", headers=_headers(token))
    assert me_again.status_code == 401


def test_health_endpoint_auth_state(client):
    anon = client.get("/api/health")
    assert anon.status_code == 200
    assert anon.get_json()["authenticated"] is False

    token = _login(client)
    authed = client.get("/api/health", headers=_headers(token))
    assert authed.status_code == 200
    assert authed.get_json()["authenticated"] is True


def test_predict_rejects_unsupported_algorithm(client):
    token = _login(client)
    res = client.post(
        "/api/predict",
        headers=_headers(token),
        json={"sales_data": _sample_sales_data(), "training_weeks": 4, "algorithm": "not_real"},
    )
    assert res.status_code == 400
    assert "unsupported algorithm" in res.get_json()["error"].lower()


def test_predict_rejects_out_of_range_training_window(client):
    token = _login(client)
    data = _sample_sales_data()

    low = client.post(
        "/api/predict",
        headers=_headers(token),
        json={"sales_data": data, "training_weeks": 3, "algorithm": "linear_regression"},
    )
    assert low.status_code == 400

    high = client.post(
        "/api/predict",
        headers=_headers(token),
        json={"sales_data": data, "training_weeks": 9, "algorithm": "linear_regression"},
    )
    assert high.status_code == 400


def test_compare_endpoints_success(client):
    token = _login(client, "analyst", "analyst123")
    payload = {"sales_data": _sample_sales_data(), "training_weeks": 4}

    compare = client.post("/api/evaluate/compare", headers=_headers(token), json=payload)
    assert compare.status_code == 200
    assert isinstance(compare.get_json()["results"], list)
    assert len(compare.get_json()["results"]) >= 1

    windows = client.post(
        "/api/evaluate/windows",
        headers=_headers(token),
        json={"sales_data": _sample_sales_data(), "windows": [4, 5]},
    )
    assert windows.status_code == 200
    assert windows.get_json()["windows"] == [4, 5]


def test_predict_and_evaluate_exception_paths(client, monkeypatch):
    token = _login(client)
    data = _sample_sales_data()

    def boom_predict(*_args, **_kwargs):
        raise RuntimeError("predict boom")

    def boom_evaluate(*_args, **_kwargs):
        raise RuntimeError("evaluate boom")

    monkeypatch.setattr("app.SalesPredictor.predict", boom_predict)
    predict = client.post(
        "/api/predict",
        headers=_headers(token),
        json={"sales_data": data, "training_weeks": 4, "algorithm": "linear_regression"},
    )
    assert predict.status_code == 500

    monkeypatch.setattr("app.ModelEvaluator.evaluate", boom_evaluate)
    evaluate = client.post(
        "/api/evaluate",
        headers=_headers(token),
        json={"sales_data": data, "training_weeks": 4, "algorithm": "linear_regression"},
    )
    assert evaluate.status_code == 500


def test_compare_exception_paths(client, monkeypatch):
    token = _login(client)
    data = _sample_sales_data()

    def boom_compare(*_args, **_kwargs):
        raise RuntimeError("compare boom")

    def boom_windows(*_args, **_kwargs):
        raise RuntimeError("windows boom")

    monkeypatch.setattr("app.ModelEvaluator.compare_all", boom_compare)
    compare = client.post(
        "/api/evaluate/compare",
        headers=_headers(token),
        json={"sales_data": data, "training_weeks": 4},
    )
    assert compare.status_code == 500

    monkeypatch.setattr("app.ModelEvaluator.compare_training_windows", boom_windows)
    windows = client.post(
        "/api/evaluate/windows",
        headers=_headers(token),
        json={"sales_data": data, "windows": [4, 5]},
    )
    assert windows.status_code == 500


def test_predictor_falls_back_to_linear_when_unknown_algorithm():
    predictor = SalesPredictor(algorithm="unknown")
    assert predictor._predictor.__class__.__name__ == "LinearRegressionPredictor"


def test_model_predict_values_are_non_negative():
    X = np.array(
        [
            [0, 1, 1, 1, 0],
            [1, 2, 1, 1, 1],
            [2, 3, 1, 1, 2],
            [3, 4, 1, 1, 3],
            [4, 5, 1, 1, 4],
        ]
    )
    y = np.array([10, 12, 14, 13, 15])

    for cls in (LinearRegressionPredictor, RandomForestPredictor, GradientBoostingPredictor):
        model = cls()
        model.fit(X, y)
        preds = model.predict_values(X)
        assert len(preds) == len(y)
        assert np.all(preds >= 0)


def test_arima_predict_without_statsmodels_returns_empty(monkeypatch):
    monkeypatch.setattr(arima_model, "HAS_STATSMODELS", False)
    model = arima_model.ARIMAPredictor()
    out = model.predict(_sample_sales_data(), training_weeks=4, forecast_weeks=1)
    assert out == []


def test_arima_predict_with_data_runs_when_available():
    if not arima_model.HAS_STATSMODELS:
        pytest.skip("statsmodels not available")

    model = arima_model.ARIMAPredictor(order=(1, 1, 0))
    out = model.predict(_sample_sales_data(days=25), training_weeks=4, forecast_weeks=1)
    assert isinstance(out, list)


def test_lstm_predict_without_torch_returns_empty(monkeypatch):
    monkeypatch.setattr(lstm_model, "HAS_TORCH", False)
    model = lstm_model.LSTMPredictor()
    out = model.predict(_sample_sales_data(), training_weeks=4, forecast_weeks=1)
    assert out == []


def test_lstm_predict_with_data_runs_when_available():
    if not lstm_model.HAS_TORCH:
        pytest.skip("torch not available")

    model = lstm_model.LSTMPredictor(epochs=1, units=8)
    out = model.predict(_sample_sales_data(days=20), training_weeks=4, forecast_weeks=1)
    assert isinstance(out, list)


def test_evaluator_metrics_and_comparisons_execute():
    data = _sample_sales_data(days=35)

    lr_metrics = evaluator.ModelEvaluator("linear_regression").evaluate(data, 4)
    assert set(lr_metrics.keys()) >= {"mae", "rmse", "mape", "training_time"}

    arima_metrics = evaluator.ModelEvaluator("arima").evaluate(data, 4)
    assert set(arima_metrics.keys()) >= {"mae", "rmse", "mape", "training_time"}

    all_rows = evaluator.ModelEvaluator.compare_all(data, 4)
    assert isinstance(all_rows, list)
    assert len(all_rows) >= 1

    windows = evaluator.ModelEvaluator.compare_training_windows(data, [4, 5])
    assert windows["windows"] == [4, 5]
    assert isinstance(windows["results"], dict)


def test_compute_metrics_empty_and_nonzero_paths():
    empty = evaluator._compute_metrics(np.array([]), np.array([]))
    assert empty == {"mae": 0, "rmse": 0, "mape": 0}

    y_true = np.array([10, 0, 12], dtype=float)
    y_pred = np.array([9, 1, 11], dtype=float)
    nonempty = evaluator._compute_metrics(y_true, y_pred)
    assert set(nonempty.keys()) == {"mae", "rmse", "mape"}
