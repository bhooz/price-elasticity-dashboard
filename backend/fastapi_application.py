from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
import joblib
import os

app = FastAPI(
    title="Dynamic Price & Demand Elasticity Engine API",
    description="REST API for predicting sales demand and simulating price elasticity scenarios.",
    version="1.0.0"
)

# Enable CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load machine learning model
MODEL_PATH = "pricing_model.pkl"
model = None

@app.on_event("startup")
def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print("Pricing model loaded successfully.")
    else:
        print(f"Warning: {MODEL_PATH} not found. Ensure model training script is executed.")

# --- Request / Response Schemas ---

class PredictionRequest(BaseModel):
    effective_price: float = Field(..., gt=0, example=45.0, description="Proposed unit price")
    competitor_price: float = Field(..., gt=0, example=48.0, description="Competitor price point")
    is_weekend: int = Field(0, ge=0, le=1, example=0, description="1 if weekend, 0 otherwise")
    marketing_spend: float = Field(..., ge=0, example=250.0, description="Marketing budget ($)")

class PredictionResponse(BaseModel):
    effective_price: float
    predicted_demand: int
    projected_revenue: float

class SimulationRequest(BaseModel):
    base_price: float = Field(..., gt=0, example=50.0, description="Current baseline price")
    competitor_price: float = Field(..., gt=0, example=48.0)
    is_weekend: int = Field(0, ge=0, le=1)
    marketing_spend: float = Field(..., ge=0, example=250.0)
    price_range_pct: float = Field(0.30, ge=0.05, le=0.50, description="Percentage range to simulate above/below base price")
    steps: int = Field(15, ge=5, le=50, description="Number of simulation steps")

class SimulationPoint(BaseModel):
    price: float
    predicted_demand: int
    projected_revenue: float
    price_change_pct: float

class SimulationResponse(BaseModel):
    baseline_price: float
    baseline_demand: int
    baseline_revenue: float
    elasticity_coefficient: float
    elasticity_category: str
    optimal_price: float
    max_projected_revenue: float
    curve_data: list[SimulationPoint]


# --- Helper Functions ---

def calculate_elasticity(p1: float, p2: float, q1: float, q2: float) -> float:
    """Calculates arc elasticity of demand: (% Change in Q) / (% Change in P)"""
    if p1 == p2 or (q1 + q2) == 0 or (p1 + p2) == 0:
        return 0.0
    
    pct_change_q = (q2 - q1) / ((q1 + q2) / 2)
    pct_change_p = (p2 - p1) / ((p1 + p2) / 2)
    
    if pct_change_p == 0:
        return 0.0
        
    return round(pct_change_q / pct_change_p, 2)

def classify_elasticity(elasticity: float) -> str:
    abs_e = abs(elasticity)
    if abs_e > 1.1:
        return "Elastic (Price Sensitive)"
    elif abs_e < 0.9:
        return "Inelastic (Price Insensitive)"
    else:
        return "Unitary Elastic"


# --- Endpoints ---

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Dynamic Price & Demand Elasticity Engine API",
        "status": "active",
        "docs_url": "/docs"
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_demand(payload: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model artifact is not loaded.")
    
    input_data = pd.DataFrame([{
        'effective_price': payload.effective_price,
        'competitor_price': payload.competitor_price,
        'is_weekend': payload.is_weekend,
        'marketing_spend': payload.marketing_spend
    }])
    
    pred_q = max(0, int(round(model.predict(input_data)[0])))
    revenue = round(pred_q * payload.effective_price, 2)
    
    return PredictionResponse(
        effective_price=payload.effective_price,
        predicted_demand=pred_q,
        projected_revenue=revenue
    )

@app.post("/simulate", response_model=SimulationResponse)
def simulate_price_elasticity(payload: SimulationRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model artifact is not loaded.")
    
    min_price = payload.base_price * (1 - payload.price_range_pct)
    max_price = payload.base_price * (1 + payload.price_range_pct)
    sim_prices = np.linspace(min_price, max_price, payload.steps)
    
    sim_data = []
    for price in sim_prices:
        p_float = round(float(price), 2)
        input_df = pd.DataFrame([{
            'effective_price': p_float,
            'competitor_price': payload.competitor_price,
            'is_weekend': payload.is_weekend,
            'marketing_spend': payload.marketing_spend
        }])
        
        q = max(0, int(round(model.predict(input_df)[0])))
        rev = round(q * p_float, 2)
        p_diff_pct = round(((p_float - payload.base_price) / payload.base_price) * 100, 2)
        
        sim_data.append(SimulationPoint(
            price=p_float,
            predicted_demand=q,
            projected_revenue=rev,
            price_change_pct=p_diff_pct
        ))
    
    # Calculate baseline point
    base_input = pd.DataFrame([{
        'effective_price': payload.base_price,
        'competitor_price': payload.competitor_price,
        'is_weekend': payload.is_weekend,
        'marketing_spend': payload.marketing_spend
    }])
    base_q = max(0, int(round(model.predict(base_input)[0])))
    base_rev = round(base_q * payload.base_price, 2)
    
    # Elasticity calculation between baseline and +10% price point
    p_high = payload.base_price * 1.10
    high_input = pd.DataFrame([{
        'effective_price': p_high,
        'competitor_price': payload.competitor_price,
        'is_weekend': payload.is_weekend,
        'marketing_spend': payload.marketing_spend
    }])
    high_q = max(0, int(round(model.predict(high_input)[0])))
    
    elasticity_coeff = calculate_elasticity(payload.base_price, p_high, base_q, high_q)
    category = classify_elasticity(elasticity_coeff)
    
    # Find optimal revenue point
    optimal_point = max(sim_data, key=lambda x: x.projected_revenue)
    
    return SimulationResponse(
        baseline_price=payload.base_price,
        baseline_demand=base_q,
        baseline_revenue=base_rev,
        elasticity_coefficient=elasticity_coeff,
        elasticity_category=category,
        optimal_price=optimal_point.price,
        max_projected_revenue=optimal_point.projected_revenue,
        curve_data=sim_data
    )