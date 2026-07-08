import os
import sys
import pandas as pd
import joblib
import numpy as np
from datetime import date
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Input
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml_pipeline.train_model import fetch_data

def train_nn_difficulty_model():
    df = fetch_data()

    print("Preprocessing data for Neural Network...")
    
    # We want a continuous target score 0-1 for the NN based on days_since_filing
    # Let's cap max expected days at 2000 for normalization
    df['target_score'] = np.clip(df['days_since_filing'] / 2000.0, 0, 1)

    le_crime = LabelEncoder()
    df['crime_type_encoded'] = le_crime.fit_transform(df['crime_type'].astype(str))
    
    le_status = LabelEncoder()
    df['status_encoded'] = le_status.fit_transform(df['chargesheet_status'].astype(str))

    features = ['crime_type_encoded', 'days_since_filing', 'status_encoded', 'num_hearings']
    X = df[features]
    y = df['target_score']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("Building Basic Neural Network with Keras...")
    model = Sequential([
        Input(shape=(len(features),)),
        Dense(32, activation='relu'),
        Dense(16, activation='relu'),
        Dense(1, activation='sigmoid')  # Output layer for score 0-1
    ])

    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    
    print("Training Neural Network...")
    # Using larger batch size since we have millions of records potentially
    model.fit(X_train_scaled, y_train, epochs=10, batch_size=256, verbose=1, validation_split=0.1)

    print("\nEvaluating model on test set...")
    loss, mae = model.evaluate(X_test_scaled, y_test)
    print(f"Test Loss (MSE): {loss:.4f}, Test MAE: {mae:.4f}")

    print("Saving model and preprocessors...")
    artifacts_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'artifacts')
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
    train_nn_difficulty_model()
