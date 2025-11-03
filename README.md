# DrugSafe AI - Flask API + React Frontend

A complete drug safety prediction system with a Flask backend API and React frontend, replacing the original Streamlit interface.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Flask API

```bash
python flask_app.py
```

The API will be available at: http://127.0.0.1:8000

### 3. Start the React Frontend

```bash
cd pill-wise-health-main
npm install
npm run dev
```

The frontend will be available at: http://localhost:5173

## 📁 Project Structure

```
Medicine-Predictor/
├── flask_app.py              # Flask API server
├── run_app.py               # Startup script
├── requirements.txt         # Python dependencies
├── app.py                   # Original Streamlit app (reference)
├── *.pkl                    # ML model files
├── user_predictions.csv     # Sample data
└── pill-wise-health-main/   # React frontend
    ├── src/
    ├── dist/                # Built frontend
    └── package.json
```

## 🔧 API Endpoints

### Root Endpoint
- **GET** `/` - Returns API status
- **Response**: `{"message": "Medicine Predictor API is running"}`

### CSV Prediction
- **POST** `/predict` - Upload CSV file for batch prediction
- **Content-Type**: `multipart/form-data`
- **Body**: CSV file with key `file`
- **Response**: CSV file download with predictions

## 📊 CSV Processing

The API processes CSV files with the same logic as your original Streamlit app:

1. **Input**: CSV file with patient data
2. **Processing**: 
   - Data normalization and preprocessing
   - XGBoost model predictions
   - Label encoding/decoding
3. **Output**: CSV file with original data + predictions:
   - `Adverse_Reaction_Predicted`
   - `Reaction_Type_Predicted` 
   - `Safety_Summary` ("Safe" or "Harmful")

## 🎯 React Frontend Features

### Manual Entry
- Form-based single patient analysis
- Real-time validation
- Immediate prediction results

### CSV Upload
- Drag-and-drop file upload
- Automatic CSV processing
- Direct download of results
- Progress indicators

### Modern UI
- Built with React + TypeScript
- Tailwind CSS styling
- shadcn/ui components
- Responsive design

## 🔄 Migration from Streamlit

This integrated system provides:

- **Better Performance**: Flask is faster than Streamlit
- **Modern UI**: Professional React interface
- **API Access**: RESTful endpoints for integration
- **File Handling**: Better CSV upload/download experience
- **Deployment Ready**: Easy to deploy to cloud platforms

## 🛠️ Development

### Backend Development
- Edit `flask_app.py` for API changes
- Flask auto-reloads in debug mode
- Test endpoints with curl or Postman

### Frontend Development
- Edit files in `pill-wise-health-main/src/`
- Hot reload with `npm run dev`
- Build for production with `npm run build`

## 📝 Usage Examples

### Test API with curl

```bash
# Test root endpoint
curl http://127.0.0.1:8000/

# Test CSV prediction
curl -X POST -F "file=@your_data.csv" http://127.0.0.1:8000/predict --output predictions.csv
```

### React Frontend Usage

1. Open http://localhost:5173
2. Navigate to "Safety Check" section
3. Choose "CSV Upload" tab
4. Select your CSV file
5. Click "Analyze CSV Data"
6. Results will be automatically downloaded

## 🚨 Troubleshooting

### Common Issues

1. **Models not loading**: Ensure all `.pkl` files are in the root directory
2. **Port conflicts**: Change port in `flask_app.py` if 8000 is occupied
3. **Frontend not building**: Run `npm install` in the frontend directory
4. **CORS issues**: The app is configured for localhost development

### Dependencies

Make sure you have:
- Python 3.7+
- Node.js 16+
- All model files (`.pkl`)

## 📈 Next Steps

- Deploy to cloud platforms (Heroku, AWS, etc.)
- Add authentication and user management
- Implement database storage for predictions
- Add more visualization options
- Create admin dashboard for model management

## 🔗 API Documentation

### POST /predict

Upload a CSV file for drug safety prediction.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: Form data with `file` field containing CSV

**Response:**
- Content-Type: text/csv
- Body: CSV file with predictions
- Headers: Content-Disposition: attachment; filename="drug_safety_predictions.csv"

**Example CSV Format:**
```csv
Age,Sex,Weight_kg,Height_cm,BMI,Ethnicity,Comorbidities,Known_Allergies,Previous_Adverse_Reactions,Current_Medications,Herbal_Supplements,Alcohol_Use,Smoking_Status,Creatinine_mg_dL,eGFR_mL_min,ALT_U_L,AST_U_L,Bilirubin_mg_dL,Hemoglobin_g_dL,QTc_ms,CYP2D6_status,CYP2C19_status,HLA_B_5701,Other_Genetic_Risks,Drug_Name,Drug_Dose_mg,Drug_Route,Drug_Frequency
30,Male,70,175,22.9,Caucasian,None,None,None,None,None,No,No,1.0,90,25,30,0.8,14.0,400,Normal,Normal,Negative,None,Aspirin,100,Oral,Once daily
```

**Output CSV includes:**
- All original columns
- `Adverse_Reaction_Predicted`
- `Reaction_Type_Predicted`
- `Safety_Summary`

