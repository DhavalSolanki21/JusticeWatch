import os
import sys
import django
import pandas as pd
import joblib
from datetime import date
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'justicewatch.settings')
django.setup()

from cases.models import Case

def extract_features(cases):
    data = []
    for c in cases:
        days_since_fir = (date.today() - c.fir_date).days if c.fir_date else 0
        num_hearings = c.hearings.count()
        # Synthetic difficulty logic for training
        base_diff = min(1.0, (days_since_fir / 3650) * 0.5 + (num_hearings / 10) * 0.5)
        if c.crime_type in ['Murder', 'Corruption']:
            base_diff += 0.2
            
        target_score = min(1.0, max(0.0, base_diff))

        data.append({
            'case_id': c.id,
            'crime_type': c.crime_type,
            'days_since_fir': days_since_fir,
            'chargesheet_status': c.chargesheet_status,
            'num_hearings': num_hearings,
            'target_score': target_score
        })
    return pd.DataFrame(data)

def train_difficulty_model():
    print("Fetching cases from database...")
    cases = Case.objects.prefetch_related('hearings').all()
    if not cases.exists():
        print("No cases found! Run generate_synthetic_data.py first.")
        return

    df = extract_features(cases)
    
    print("Preprocessing data...")
    le_crime = LabelEncoder()
    df['crime_type_encoded'] = le_crime.fit_transform(df['crime_type'])
    
    le_status = LabelEncoder()
    df['status_encoded'] = le_status.fit_transform(df['chargesheet_status'])

    features = ['crime_type_encoded', 'days_since_fir', 'status_encoded', 'num_hearings']
    X = df[features]
    y = df['target_score']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    score = model.score(X_test, y_test)
    print(f"Model R^2 Score on test set: {score:.2f}")

    print("Saving model and encoders...")
    model_path = os.path.join(os.path.dirname(__file__), 'difficulty_model.pkl')
    encoders_path = os.path.join(os.path.dirname(__file__), 'encoders.pkl')
    
    joblib.dump(model, model_path)
    joblib.dump({'crime_type': le_crime, 'status': le_status}, encoders_path)
    print("Training complete and files saved!")

if __name__ == '__main__':
    train_difficulty_model()
