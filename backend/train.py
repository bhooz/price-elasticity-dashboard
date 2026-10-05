import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, r2_score

print("Generating synthetic e-commerce pricing dataset...")
np.random.seed(42)
n_samples = 2000

# Synthetic features
base_price = np.random.uniform(20, 150, n_samples)
price_discount_pct = np.random.uniform(0, 0.3, n_samples)
effective_price = base_price * (1 - price_discount_pct)
competitor_price = effective_price * np.random.uniform(0.85, 1.15, n_samples)
is_weekend = np.random.choice([0, 1], size=n_samples, p=[0.7, 0.3])
marketing_spend = np.random.uniform(100, 1000, n_samples)

# Demand simulation curve (Inverse price-demand relationship)
base_demand = 500 - (2.5 * effective_price) + (1.8 * competitor_price) + (20 * is_weekend) + (0.15 * marketing_spend)
noise = np.random.normal(0, 15, n_samples)
quantity_sold = np.maximum(5, np.round(base_demand + noise)).astype(int)

df = pd.DataFrame({
    'base_price': np.round(base_price, 2),
    'effective_price': np.round(effective_price, 2),
    'competitor_price': np.round(competitor_price, 2),
    'is_weekend': is_weekend,
    'marketing_spend': np.round(marketing_spend, 2),
    'quantity_sold': quantity_sold
})

# Feature engineering & train test split
X = df[['effective_price', 'competitor_price', 'is_weekend', 'marketing_spend']]
y = df['quantity_sold']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Gradient Boosting Regressor model...")
model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=4, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(f"✅ Model R² Score: {r2_score(y_test, y_pred):.4f}")
print(f"✅ Model RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.2f}")

# Save artifacts
joblib.dump(model, 'pricing_model.pkl')
df.to_csv('ecommerce_pricing_data.csv', index=False)
print("🚀 Saved pricing_model.pkl and ecommerce_pricing_data.csv successfully!")