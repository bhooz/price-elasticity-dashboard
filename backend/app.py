import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Price Elasticity & Demand API",
    description="Backend service for predicting demand, revenue, and price elasticity.",
    version="1.0.0"
)

# ------------------------------------------------------------------------------
# CORS Configuration
# ------------------------------------------------------------------------------
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Load Model Artifact (Optional ML fallback)
# ------------------------------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")
model = None

if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        print(f"Loaded model successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"Warning: Failed to load model.joblib ({e}). Using core elasticity engine.")

# ------------------------------------------------------------------------------
# Request & Response Schemas
# ------------------------------------------------------------------------------
class SimulationRequest(BaseModel):
    base_price: float = Field(..., example=175.0, description="Base product price in USD")
    competitor_price: float = Field(..., example=195.0, description="Competitor price in USD")
    marketing_budget: float = Field(..., example=500.0, description="Marketing spend in USD")
    day_type: str = Field(..., example="Weekend", description="Weekday, Weekend, or Holiday")

class CurveStep(BaseModel):
    price: float
    demand: int
    revenue: float

class SimulationResponse(BaseModel):
    baseline_price: float
    optimal_price: float
    max_revenue: float
    classification: str
    simulation_curve: list[CurveStep]

# ------------------------------------------------------------------------------
# Demand Engine Logic
# ------------------------------------------------------------------------------
def predict_demand(price: float, competitor_price: float, marketing_budget: float, day_type: str) -> float:
    """
    Predicts unit demand with active weighting from price, competitor pricing, 
    marketing budget, and day type.
    """
    # 1. Base market volume
    base_demand = 350.0

    # 2. Competitor Price Cross-Elasticity
    # Higher competitor price makes our product relatively cheaper, boosting demand
    price_gap = competitor_price - price
    competitor_impact = price_gap * 1.5  

    # 3. Marketing Budget Lift
    # Diminishing returns square-root curve for marketing spend
    marketing_impact = (marketing_budget ** 0.5) * 5.0  

    # 4. Own-Price Elasticity
    # Demand drops off as our price scales relative to market anchors
    price_ratio = price / max(10.0, competitor_price)
    own_price_sensitivity = (price_ratio ** -1.4)

    # 5. Day Type Multiplier
    day_multiplier = 1.25 if day_type == "Weekend" else (1.45 if day_type == "Holiday" else 1.0)

    # Calculate total demand
    total_demand = (base_demand + competitor_impact + marketing_impact) * own_price_sensitivity * day_multiplier

    return max(10.0, float(total_demand))

# ------------------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------------------
@app.get("/")
def health_check():
    return {"status": "online", "model_loaded": model is not None}

@app.post("/simulate", response_model=SimulationResponse)
def simulate_price(request: SimulationRequest):
    try:
        base_price = request.base_price
        comp_price = request.competitor_price
        mktg_budget = request.marketing_budget
        day_type = request.day_type

        # Generate price simulation steps (from 60% to 150% of base price)
        min_price = max(10.0, base_price * 0.6)
        max_price = base_price * 1.5
        price_steps = np.linspace(min_price, max_price, 10)

        simulation_curve = []
        max_revenue = 0.0
        optimal_price = base_price

        for p in price_steps:
            current_price = round(float(p), 2)
            predicted_demand = round(predict_demand(current_price, comp_price, mktg_budget, day_type))
            revenue = round(current_price * predicted_demand, 2)

            if revenue > max_revenue:
                max_revenue = revenue
                optimal_price = current_price

            simulation_curve.append(CurveStep(
                price=current_price,
                demand=predicted_demand,
                revenue=revenue
            ))

        # Calculate elasticity around base price for classification
        d1 = predict_demand(base_price * 0.95, comp_price, mktg_budget, day_type)
        d2 = predict_demand(base_price * 1.05, comp_price, mktg_budget, day_type)
        
        # Point elasticity formula: % change in demand / % change in price
        pct_change_demand = (d2 - d1) / ((d1 + d2) / 2)
        pct_change_price = (1.05 - 0.95) / 1.00
        elasticity = abs(pct_change_demand / pct_change_price) if pct_change_price != 0 else 0

        if elasticity > 1.1:
            classification = "Elastic (Demand drops significantly with price increases)"
        elif elasticity < 0.9:
            classification = "Inelastic (Demand Remains Relatively Stable)"
        else:
            classification = "Unitary Elastic (Demand changes proportionally to price)"

        return SimulationResponse(
            baseline_price=round(base_price, 2),
            optimal_price=round(optimal_price, 2),
            max_revenue=round(max_revenue, 2),
            classification=classification,
            simulation_curve=simulation_curve
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")