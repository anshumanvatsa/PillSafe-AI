import io
import os
import pandas as pd
import joblib
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS   # <-- add this

# -----------------------------
# Flask app configuration
# -----------------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes

# -----------------------------
# Model paths
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_ADVERSE_PATH = os.path.join(BASE_DIR, "xgb_adverse_reaction_model.pkl")
MODEL_REACTION_PATH = os.path.join(BASE_DIR, "xgb_reaction_type_model.pkl")
LE_ADVERSE_PATH = os.path.join(BASE_DIR, "le_adverse.pkl")
LE_REACTION_PATH = os.path.join(BASE_DIR, "le_reaction.pkl")

# Global variables for models
model1 = None
model2 = None
le_adverse = None
le_reaction = None

def load_artifacts():
    """Load ML models and label encoders"""
    global model1, model2, le_adverse, le_reaction
    
    if not (os.path.exists(MODEL_ADVERSE_PATH) and os.path.exists(MODEL_REACTION_PATH)):
        raise FileNotFoundError(
            "Model files not found. Ensure .pkl files are in the same folder as flask_app.py"
        )
    
    model1 = joblib.load(MODEL_ADVERSE_PATH)
    model2 = joblib.load(MODEL_REACTION_PATH)
    le_adverse = joblib.load(LE_ADVERSE_PATH) if os.path.exists(LE_ADVERSE_PATH) else None
    le_reaction = joblib.load(LE_REACTION_PATH) if os.path.exists(LE_REACTION_PATH) else None
    
    return model1, model2, le_adverse, le_reaction

# Load models on startup
try:
    model1, model2, le_adverse, le_reaction = load_artifacts()
    print("Models loaded successfully")
except Exception as e:
    print(f"Error loading models: {e}")

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

# Try to pull expected features from models to align ordering
FEATURES_MODEL1 = list(getattr(model1, "feature_names_in_", [])) if model1 else []
FEATURES_MODEL2 = list(getattr(model2, "feature_names_in_", [])) if model2 else []
EXPECTED_FEATURES = list(dict.fromkeys([*FEATURES_MODEL1, *FEATURES_MODEL2])) or None

def normalize_and_prepare(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize and prepare data for prediction"""
    if "Patient_ID" in df.columns:
        df = df.drop(columns=["Patient_ID"])  # not used

    # Normalize categorical text
    if "Sex" in df.columns:
        df["Sex"] = (
            df["Sex"].astype(str).str.strip().str.title().replace({"M": "Male", "F": "Female"})
        )
    if "Alcohol_Use" in df.columns:
        df["Alcohol_Use"] = (
            df["Alcohol_Use"].astype(str).str.strip().str.title().replace({"None": "No", "Never": "No"})
        )
    if "Smoking_Status" in df.columns:
        df["Smoking_Status"] = (
            df["Smoking_Status"].astype(str).str.strip().str.title().replace({"None": "No", "Never": "No"})
        )
    if "HLA_B_5701" in df.columns:
        df["HLA_B_5701"] = df["HLA_B_5701"].astype(str).str.strip().str.title()
    if "Drug_Route" in df.columns:
        df["Drug_Route"] = df["Drug_Route"].astype(str).str.strip().str.title()
    if "Drug_Frequency" in df.columns:
        df["Drug_Frequency"] = df["Drug_Frequency"].astype(str).str.strip()

    # Coerce numerics safely
    for col in NUMERIC_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Fill missing values
    for col in df.columns:
        if col in NUMERIC_COLS:
            df[col] = df[col].fillna(0)
        elif col in CATEGORICAL_COLS:
            df[col] = df[col].fillna("Unknown")

    # Ensure categorical dtypes
    for col in CATEGORICAL_COLS:
        if col in df.columns:
            df[col] = df[col].astype("category")

    # Add missing expected features and reorder
    if EXPECTED_FEATURES:
        for col in EXPECTED_FEATURES:
            if col not in df.columns:
                df[col] = "Unknown" if col in CATEGORICAL_COLS else 0
        df = df.reindex(columns=EXPECTED_FEATURES, fill_value=0)

    # Ensure categorical dtypes after reindex (crucial for XGBoost)
    for col in CATEGORICAL_COLS:
        if col in df.columns:
            df[col] = df[col].astype("category")

    return df


# -----------------------------
# API Routes
# -----------------------------
@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({"message": "Medicine Predictor API is running"})


@app.route('/predict', methods=['POST'])
def predict_csv():
    """Predict drug safety for CSV file upload"""
    try:
        if model1 is None or model2 is None:
            return jsonify({"error": "Models not loaded"}), 500
        
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not file.filename.lower().endswith('.csv'):
            return jsonify({"error": "File must be a CSV"}), 400
        
        # Read CSV
        df_in = pd.read_csv(file)
        
        # Normalize and prepare data
        X = normalize_and_prepare(df_in.copy())
        
        # ---- Model Predictions (use probabilities) ----
        pred_probs = model1.predict_proba(X)[:, 1]  # probability of Unsafe
        pred1_labels = ["Unsafe" if p > 0.3 else "Safe" for p in pred_probs]

        pred2 = model2.predict(X)
        pred2_labels = le_reaction.inverse_transform(pred2) if le_reaction is not None else pred2
        
        # ---- Rule-based Override ----
        final_labels = []
        reasons_list = []

        for i, row in df_in.iterrows():
            label = pred1_labels[i]
            reasons = []

            if str(row.get("HLA_B_5701", "")).strip().lower() in {"positive", "yes"}:
                label = "Unsafe"
                reasons.append("HLA-B*5701 positive (genetic risk)")
            
            if str(row.get("Previous_Adverse_Reactions", "")).strip().lower() in {"yes"}:
                label = "Unsafe"
                reasons.append("History of adverse reactions")
            
            if "copd" in str(row.get("Comorbidities", "")).lower():
                label = "Unsafe"
                reasons.append("Comorbidity: COPD present")

            final_labels.append(label)
            reasons_list.append(", ".join(reasons) if reasons else "No major risk factors")

        # ---- Build Final JSON Response ----
        safe_count = sum(label.lower() == "safe" for label in final_labels)
        unsafe_count = sum(label.lower() == "unsafe" for label in final_labels)

        result_json = {
            "status": "success",
            "safe_count": int(safe_count),
            "unsafe_count": int(unsafe_count),
            "records": [
                {
                    "Final_Summary": final_labels[i],
                    "Reasons": reasons_list[i]
                }
                for i in range(len(final_labels))
            ]
        }

        return jsonify(result_json)

    except Exception as e:
        print(f"CSV processing error: {str(e)}")
        return jsonify({"error": f"CSV processing failed: {str(e)}"}), 500


# -----------------------------
# Main
# -----------------------------
if __name__ == '__main__':
    print("Starting DrugSafe AI Flask Server...")
    print("Models loaded:", model1 is not None and model2 is not None)
    print("Server will be available at: http://127.0.0.1:8000")
    print("API endpoint: http://127.0.0.1:8000/predict")
    
    app.run(host='127.0.0.1', port=8000, debug=True)
