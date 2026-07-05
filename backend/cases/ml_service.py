import os
import joblib
import pandas as pd
from datetime import date
from django.conf import settings

# Paths to the saved ML files
MODEL_PATH = os.path.join(settings.BASE_DIR, 'ml_pipeline', 'difficulty_model.pkl')
ENCODERS_PATH = os.path.join(settings.BASE_DIR, 'ml_pipeline', 'encoders.pkl')

def get_difficulty_score(crime_type, fir_date, chargesheet_status, num_hearings):
    """
    Loads the trained model and encoders, extracts features, and predicts the difficulty score.
    Returns the score and a list of risk factors.
    """
    if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODERS_PATH):
        return None, ["ML Model not found."]
        
    try:
        model = joblib.load(MODEL_PATH)
        encoders = joblib.load(ENCODERS_PATH)
        le_crime = encoders['crime_type']
        le_status = encoders['status']
        
        # Safely encode categoricals
        crime_encoded = le_crime.transform([crime_type])[0] if crime_type in le_crime.classes_ else 0
        status_encoded = le_status.transform([chargesheet_status])[0] if chargesheet_status in le_status.classes_ else 0
        
        days_since_fir = (date.today() - fir_date).days if fir_date else 0
        
        # Create DataFrame matching training features
        df = pd.DataFrame([{
            'crime_type_encoded': crime_encoded,
            'days_since_fir': days_since_fir,
            'status_encoded': status_encoded,
            'num_hearings': num_hearings
        }])
        
        score = model.predict(df)[0]
        
        # Generate human readable risk factors based on inputs
        risk_factors = []
        if days_since_fir > 365:
            risk_factors.append("Case is over 1 year old.")
        if num_hearings > 5:
            risk_factors.append(f"High number of hearings ({num_hearings}).")
        if crime_type in ['Murder', 'Corruption']:
            risk_factors.append(f"Severe crime category ({crime_type}).")
            
        return round(score, 2), risk_factors
    except Exception as e:
        print(f"ML Prediction Error: {e}")
        return None, ["Error running prediction model."]
