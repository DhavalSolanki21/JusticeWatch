import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, confusion_matrix
from train_model import fetch_data, calculate_multiclass_metrics

def train_neural_network():
    print("Fetching data for Neural Network Comparison...")
    df = fetch_data(sample_size=50000)
    
    print("\n--- Preprocessing for Neural Network ---")
    
    # Filter to only disposed cases (same as classification task)
    disp_df = df[df['disposal_type'] != 'pending'].copy()
    
    le_disp = LabelEncoder()
    disp_df['disposal_type_enc'] = le_disp.fit_transform(disp_df['disposal_type'])
    
    # We must match feature_cols from train_model.py
    # Since NN requires scaling for numerical and one-hot for categorical ideally, 
    # but for simplicity/direct comparison we will standardize the label encoded values too.
    categorical_cols = ['crime_type', 'case_category', 'chargesheet_status']
    for col in categorical_cols:
        le = LabelEncoder()
        disp_df[col] = le.fit_transform(disp_df[col].astype(str))
        
    feature_cols = [
        'crime_type', 'case_category', 'chargesheet_status', 
        'num_parties', 'num_hearings', 
        'filing_to_first_list_days', 'listing_gap_days', 
        'court_caseload', 'case_age_days', 
        'female_defendant', 'female_petitioner'
    ]
    
    X = disp_df[feature_cols].copy()
    y = disp_df['disposal_type_enc'].values
    num_classes = len(le_disp.classes_)
    
    # One-hot encode targets
    y_cat = to_categorical(y, num_classes=num_classes)
    
    # Scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_cat, test_size=0.2, random_state=42)
    
    print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples.")
    
    print("\n--- Building Keras Sequential Model ---")
    model = Sequential([
        Dense(64, activation='relu', input_shape=(X_train.shape[1],)),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(num_classes, activation='softmax')  # Multi-class classification
    ])
    
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    
    print("\n--- Training Model ---")
    history = model.fit(
        X_train, y_train,
        validation_split=0.2,
        epochs=15,
        batch_size=128,
        verbose=1
    )
    
    print("\n--- Evaluating Model ---")
    # Predict classes
    y_pred_probs = model.predict(X_test)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = np.argmax(y_test, axis=1)
    
    acc = accuracy_score(y_true, y_pred)
    sens_mean, spec_mean = calculate_multiclass_metrics(y_true, y_pred, num_classes)
    
    print(f"Neural Network Accuracy: {acc:.4f}")
    print(f"Neural Network Sensitivity (Mean): {sens_mean:.4f}")
    print(f"Neural Network Specificity (Mean): {spec_mean:.4f}")
    
    print("\n--- Saving NN Artifacts ---")
    artifacts_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'artifacts')
    os.makedirs(artifacts_dir, exist_ok=True)
    
    model.save(os.path.join(artifacts_dir, 'disposal_nn_model.keras'))
    
    with open(os.path.join(artifacts_dir, 'results_metrics.txt'), 'a') as f:
        f.write(f"\n## 4. Neural Network Comparison (Keras/TensorFlow)\n")
        f.write(f"- Architecture: Feedforward Multi-Layer Perceptron (Dense layers)\n")
        f.write(f"- Accuracy: {acc:.4f}\n")
        f.write(f"- Sensitivity (Mean): {sens_mean:.4f}\n")
        f.write(f"- Specificity (Mean): {spec_mean:.4f}\n")
        f.write(f"- Conclusion: Compares directly against the Random Forest/Decision Tree on tabular data.\n")
        
    print(f"Neural Network classification model saved to {artifacts_dir}/")

if __name__ == '__main__':
    train_neural_network()
