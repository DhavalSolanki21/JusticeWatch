import os
import pickle
import pandas as pd
from datetime import date
from django.conf import settings

# Paths to the saved ML files
DURATION_MODEL_PATH = os.path.join(settings.BASE_DIR, 'ml_pipeline', 'artifacts', 'duration_risk_model.pkl')
DISPOSAL_MODEL_PATH = os.path.join(settings.BASE_DIR, 'ml_pipeline', 'artifacts', 'disposal_likelihood_model.pkl')
ENCODERS_PATH = os.path.join(settings.BASE_DIR, 'ml_pipeline', 'artifacts', 'encoders.pkl')

def safe_encode(le, val):
    try:
        # if val is string and in classes
        if str(val) in le.classes_:
            return le.transform([str(val)])[0]
        else:
            return 0 # default / unknown
    except:
        return 0

def predict_for_case(case=None, custom_data=None):
    """
    Loads the trained real models and encoders, extracts features from the given Case,
    and returns duration risk and disposal likelihood predictions.
    If custom_data is provided, it uses those values directly instead of a Case object.
    """
    if not os.path.exists(DURATION_MODEL_PATH) or not os.path.exists(DISPOSAL_MODEL_PATH) or not os.path.exists(ENCODERS_PATH):
        return {
            'error': 'ML Models not found. Please run training pipeline.'
        }
        
    try:
        with open(DURATION_MODEL_PATH, 'rb') as f:
            rf_duration = pickle.load(f)
            
        with open(DISPOSAL_MODEL_PATH, 'rb') as f:
            rf_disposal = pickle.load(f)
            
        with open(ENCODERS_PATH, 'rb') as f:
            encoders = pickle.load(f)
            
        le_crime = encoders.get('crime_type')
        le_category = encoders.get('case_category')
        le_status = encoders.get('chargesheet_status')
        le_dur = encoders.get('duration_risk')
        
        if custom_data:
            crime_type_val = custom_data.get('crime_type', 'Unknown')
            category_val = custom_data.get('case_category', 'Civil')
            status_val = custom_data.get('chargesheet_status', 'Not Filed')
            days_since_filing = int(custom_data.get('days_since_filing', 0))
            num_parties = int(custom_data.get('num_parties', 2))
            num_hearings = int(custom_data.get('num_hearings', 0))
        else:
            crime_type_val = case.crime_type or 'Unknown'
            category_val = case.case_category
            status_val = case.chargesheet_status
            
            days_since_filing = 0
            if case.filed_date:
                days_since_filing = (date.today() - case.filed_date).days

            num_parties = case.num_parties
            num_hearings = case.hearings.count()
            
        crime_encoded = safe_encode(le_crime, crime_type_val)
        category_encoded = safe_encode(le_category, category_val)
        status_encoded = safe_encode(le_status, status_val)
        
        # Must match training feature columns exactly
        # ['crime_type', 'case_category', 'chargesheet_status', 'days_since_filing', 'num_parties', 'num_hearings']
        df = pd.DataFrame([{
            'crime_type': crime_encoded,
            'case_category': category_encoded,
            'chargesheet_status': status_encoded,
            'days_since_filing': days_since_filing,
            'num_parties': num_parties,
            'num_hearings': num_hearings
        }])
        
        # Duration Risk Prediction
        dur_probs = rf_duration.predict_proba(df)[0]
        dur_class_idx = rf_duration.predict(df)[0]
        dur_class_name = le_dur.inverse_transform([dur_class_idx])[0]
        dur_confidence = round(max(dur_probs) * 100, 1)
        
        # Disposal Likelihood Prediction
        disp_probs = rf_disposal.predict_proba(df)[0]
        disp_class_idx = rf_disposal.predict(df)[0]
        disp_confidence = round(max(disp_probs) * 100, 1)
        
        # 1 means likely to dispose in 12m, 0 means unlikely
        disp_text = "Likely (within 12m)" if disp_class_idx == 1 else "Unlikely (within 12m)"
        
        # Feature Importance Factors (just heuristic rules based on input for UI explanation)
        risk_factors = []
        if days_since_filing > 365:
            risk_factors.append(f"Case age is high ({days_since_filing} days).")
        if num_hearings > 5:
            risk_factors.append(f"High number of hearings ({num_hearings}).")
        if category_val == 'Criminal':
            risk_factors.append(f"Criminal cases historically take longer.")
            
        if not risk_factors:
            risk_factors.append("No specific high-risk features detected.")

        return {
            'duration_risk': dur_class_name,
            'duration_confidence': dur_confidence,
            'disposal_likelihood': disp_text,
            'disposal_confidence': disp_confidence,
            'risk_factors': risk_factors
        }
        
    except Exception as e:
        print(f"ML Prediction Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'error': f"Prediction error: {str(e)}"
        }
