#!/usr/bin/env python3
"""
DrugSafe AI - Flask API Server
This script starts the Flask backend for CSV prediction.
"""

import os
import sys
import subprocess
import webbrowser
import time
from pathlib import Path

def check_requirements():
    """Check if required packages are installed"""
    try:
        import flask
        import pandas
        import joblib
        import sklearn
        import xgboost
        print("All required packages are installed")
        return True
    except ImportError as e:
        print(f"Missing required package: {e}")
        print("Please install requirements: pip install flask pandas scikit-learn joblib xgboost")
        return False

def check_models():
    """Check if model files exist"""
    model_files = [
        "xgb_adverse_reaction_model.pkl",
        "xgb_reaction_type_model.pkl",
        "le_adverse.pkl",
        "le_reaction.pkl"
    ]
    
    missing_files = []
    for file in model_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"Missing model files: {', '.join(missing_files)}")
        return False
    
    print("All model files found")
    return True

def main():
    """Main function to start the application"""
    print("Starting DrugSafe AI Application...")
    print("=" * 50)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Check models
    if not check_models():
        sys.exit(1)
    
    print("\nStarting Flask server...")
    print("API will be available at: http://127.0.0.1:8000")
    print("CSV prediction endpoint: http://127.0.0.1:8000/predict")
    print("=" * 50)
    
    # Start Flask app
    try:
        from flask_app import app
        print("Flask app loaded successfully")
        
        # Open browser after a short delay
        def open_browser():
            time.sleep(2)
            webbrowser.open('http://127.0.0.1:8000')
        
        import threading
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        # Run the Flask app
        app.run(host='127.0.0.1', port=8000, debug=False)
        
    except Exception as e:
        print(f"Failed to start Flask app: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()