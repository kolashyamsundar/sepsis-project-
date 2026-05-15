import pandas as pd
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, confusion_matrix
from xgboost import XGBClassifier

print("🚀 Training Sepsis Model (Balanced Learning)")

# =====================================================
# LOAD DATASET
# =====================================================
def load_dataset(folder):
    all_data = []

    print(f"Reading folder: {folder}")

    for root, dirs, files in os.walk(folder):
        for file in files:
            if file.endswith(".psv"):
                path = os.path.join(root, file)
                df = pd.read_csv(path, sep="|")
                all_data.append(df)

    print("Files loaded:", len(all_data))
    return pd.concat(all_data, ignore_index=True)


dataA = load_dataset("training_setA")
dataB = load_dataset("training_setB")

data = pd.concat([dataA, dataB], ignore_index=True)

print("Dataset shape:", data.shape)

# =====================================================
# CLEAN DATA (KEEP ALL FEATURES)
# =====================================================
print("\nCleaning data (keeping ALL columns)...")

data = data.ffill()
data = data.bfill()

print("After cleaning:", data.shape)

# =====================================================
# SPLIT FEATURES & LABEL
# =====================================================
X = data.drop(columns=["SepsisLabel"])
y = data["SepsisLabel"]

print("Total features used:", X.shape[1])

# Save feature schema
feature_columns = X.columns.tolist()
joblib.dump(feature_columns, "feature_columns.pkl")

# =====================================================
# HANDLE MISSING VALUES
# =====================================================
imputer = SimpleImputer(strategy="mean")
X = imputer.fit_transform(X)

joblib.dump(imputer, "imputer.pkl")

# =====================================================
# TRAIN TEST SPLIT
# =====================================================
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# =====================================================
# ⭐ HANDLE CLASS IMBALANCE (MOST IMPORTANT)
# =====================================================
scale_pos_weight = (y == 0).sum() / (y == 1).sum()
print("Scale_pos_weight:", scale_pos_weight)

# =====================================================
# TRAIN XGBOOST MODEL
# =====================================================
print("\nTraining XGBoost...")

model = XGBClassifier(
    n_estimators=250,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="logloss",
    scale_pos_weight=scale_pos_weight,  # ⭐ key fix
    n_jobs=-1
)

model.fit(X_train, y_train)

# =====================================================
# EVALUATION
# =====================================================
pred = model.predict(X_test)

print("\n📊 Classification Report:")
print(classification_report(y_test, pred))

print("\n📊 Confusion Matrix:")
print(confusion_matrix(y_test, pred))

# =====================================================
# SAVE MODEL
# =====================================================
joblib.dump(model, "sepsis_xgb_model.pkl")

print("\n✅ Model saved as sepsis_xgb_model.pkl")
print("🎉 Training completed successfully!")