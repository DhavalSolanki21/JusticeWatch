import os
import sys
import pandas as pd
import numpy as np
import pickle
import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from tqdm import tqdm

def fetch_data():
    """Fetch real data directly from the CSV files."""
    print("Fetching and combining data from CSVs (2010-2018)...")
    base_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    keys_path = os.path.join(base_path, 'keys')
    cases_path = os.path.join(base_path, 'cases')
    
    type_key = pd.read_csv(os.path.join(keys_path, 'type_name_key.csv'))
    
    gj_cases = []
    
    # Process 2010 to 2018
    for year in range(2010, 2019):
        file_path = os.path.join(cases_path, f'cases_{year}.csv')
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue
            
        print(f"Processing {year}...")
        # Chunked reading to filter for Gujarat (state_code=17)
        chunk_iter = pd.read_csv(file_path, chunksize=500000, low_memory=False)
        for chunk in chunk_iter:
            gj_chunk = chunk[chunk['state_code'] == 17]
            if not gj_chunk.empty:
                gj_cases.append(gj_chunk)
                
    if not gj_cases:
        raise ValueError("No Gujarat cases found in the dataset.")
        
    df = pd.concat(gj_cases, ignore_index=True)
    print(f"Total Gujarat cases extracted: {len(df)}")
    
    # Feature Engineering (mimicking what we do in ORM)
    print("Feature engineering...")
    
    # Merge keys to get string names
    # For simplicity across years, we just drop duplicates on type_name
    type_key_unique = type_key.drop_duplicates('type_name')
    df = df.merge(type_key_unique[['type_name', 'type_name_s']], on='type_name', how='left')
    
    df['date_of_filing'] = pd.to_datetime(df['date_of_filing'], errors='coerce')
    df['date_of_decision'] = pd.to_datetime(df['date_of_decision'], errors='coerce')
    
    # Drop rows without filing date
    df = df.dropna(subset=['date_of_filing'])
    
    # Calculate days since filing
    # For pending cases, we pretend the 'current date' is Dec 31, 2018
    # For disposed cases, we use date_of_decision
    df['days_since_filing'] = np.where(
        pd.notna(df['date_of_decision']),
        (df['date_of_decision'] - df['date_of_filing']).dt.days,
        (pd.to_datetime('2018-12-31') - df['date_of_filing']).dt.days
    )
    
    # Clean negative days
    df = df[df['days_since_filing'] >= 0]
    
    # Extract features for ML
    def determine_category(type_s):
        type_s = str(type_s).lower()
        if 'cr' in type_s or 'criminal' in type_s or 'bail' in type_s:
            return 'Criminal'
        elif 'appeal' in type_s:
            return 'Appeal'
        return 'Civil'
        
    df['case_category'] = df['type_name_s'].apply(determine_category)
    df['crime_type'] = df['type_name_s'].fillna('Unknown').astype(str).str[:99]
    df['chargesheet_status'] = 'Not Filed'  # Placeholder as dataset doesn't have explicit chargesheet status easily parsed
    df['num_parties'] = 2
    df['num_hearings'] = np.random.randint(1, 15, size=len(df)) # Placeholder for hearing counts, normally fetched from ORM relation
    
    # Calculate Target
    def determine_difficulty(days):
        if days < 180: return 'low'
        elif days < 365: return 'medium'
        elif days < 730: return 'high'
        return 'critical'
        
    df['duration_risk'] = df['days_since_filing'].apply(determine_difficulty)
    df['is_disposed'] = pd.notna(df['date_of_decision']).astype(int)
    df['is_disposed_12m'] = ((df['is_disposed'] == 1) & (df['days_since_filing'] <= 365)).astype(int)
    
    return df

def train_models():
    df = fetch_data()

    print("\n--- Encoding Features ---")
    encoders = {}
    categorical_cols = ['crime_type', 'case_category', 'chargesheet_status']
    
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
        
    feature_cols = ['crime_type', 'case_category', 'chargesheet_status', 'days_since_filing', 'num_parties', 'num_hearings']
    
    X = df[feature_cols]
    
    # Model 1
    print("\n--- Training Model 1: Duration Risk Classifier ---")
    y_duration = df['duration_risk']
    
    le_dur = LabelEncoder()
    y_duration_encoded = le_dur.fit_transform(y_duration)
    encoders['duration_risk'] = le_dur
    
    X_train, X_test, y_train, y_test = train_test_split(X, y_duration_encoded, test_size=0.2, random_state=42)
    
    # We use n_jobs=-1 to utilize all cores
    rf_duration = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=15, n_jobs=-1)
    print("Fitting model...")
    rf_duration.fit(X_train, y_train)
    
    print("Evaluating...")
    y_pred = rf_duration.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le_dur.classes_))
    
    # Model 2
    print("\n--- Training Model 2: Disposal Likelihood Classifier ---")
    known_disposal_df = df[(df['is_disposed'] == 1) | (df['days_since_filing'] > 365)]
    print(f"Training on {len(known_disposal_df)} cases with known 12-month outcomes.")
    
    X_disp = known_disposal_df[feature_cols]
    y_disp = known_disposal_df['is_disposed_12m']
    
    X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(X_disp, y_disp, test_size=0.2, random_state=42)
    
    rf_disposal = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=15, n_jobs=-1)
    print("Fitting model...")
    rf_disposal.fit(X_train_d, y_train_d)
    
    print("Evaluating...")
    y_pred_d = rf_disposal.predict(X_test_d)
    print(f"Accuracy: {accuracy_score(y_test_d, y_pred_d):.4f}")
    
    print("\n--- Saving Artifacts ---")
    artifacts_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'artifacts')
    os.makedirs(artifacts_dir, exist_ok=True)
    
    with open(os.path.join(artifacts_dir, 'duration_risk_model.pkl'), 'wb') as f:
        pickle.dump(rf_duration, f)
        
    with open(os.path.join(artifacts_dir, 'disposal_likelihood_model.pkl'), 'wb') as f:
        pickle.dump(rf_disposal, f)
        
    with open(os.path.join(artifacts_dir, 'encoders.pkl'), 'wb') as f:
        pickle.dump(encoders, f)
        
    print(f"Models and encoders saved to {artifacts_dir}/")

if __name__ == '__main__':
    train_models()
