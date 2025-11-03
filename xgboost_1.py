import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, ConfusionMatrixDisplay
import xgboost as xgb
import joblib
import matplotlib.pyplot as plt

# -----------------------------
# 1. Load dataset
# -----------------------------
dataset_path = r"C:\Users\Anshuman Mishra\drug_dataset.csv"
assert os.path.exists(dataset_path), f"File not found: {dataset_path}"
data = pd.read_csv(dataset_path)

print(data.head())
print(data.info())

# -----------------------------
# 2. Prepare categorical columns
# -----------------------------
categorical_cols = [
    "Sex", "Ethnicity", "Comorbidities", "Known_Allergies", "Previous_Adverse_Reactions",
    "Current_Medications", "Herbal_Supplements", "Alcohol_Use", "Smoking_Status",
    "CYP2D6_status", "CYP2C19_status", "HLA_B_5701", "Other_Genetic_Risks",
    "Drug_Name", "Drug_Route", "Drug_Frequency"
]

for col in categorical_cols:
    if col in data.columns:
        data[col] = data[col].astype("category")

# -----------------------------
# 3. Prepare features and targets
# -----------------------------
X = data.drop(columns=["Patient_ID", "Adverse_Reaction", "Reaction_Type"], errors="ignore")

# Label encoders
le_adverse = LabelEncoder()
y1 = le_adverse.fit_transform(data["Adverse_Reaction"])  # Binary classification
print("Adverse Reaction Classes:", le_adverse.classes_)

le_reaction = LabelEncoder()
y2 = le_reaction.fit_transform(data["Reaction_Type"])    # Multi-class classification
print("Reaction Type Classes:", le_reaction.classes_)

# -----------------------------
# 4. Split datasets
# -----------------------------
X_train1, X_test1, y_train1, y_test1 = train_test_split(
    X, y1, test_size=0.2, random_state=42, stratify=y1
)
X_train2, X_test2, y_train2, y_test2 = train_test_split(
    X, y2, test_size=0.2, random_state=42, stratify=y2
)

# -----------------------------
# 5. Train Adverse_Reaction model (binary)
# -----------------------------
scale_pos_weight = (len(y_train1) - sum(y_train1)) / sum(y_train1)

model1 = xgb.XGBClassifier(
    enable_categorical=True,
    objective="binary:logistic",
    eval_metric="logloss",
    n_estimators=150,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=scale_pos_weight,
    random_state=42
)

model1.fit(X_train1, y_train1)
y_pred1 = model1.predict(X_test1)

print("\nAdverse_Reaction Accuracy:", accuracy_score(y_test1, y_pred1))
print("Classification Report:\n", classification_report(y_test1, y_pred1))

cm1 = confusion_matrix(y_test1, y_pred1)
disp1 = ConfusionMatrixDisplay(confusion_matrix=cm1, display_labels=le_adverse.classes_)
disp1.plot(cmap=plt.cm.Blues)
plt.title("Adverse_Reaction Confusion Matrix")
plt.show()

joblib.dump(model1, "xgb_adverse_reaction_model.pkl")
joblib.dump(le_adverse, "le_adverse.pkl")
print("Adverse_Reaction model + encoder saved.")

# -----------------------------
# 6. Train Reaction_Type model (multi-class)
# -----------------------------
num_classes = len(le_reaction.classes_)
model2 = xgb.XGBClassifier(
    enable_categorical=True,
    objective="multi:softmax",
    num_class=num_classes,
    eval_metric="mlogloss",
    n_estimators=150,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)

model2.fit(X_train2, y_train2)
y_pred2 = model2.predict(X_test2)

print("\nReaction_Type Accuracy:", accuracy_score(y_test2, y_pred2))
print("Classification Report:\n", classification_report(y_test2, y_pred2))

cm2 = confusion_matrix(y_test2, y_pred2)
disp2 = ConfusionMatrixDisplay(confusion_matrix=cm2, display_labels=le_reaction.classes_)
disp2.plot(cmap=plt.cm.Oranges)
plt.title("Reaction_Type Confusion Matrix")
plt.show()

joblib.dump(model2, "xgb_reaction_type_model.pkl")
joblib.dump(le_reaction, "le_reaction.pkl")
print("Reaction_Type model + encoder saved.")

# -----------------------------
# 7. Predict on user CSV (with consistent encoding)
# -----------------------------
user_path = r"C:\Users\Anshuman Mishra\user_input.csv"
assert os.path.exists(user_path), f"File not found: {user_path}"
user_data = pd.read_csv(user_path)

X_user = user_data.drop(columns=["Patient_ID"], errors="ignore")
for col in categorical_cols:
    if col in X_user.columns:
        X_user[col] = X_user[col].astype("category")

# Load trained models + encoders
model1 = joblib.load("xgb_adverse_reaction_model.pkl")
model2 = joblib.load("xgb_reaction_type_model.pkl")
le_adverse = joblib.load("le_adverse.pkl")
le_reaction = joblib.load("le_reaction.pkl")

user_pred1 = model1.predict(X_user)
user_pred2 = model2.predict(X_user)

user_data["Adverse_Reaction_Predicted"] = le_adverse.inverse_transform(user_pred1)
user_data["Reaction_Type_Predicted"] = le_reaction.inverse_transform(user_pred2)

# Optional rule-based override
def rule_based_override(row, model_pred):
    if str(row.get("HLA_B_5701", "")).lower() in {"positive", "yes"}:
        return "Not Safe (genetic risk override)"
    if str(row.get("Previous_Adverse_Reactions", "")).lower() not in {"", "no", "none"}:
        return "Not Safe (history of adverse reactions)"
    return model_pred

user_data["Final_Summary"] = user_data.apply(
    lambda r: rule_based_override(r, r["Adverse_Reaction_Predicted"]), axis=1
)

user_data.to_csv("user_predictions.csv", index=False)
print("✅ User predictions saved as user_predictions.csv")
