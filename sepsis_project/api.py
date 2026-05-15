from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import pandas as pd

# ==============================
# LOAD MODEL + FILES ON STARTUP
# ==============================

print("🔄 Loading ML model...")

model = joblib.load("sepsis_xgb_model.pkl")
imputer = joblib.load("imputer.pkl")
feature_columns = joblib.load("feature_columns.pkl")

print("✅ Model loaded successfully!")

app = FastAPI(title="Sepsis Prediction API")

# ==============================
# CORS (VERY IMPORTANT)
# ==============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend (localhost:8080)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# ROOT CHECK
# ==============================

@app.get("/")
def home():
    return {"message": "Sepsis Prediction API is running"}

# ==============================
# PREDICTION ENDPOINT
# ==============================

@app.post("/predict")
def predict(patient: dict):
    try:
        print("📥 Incoming Data:", patient)

        # Create full feature dictionary
        data = {col: np.nan for col in feature_columns}

        # Fill only provided values
        for key, value in patient.items():
            if key in data:
                data[key] = value

        # Convert to DataFrame
        df = pd.DataFrame([data])

        # Count missing values BEFORE imputation
        missing_count = df.isna().sum().sum()
        missing_ratio = missing_count / len(feature_columns)

        print("📊 Missing Ratio:", missing_ratio)

        # Apply imputer
        df = pd.DataFrame(
            imputer.transform(df),
            columns=feature_columns
        )

        # Predict probability
        probability = float(model.predict_proba(df)[0][1])
        probability_percent = float(probability * 100)

        # ==========================
        # RISK STAGE LOGIC
        # ==========================
        if probability_percent >= 60:
            stage = "Stage-1 Sepsis Risk"
        elif probability_percent >= 40:
            stage = "Early Sepsis Symptoms"
        else:
            stage = "Low Sepsis Risk"

        # Warning if too much missing data
        warning = None
        if missing_ratio > 0.3:
            warning = "Prediction based on limited available reports"

        print("✅ Prediction Done:", probability_percent)

        return {
            "sepsis_probability": round(probability_percent, 2),
            "risk_level": stage,
            "warning": warning
        }

    except Exception as e:
        print("❌ ERROR:", str(e))
        return {"error": str(e)}