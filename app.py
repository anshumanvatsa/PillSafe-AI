import io
import os
import pandas as pd
import joblib
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

# -----------------------------
# Flask config
# -----------------------------
app = Flask(__name__)
CORS(app)  # ✅ Enable CORS so React frontend can call Flask

# -----------------------------
# Model paths
# -----------------------------
MODEL_ADVERSE_PATH = "xgb_adverse_reaction_model.pkl"
MODEL_REACTION_PATH = "xgb_reaction_type_model.pkl"
LE_ADVERSE_PATH = "le_adverse.pkl"
LE_REACTION_PATH = "le_reaction.pkl"

# -----------------------------
# Load models
# -----------------------------
def load_artifacts():
    if not (os.path.exists(MODEL_ADVERSE_PATH) and os.path.exists(MODEL_REACTION_PATH)):
        raise FileNotFoundError("Model files not found. Place .pkl files in same folder as app.py")

    model1 = joblib.load(MODEL_ADVERSE_PATH)
    model2 = joblib.load(MODEL_REACTION_PATH)
    le_adverse = joblib.load(LE_ADVERSE_PATH) if os.path.exists(LE_ADVERSE_PATH) else None
    le_reaction = joblib.load(LE_REACTION_PATH) if os.path.exists(LE_REACTION_PATH) else None
    return model1, model2, le_adverse, le_reaction

model1, model2, le_adverse, le_reaction = load_artifacts()

# -----------------------------
# Preprocessing
# -----------------------------
CATEGORICAL_COLS = [
    "Sex", "Ethnicity", "Comorbidities", "Known_Allergies", "Previous_Adverse_Reactions",
    "Current_Medications", "Herbal_Supplements", "Alcohol_Use", "Smoking_Status",
    "CYP2D6_status", "CYP2C19_status", "HLA_B_5701", "Other_Genetic_Risks",
    "Drug_Name", "Drug_Route", "Drug_Frequency"
]

NUMERIC_COLS = [
    "Age", "Weight_kg", "Height_cm", "BMI", "Creatinine_mg_dL", "eGFR_mL_min",
    "ALT_U_L", "AST_U_L", "Bilirubin_mg_dL", "Hemoglobin_g_dL", "QTc_ms", "Drug_Dose_mg"
]

FEATURES_MODEL1 = list(getattr(model1, "feature_names_in_", []))
FEATURES_MODEL2 = list(getattr(model2, "feature_names_in_", []))
EXPECTED_FEATURES = list(dict.fromkeys([*FEATURES_MODEL1, *FEATURES_MODEL2])) or None


def normalize_and_prepare(df: pd.DataFrame) -> pd.DataFrame:
    if "Patient_ID" in df.columns:
        df = df.drop(columns=["Patient_ID"])

    if "Sex" in df.columns:
        df["Sex"] = df["Sex"].astype(str).str.strip().str.title().replace({"M": "Male", "F": "Female"})
    if "Alcohol_Use" in df.columns:
        df["Alcohol_Use"] = df["Alcohol_Use"].astype(str).str.strip().str.title().replace({"None": "No", "Never": "No"})
    if "Smoking_Status" in df.columns:
        df["Smoking_Status"] = df["Smoking_Status"].astype(str).str.strip().str.title().replace({"None": "No", "Never": "No"})
    if "HLA_B_5701" in df.columns:
        df["HLA_B_5701"] = df["HLA_B_5701"].astype(str).str.strip().str.title()
    if "Drug_Route" in df.columns:
        df["Drug_Route"] = df["Drug_Route"].astype(str).str.strip().str.title()
    if "Drug_Frequency" in df.columns:
        df["Drug_Frequency"] = df["Drug_Frequency"].astype(str).str.strip()

    for col in NUMERIC_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    for col in df.columns:
        if col in NUMERIC_COLS:
            df[col] = df[col].fillna(0)
        elif col in CATEGORICAL_COLS:
            df[col] = df[col].fillna("Unknown")

    if EXPECTED_FEATURES:
        for col in EXPECTED_FEATURES:
            if col not in df.columns:
                df[col] = "Unknown" if col in CATEGORICAL_COLS else 0
        df = df.reindex(columns=EXPECTED_FEATURES, fill_value=0)

    return df


def adverse_label_to_safe_text(value) -> str:
    s = str(value).lower()
    return "Safe" if s in {"no", "0", "safe"} else "Harmful"

# -----------------------------
# API Endpoints
# -----------------------------
@app.route("/")
def home():
    return {"message": "DrugSafe AI Flask API is running"}

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    df_in = pd.read_csv(file)

    X = normalize_and_prepare(df_in.copy())
    pred1 = model1.predict(X)
    pred2 = model2.predict(X)

    pred1_labels = le_adverse.inverse_transform(pred1) if le_adverse is not None else pred1
    pred2_labels = le_reaction.inverse_transform(pred2) if le_reaction is not None else pred2

    out = df_in.copy()
    out["Adverse_Reaction_Predicted"] = pred1_labels
    out["Reaction_Type_Predicted"] = pred2_labels
    out["Safety_Summary"] = [adverse_label_to_safe_text(v) for v in out["Adverse_Reaction_Predicted"]]

    buf = io.StringIO()
    out.to_csv(buf, index=False)
    buf.seek(0)

    return send_file(
        io.BytesIO(buf.getvalue().encode()),
        mimetype="text/csv",
        as_attachment=True,
        download_name="user_predictions.csv"
    )

# -----------------------------
# Run Server
# -----------------------------
if __name__ == "__main__":
    print("✅ Models loaded, Flask server running at http://127.0.0.1:8000")
    app.run(host="0.0.0.0", port=8000, debug=True)
