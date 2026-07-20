# DrugSafe AI 💊

An intelligent drug safety prediction system that analyzes patient profiles to predict adverse reactions and determine medication safety. 

This project features a **React Frontend** deployed on Vercel and a **Machine Learning API Backend** deployed on Render.

## 🚀 Live Demo

- **Frontend Application:** [https://pill-wise-health-main.vercel.app](https://pill-wise-health-main.vercel.app)
- **Backend API:** [https://pillsafe-ai.onrender.com](https://pillsafe-ai.onrender.com)

---

## 🎯 Features

- **Advanced ML Predictions**: Powered by XGBoost, predicting adverse reactions and their specific types (e.g., Hypersensitivity, GI, etc.).
- **CSV Batch Analysis**: Upload multiple patient records at once for rapid analysis.
- **Modern UI**: Built with React, TypeScript, Tailwind CSS, and shadcn/ui.
- **Cloud Hosted**: Seamless integration between Vercel (Frontend) and Render (Backend).

## 📊 How It Works

1. **Input**: User uploads a CSV file containing patient data (Age, BMI, Genetics, Current Medications, etc.).
2. **Processing**: The Vercel frontend sends the CSV to the Render API. The API cleans, normalizes, and processes the data through trained XGBoost `.pkl` models.
3. **Output**: The API returns a JSON response containing the safety predictions (Safe vs. Harmful), which the frontend beautifully visualizes and allows the user to download.

---

## 💻 Local Development

If you wish to run this project locally on your machine:

### 1. Clone the Repository
```bash
git clone https://github.com/anshumanvatsa/PillSafe-AI.git
cd PillSafe-AI
```

### 2. Start the Flask API (Backend)
```bash
# Install dependencies
pip install -r requirements.txt

# Start the server
python flask_app.py
```
*The API will be available at: http://127.0.0.1:8000*

### 3. Start the React App (Frontend)
```bash
# Open a new terminal window
cd pill-wise-health-main

# Install dependencies and start
npm install
npm run dev
```
*The frontend will be available at: http://localhost:5173*

---

## 📁 Project Structure

```
PillSafe-AI/
├── flask_app.py              # Flask API Production Server
├── requirements.txt          # Python ML/API dependencies
├── *.pkl                     # Pre-trained XGBoost ML models
├── test.csv                  # Sample test file
└── pill-wise-health-main/    # React Frontend Directory
    ├── src/                  # React components & logic
    ├── package.json          # Node dependencies
    └── vercel.json           # Vercel deployment config
```

## 📝 API Endpoints

### `GET /`
Returns the health status of the API.

### `POST /predict`
Accepts a `multipart/form-data` CSV file upload, runs it through the XGBoost model, and returns a JSON object containing the processed data, original columns, and the newly predicted `Safety_Summary` and `Reaction_Type_Predicted`.

---

*Developed by Anshuman.*
