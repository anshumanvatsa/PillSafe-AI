#!/usr/bin/env python3
"""
Test script for DrugSafe AI Flask API
"""

import requests
import pandas as pd
import io

def test_root_endpoint():
    """Test the root endpoint"""
    print("Testing root endpoint...")
    try:
        response = requests.get("http://127.0.0.1:8000/")
        if response.status_code == 200:
            print("✅ Root endpoint working:", response.json())
        else:
            print("❌ Root endpoint failed:", response.status_code)
    except Exception as e:
        print("❌ Root endpoint error:", e)

def test_csv_prediction():
    """Test CSV prediction endpoint"""
    print("\nTesting CSV prediction...")
    
    # Create a sample CSV
    sample_data = {
        'Age': [30, 45],
        'Sex': ['Male', 'Female'],
        'Weight_kg': [70, 65],
        'Height_cm': [175, 160],
        'BMI': [22.9, 25.4],
        'Ethnicity': ['Caucasian', 'Asian'],
        'Comorbidities': ['None', 'Diabetes'],
        'Known_Allergies': ['None', 'Penicillin'],
        'Previous_Adverse_Reactions': ['None', 'None'],
        'Current_Medications': ['None', 'Metformin'],
        'Herbal_Supplements': ['None', 'None'],
        'Alcohol_Use': ['No', 'Sometimes'],
        'Smoking_Status': ['No', 'No'],
        'Creatinine_mg_dL': [1.0, 1.2],
        'eGFR_mL_min': [90, 75],
        'ALT_U_L': [25, 30],
        'AST_U_L': [30, 35],
        'Bilirubin_mg_dL': [0.8, 1.0],
        'Hemoglobin_g_dL': [14.0, 13.5],
        'QTc_ms': [400, 420],
        'CYP2D6_status': ['Normal', 'Normal'],
        'CYP2C19_status': ['Normal', 'Normal'],
        'HLA_B_5701': ['Negative', 'Negative'],
        'Other_Genetic_Risks': ['None', 'None'],
        'Drug_Name': ['Aspirin', 'Warfarin'],
        'Drug_Dose_mg': [100, 5],
        'Drug_Route': ['Oral', 'Oral'],
        'Drug_Frequency': ['Once daily', 'Once daily']
    }
    
    df = pd.DataFrame(sample_data)
    
    # Save to CSV in memory
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_data = csv_buffer.getvalue()
    
    try:
        # Send CSV file
        files = {'file': ('test_data.csv', csv_data, 'text/csv')}
        response = requests.post("http://127.0.0.1:8000/predict", files=files)
        
        if response.status_code == 200:
            print("✅ CSV prediction successful")
            print("Response content type:", response.headers.get('content-type'))
            print("Response size:", len(response.content), "bytes")
            
            # Save response to file
            with open('test_predictions.csv', 'wb') as f:
                f.write(response.content)
            print("✅ Predictions saved to test_predictions.csv")
            
            # Show first few lines
            result_df = pd.read_csv(io.StringIO(response.text))
            print("\nFirst few rows of predictions:")
            print(result_df.head())
            
        else:
            print("❌ CSV prediction failed:", response.status_code)
            print("Error:", response.text)
    except Exception as e:
        print("❌ CSV prediction error:", e)

def main():
    """Run all tests"""
    print("DrugSafe AI API Test")
    print("=" * 30)
    
    test_root_endpoint()
    test_csv_prediction()
    
    print("\n" + "=" * 30)
    print("Test completed!")

if __name__ == "__main__":
    main()

