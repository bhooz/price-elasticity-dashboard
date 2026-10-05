from unittest.mock import MagicMock
from fastapi.testclient import TestClient
import app as app_module
from app import app


def setup_function():
    """Inject a mock model before each test to ensure deterministic responses."""
    mock_model = MagicMock()
    # Predict returns a array with a single float value representing demand
    mock_model.predict.return_value = [500.0]
    app_module.model = mock_model


# --- Healthcheck Test ---

def test_root_endpoint():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "Price Elasticity API is operational."}


# --- Predict Endpoint Tests ---

def test_predict_endpoint_success():
    """Test valid single prediction payload returns demand and estimated revenue."""
    payload = {
        "effective_price": 75.0,
        "competitor_price": 80.0,
        "is_weekend": 0,
        "marketing_spend": 250.0,
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 200

    data = response.json()
    assert "predicted_demand" in data
    assert "estimated_revenue" in data
    assert data["predicted_demand"] == 500.0
    assert data["estimated_revenue"] == 75.0 * 500.0


def test_predict_endpoint_negative_price():
    """Test that a negative effective_price triggers a 422 validation error."""
    payload = {
        "effective_price": -10.0,  # Invalid: gt=0 constraint failed
        "competitor_price": 80.0,
        "is_weekend": 0,
        "marketing_spend": 250.0,
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 422


def test_predict_endpoint_missing_fields():
    """Test that omitting required fields triggers a 422 validation error."""
    payload = {
        "effective_price": 75.0,
        # Missing competitor_price and marketing_spend
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 422


# --- Simulation Endpoint Tests ---

def test_simulate_endpoint_success():
    """Test price simulation output structure and data types."""
    payload = {
        "base_price": 100.0,
        "competitor_price": 95.0,
        "marketing_spend": 300.0,
        "is_weekend": 0,
        "price_step_pct": 0.05,
    }

    with TestClient(app) as client:
        response = client.post("/simulate", json=payload)
        assert response.status_code == 200

    data = response.json()
    assert "baseline_price" in data
    assert "optimal_price" in data
    assert "max_revenue" in data
    assert "elasticity_classification" in data
    assert "simulation_curve" in data
    assert isinstance(data["simulation_curve"], list)
    assert len(data["simulation_curve"]) > 0


def test_simulate_endpoint_invalid_is_weekend():
    """Test that is_weekend outside [0, 1] triggers a 422 validation error."""
    payload = {
        "base_price": 100.0,
        "competitor_price": 95.0,
        "marketing_spend": 300.0,
        "is_weekend": 5,  # Invalid: ge=0, le=1 constraint failed
        "price_step_pct": 0.05,
    }

    with TestClient(app) as client:
        response = client.post("/simulate", json=payload)
        assert response.status_code == 422


def test_simulate_endpoint_negative_marketing_spend():
    """Test that negative marketing spend triggers a 422 validation error."""
    payload = {
        "base_price": 100.0,
        "competitor_price": 95.0,
        "marketing_spend": -50.0,  # Invalid: ge=0 constraint failed
        "is_weekend": 0,
    }

    with TestClient(app) as client:
        response = client.post("/simulate", json=payload)
        assert response.status_code == 422


# --- Server Error Handling ---

def test_predict_model_not_loaded():
    """Test that endpoint returns HTTP 500 when model is missing."""
    app_module.model = None  # Simulate missing model

    payload = {
        "effective_price": 75.0,
        "competitor_price": 80.0,
        "is_weekend": 0,
        "marketing_spend": 250.0,
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 500
        assert response.json()["detail"] == "Model file not loaded on server."