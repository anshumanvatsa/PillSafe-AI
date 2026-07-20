<div align="center">
  
# 💊 PillSafe AI
**Intelligent Pharmacogenomic Drug Safety Predictor**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white)](https://vitejs.dev/)
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-1761AF?style=for-the-badge&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

PillSafe AI is a full-stack, machine learning-powered platform designed to analyze patient clinical and genetic profiles (Pharmacogenomics) to predict dangerous adverse drug reactions *before* they happen.

[Live Frontend (Vercel)](https://pill-wise-health-main.vercel.app) • [API Backend (Render)](https://pillsafe-ai.onrender.com)

</div>

---

## 🚀 Live Demo

Experience the full production build here:
👉 **[pill-wise-health-main.vercel.app](https://pill-wise-health-main.vercel.app)**

---

## 🧠 Machine Learning Architecture

The system utilizes dual **eXtreme Gradient Boosting (XGBoost)** classifiers trained on diverse patient data, clinical records, and genetic biomarkers.

### 📈 Model 1: Adverse Reaction Predictor
- **Objective**: Binary classification (Safe vs. Harmful)
- **Features Analyzed**: BMI, Age, Hepatic/Renal function (eGFR, ALT, AST), existing comorbidities.
- **Accuracy Target**: >94% validation accuracy

### 📈 Model 2: Reaction Type Multi-Class Predictor
- **Objective**: Categorizes the specific physiological response if a drug is deemed unsafe.
- **Classes**: Hypersensitivity, Gastrointestinal, Cardiovascular, Hepatic, Neurological.
- **Key Biomarkers**: Evaluates `HLA-B*5701`, `CYP2D6`, and `CYP2C19` metabolizer statuses.
- **Accuracy Target**: ~89% multi-class precision

*Both models utilize native Pandas categorical encoding to drastically reduce memory footprint during inference.*

---

## 🛠️ Technology Stack

### Frontend (Vercel)
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui & Radix Primitives
- **Animations**: Framer Motion

### Backend API (Render)
- **Framework**: Python Flask
- **Server**: Gunicorn (WSGI)
- **Data Processing**: Pandas & NumPy
- **Machine Learning**: Scikit-Learn & XGBoost 2.0.3

---

## 🧬 Pharmacogenomic (PGx) Integration

PillSafe AI implements strict, rules-based clinical overrides alongside ML predictions. For example, if a patient is **HLA-B\*5701 Positive** and is prescribed **Abacavir**, the ML model's probability distribution is overridden to instantly flag a severe hypersensitivity risk, adhering to FDA and CPIC clinical guidelines.

---

## 💻 Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/anshumanvatsa/PillSafe-AI.git
cd PillSafe-AI
```

### 2. Start the Flask API
```bash
# Install exact ML dependencies
pip install -r requirements.txt

# Start the Flask API
python flask_app.py
```
*API runs on: http://127.0.0.1:8000*

### 3. Start the React Frontend
```bash
cd pill-wise-health-main
npm install
npm run dev
```
*Frontend runs on: http://localhost:5173*

---

## 📁 Repository Structure

```
PillSafe-AI/
├── flask_app.py              # Production Flask API
├── requirements.txt          # Python requirements (NumPy <2, XGBoost 2.0.3)
├── *.pkl                     # Serialized XGBoost models & Encoders
├── test.csv                  # Sample CSV for batch testing
├── xgboost_1.py              # ML Training & Evaluation Script
└── pill-wise-health-main/    # React Frontend
    ├── src/                  # React components & UI design
    ├── package.json          # Node.js dependencies
    └── vercel.json           # Vercel deployment routing
```

---

<div align="center">
  <i>Developed and engineered by Anshuman</i>
</div>
