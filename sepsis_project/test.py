import joblib
import pandas as pd
import numpy as np

print("🚀 Testing Given Sepsis Patient")

# =====================================
# LOAD TRAINED COMPONENTS
# =====================================
model = joblib.load("sepsis_xgb_model.pkl")
imputer = joblib.load("imputer.pkl")
feature_columns = joblib.load("feature_columns.pkl")

print("✅ Model loaded")

# =====================================
# PATIENT INPUT (You can modify values here)
# Missing reports = np.nan
# =====================================
patient_input = {
    "HR": 118,
    "O2Sat": np.nan,
    "Temp": 36.22,
    "SBP": 80,
    "MAP": 53.33,
    "DBP": np.nan,
    "Resp": 17,
    "EtCO2": 0,
    "BaseExcess": 0,
    "HCO3": 25,
    "FiO2": np.nan,
    "pH": np.nan,
    "PaCO2": np.nan,
    "SaO2": np.nan,
    "AST": np.nan,
    "BUN": 19,
    "Alkalinephos": np.nan,
    "Calcium": 7.8,
    "Chloride": 101,
    "Creatinine": 2.9,
    "Bilirubin_direct": np.nan,
    "Glucose": np.nan,
    "Lactate": np.nan,
    "Magnesium": 1.6,
    "Phosphate": 2.6,
    "Potassium": 3.4,
    "Bilirubin_total": np.nan,
    "TroponinI": np.nan,
    "Hct": 32.9,
    "Hgb": 10.1,
    "PTT": 150,
    "WBC": 21.4,
    "Fibrinogen": 190,
    "Platelets": 217,
    "Age": 70,
    "Gender": 0
}

# =====================================
# CHECK MISSING DATA
# =====================================
missing_fields = [
    k for k, v in patient_input.items()
    if v is None or (isinstance(v, float) and np.isnan(v))
]

missing_ratio = len(missing_fields) / len(feature_columns)

# =====================================
# PREPARE DATA FOR MODEL
# =====================================
patient = {col: np.nan for col in feature_columns}
patient.update(patient_input)

df = pd.DataFrame([patient])
df = df.reindex(columns=feature_columns)

X = imputer.transform(df)

# =====================================
# PREDICTION
# =====================================
probability = model.predict_proba(X)[0][1]
risk_percent = round(probability * 100, 2)

# =====================================
# CLINICAL STAGING
# =====================================
if risk_percent >= 60:
    stage_message = "⚠️ Stage-1 Sepsis Risk Detected"
elif risk_percent >= 40:
    stage_message = "🟠 Early Sepsis Symptoms Detected"
else:
    stage_message = "🟢 Low Sepsis Risk"

# =====================================
# DATA QUALITY MESSAGE
# =====================================
if missing_ratio > 0.3:
    data_warning = "⚠️ Prediction based on limited available reports. Accuracy may be affected."
else:
    data_warning = "✅ Prediction based on sufficient clinical data."

# =====================================
# FINAL OUTPUT
# =====================================
print("\n==============================")
print("Sepsis Risk Probability:", risk_percent, "%")
print(stage_message)
print(data_warning)
print("==============================")