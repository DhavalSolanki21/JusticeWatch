import os
import sys
import django
import pandas as pd
import joblib
from datetime import date
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Input
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'justicewatch.settings')
django.setup()

from cases.models import Case
from ml_pipeline.train_model import extract_features

def train_nn_difficulty_model():
    print("Fetching cases from database...")
    cases = Case.objects.prefetch_related('hearings').all()
    if not cases.exists():
        print("No cases found! Run generate_synthetic_data.py first.")
        return

    df = extract_features(cases)
    
    print("Preprocessing data for Neural Network...")
    le_crime = LabelEncoder()
    df['crime_type_encoded'] = le_crime.fit_transform(df['crime_type'])
    
    le_status = LabelEncoder()
    df['status_encoded'] = le_status.fit_transform(df['chargesheet_status'])

    features = ['crime_type_encoded', 'days_since_fir', 'status_encoded', 'num_hearings']
    X = df[features]
    y = df['target_score']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Normalize inputs for better NN training
    from sklearn.preprocessing import StandardScaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("Building Basic Neural Network with Keras...")
    model = Sequential([
        Input(shape=(len(features),)),
        Dense(16, activation='relu'),
        Dense(8, activation='relu'),
        Dense(1, activation='sigmoid')  # Output layer for score 0-1
    ])

    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    
    print("Training Neural Network...")
    model.fit(X_train_scaled, y_train, epochs=50, batch_size=16, verbose=1, validation_split=0.1)

    print("\nEvaluating model on test set...")
    loss, mae = model.evaluate(X_test_scaled, y_test)
    print(f"Test Loss (MSE): {loss:.4f}, Test MAE: {mae:.4f}")

    print("Saving model and preprocessors...")
    # Artifacts should be saved to ml_pipeline/artifacts for predictions
    artifacts_dir = os.path.join(settings.BASE_DIR, 'ml_pipeline', 'artifacts')
    os.makedirs(artifacts_dir, exist_ok=True)
    
    model_path = os.path.join(artifacts_dir, 'nn_difficulty_model.keras')
    encoders_path = os.path.join(artifacts_dir, 'nn_encoders_scaler.pkl')
    
    model.save(model_path)
    joblib.dump({
        'crime_type': le_crime, 
        'status': le_status,
        'scaler': scaler
    }, encoders_path)
    print(f"Training complete! Artifacts saved to {artifacts_dir}")

if __name__ == '__main__':
    from django.conf import settings
    train_nn_difficulty_model()
