from __future__ import annotations

import pytest

from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def _sample_sales_data() -> list[dict]:
    # 10 days and 2 products gives enough rows for model training in tests.
    return [
        {"date": "2025-03-01", "product": "Cappuccino", "unitsSold": 80},
        {"date": "2025-03-02", "product": "Cappuccino", "unitsSold": 82},
        {"date": "2025-03-03", "product": "Cappuccino", "unitsSold": 85},
        {"date": "2025-03-04", "product": "Cappuccino", "unitsSold": 79},
        {"date": "2025-03-05", "product": "Cappuccino", "unitsSold": 81},
        {"date": "2025-03-01", "product": "Croissant", "unitsSold": 50},
        {"date": "2025-03-02", "product": "Croissant", "unitsSold": 49},
        {"date": "2025-03-03", "product": "Croissant", "unitsSold": 55},
        {"date": "2025-03-04", "product": "Croissant", "unitsSold": 53},
        {"date": "2025-03-05", "product": "Croissant", "unitsSold": 51},
    ]


def _login(client, username: str, password: str) -> str:
    res = client.post("/api/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, res.get_data(as_text=True)
    token = res.get_json()["token"]
    return token


def test_login_success_returns_role_and_token(client):
    res = client.post("/api/auth/login", json={"username": "manager", "password": "manager123"})
    assert res.status_code == 200
    payload = res.get_json()
    assert "token" in payload
    assert payload["user"]["role"] == "manager"


def test_login_failure_returns_401(client):
    res = client.post("/api/auth/login", json={"username": "manager", "password": "wrong"})
    assert res.status_code == 401
    assert "error" in res.get_json()


def test_protected_endpoint_requires_auth(client):
    res = client.post(
        "/api/predict",
        json={"sales_data": _sample_sales_data(), "training_weeks": 4, "algorithm": "linear_regression"},
    )
    assert res.status_code == 401


def test_viewer_role_cannot_run_predict(client):
    token = _login(client, "viewer", "viewer123")
    res = client.post(
        "/api/predict",
        headers={"Authorization": f"Bearer {token}"},
        json={"sales_data": _sample_sales_data(), "training_weeks": 4, "algorithm": "linear_regression"},
    )
    assert res.status_code == 403


def test_analyst_can_run_predict(client):
    token = _login(client, "analyst", "analyst123")
    res = client.post(
        "/api/predict",
        headers={"Authorization": f"Bearer {token}"},
        json={"sales_data": _sample_sales_data(), "training_weeks": 4, "algorithm": "linear_regression"},
    )
    assert res.status_code == 200
    payload = res.get_json()
    assert "predictions" in payload
    assert isinstance(payload["predictions"], list)


def test_validation_rejects_negative_units(client):
    token = _login(client, "analyst", "analyst123")
    data = _sample_sales_data()
    data[0]["unitsSold"] = -1

    res = client.post(
        "/api/predict",
        headers={"Authorization": f"Bearer {token}"},
        json={"sales_data": data, "training_weeks": 4, "algorithm": "linear_regression"},
    )
    assert res.status_code == 400
    assert "negative" in res.get_json()["error"].lower()


def test_validation_rejects_missing_fields(client):
    token = _login(client, "analyst", "analyst123")
    bad_data = [{"date": "2025-03-01", "product": "Cappuccino"}]

    res = client.post(
        "/api/evaluate",
        headers={"Authorization": f"Bearer {token}"},
        json={"sales_data": bad_data, "training_weeks": 4, "algorithm": "linear_regression"},
    )
    assert res.status_code == 400
    assert "missing required fields" in res.get_json()["error"].lower()


def test_manager_can_access_algorithms(client):
    token = _login(client, "manager", "manager123")
    res = client.get("/api/algorithms", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    payload = res.get_json()
    assert "algorithms" in payload
    assert "linear_regression" in payload["algorithms"]
