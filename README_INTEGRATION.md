# DrugSafe AI - Integrated Flask + React Application

This is a complete integration of your drug safety prediction system with a modern React frontend, replacing the Streamlit interface.

## 🚀 Quick Start

### Option 1: Using the Batch File (Windows)
1. Double-click `start_app.bat`
2. The application will automatically:
   - Install required dependencies
   - Build the React frontend
   - Start the Flask server
   - Open your browser to http://127.0.0.1:8000

### Option 2: Manual Setup
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Build the React frontend:
   ```bash
   cd pill-wise-health-main
   npm install
   npm run build
   cd ..
   ```

3. Start the Flask application:
   ```bash
   python run_app.py
   ```

4. Open your browser to: http://127.0.0.1:8000

## 📁 Project Structure

```
Medicine-Predictor/
├── flask_app.py              # Main Flask application
├── run_app.py               # Startup script
├── start_app.bat            # Windows batch file
├── requirements.txt         # Python dependencies
├── app.py                   # Original Streamlit app (kept for reference)
├── *.pkl                    # ML model files
├── user_predictions.csv     # Sample data
└── pill-wise-health-main/   # React frontend
    ├── src/
    ├── dist/                # Built frontend (auto-generated)
    └── package.json
```

## 🔧 Features

### Backend (Flask)
- **API Endpoints:**
  - `POST /api/predict` - Single patient prediction
  - `POST /api/predict-csv` - Batch CSV processing
  - `GET /api/download/<filename>` - Download results
  - `GET /api/health` - Health check

- **Frontend Serving:**
  - Serves React build files
  - Handles routing for SPA

### Frontend (React)
- **Manual Entry:** Form-based single patient analysis
- **CSV Upload:** Batch processing with detailed results
- **Results Display:** 
  - Summary statistics
  - Detailed results table
  - Download processed CSV
- **Modern UI:** Built with Tailwind CSS and shadcn/ui

## 📊 CSV Processing

The CSV processing now provides:
- **Summary Statistics:** Safe/Harmful counts and percentages
- **Detailed Results Table:** First 10 records with predictions
- **Download Option:** Full results as CSV file
- **Error Handling:** Better error messages and validation

## 🔄 Migration from Streamlit

The new integrated system maintains the same functionality as your Streamlit app but with:
- Better performance (Flask vs Streamlit)
- Modern React UI
- Better CSV handling and display
- Professional API endpoints
- Easier deployment options

## 🛠️ Development

### Backend Development
- Edit `flask_app.py` for API changes
- The Flask app automatically reloads in debug mode

### Frontend Development
- Edit files in `pill-wise-health-main/src/`
- Run `npm run dev` in the frontend directory for development
- Run `npm run build` to build for production

## 📝 API Usage

### Single Prediction
```bash
curl -X POST http://127.0.0.1:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"Age": 30, "Sex": "Male", "Weight_kg": 70, ...}'
```

### CSV Upload
```bash
curl -X POST http://127.0.0.1:8000/api/predict-csv \
  -F "file=@your_data.csv"
```

## 🚨 Troubleshooting

1. **Models not loading:** Ensure all `.pkl` files are in the root directory
2. **Frontend not building:** Run `npm install` in the frontend directory
3. **Port conflicts:** Change port in `flask_app.py` if 8000 is occupied
4. **CORS issues:** The app is configured for localhost development

## 📈 Next Steps

- Deploy to cloud platforms (Heroku, AWS, etc.)
- Add authentication and user management
- Implement database storage for predictions
- Add more visualization options
- Create admin dashboard for model management

