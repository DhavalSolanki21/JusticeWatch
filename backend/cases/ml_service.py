import os
import pickle
import pandas as pd
from datetime import date
from django.conf import settings
from sklearn.preprocessing import StandardScaler, LabelEncoder
from .models import Case

# Paths to the saved ML files
DURATION_MODEL_PATH = os.path.join(
    settings.BASE_DIR, "ml_pipeline", "artifacts", "duration_regressor.pkl"
)
DISPOSAL_MODEL_PATH = os.path.join(
    settings.BASE_DIR, "ml_pipeline", "artifacts", "disposal_classifier_rf.pkl"
)
DT_MODEL_PATH = os.path.join(
    settings.BASE_DIR, "ml_pipeline", "artifacts", "disposal_classifier_dt.pkl"
)
KNN_MODEL_PATH = os.path.join(
    settings.BASE_DIR, "ml_pipeline", "artifacts", "disposal_classifier_knn.pkl"
)
NN_MODEL_PATH = os.path.join(
    settings.BASE_DIR, "ml_pipeline", "artifacts", "disposal_nn_model.keras"
)
NN_SCALER_PATH = os.path.join(
    settings.BASE_DIR, "ml_pipeline", "artifacts", "nn_scaler.pkl"
)
ENCODERS_PATH = os.path.join(
    settings.BASE_DIR, "ml_pipeline", "artifacts", "encoders.pkl"
)


def safe_encode(le, val):
    try:
        # if val is string and in classes
        if str(val) in le.classes_:
            return le.transform([str(val)])[0]
        else:
            return 0  # default / unknown
    except:
        return 0


_rf_duration = None
_rf_disposal = None
_dt_disposal = None
_knn_disposal = None
_nn_disposal = None
_nn_scaler = None
_encoders = None


# Force Django to auto-reload and clear memory cache for new models
def load_models():
    global _rf_duration, _rf_disposal, _dt_disposal, _knn_disposal, _nn_disposal, _nn_scaler, _encoders
    if _rf_duration is None or _encoders is None:
        with open(DURATION_MODEL_PATH, "rb") as f:
            _rf_duration = pickle.load(f)
        with open(DISPOSAL_MODEL_PATH, "rb") as f:
            _rf_disposal = pickle.load(f)
        try:
            with open(DT_MODEL_PATH, "rb") as f:
                _dt_disposal = pickle.load(f)
            with open(KNN_MODEL_PATH, "rb") as f:
                _knn_disposal = pickle.load(f)
        except Exception as e:
            print(f"DT/KNN load error (ignoring if just missing): {e}")

        try:
            with open(NN_SCALER_PATH, "rb") as f:
                _nn_scaler = pickle.load(f)
            import tensorflow as tf

            _nn_disposal = tf.keras.models.load_model(NN_MODEL_PATH)
        except Exception as e:
            print(f"NN load error (ignoring if just missing): {e}")

        with open(ENCODERS_PATH, "rb") as f:
            _encoders = pickle.load(f)
    return (
        _rf_duration,
        _rf_disposal,
        _dt_disposal,
        _knn_disposal,
        _nn_disposal,
        _nn_scaler,
        _encoders,
    )


def predict_for_case(case=None, custom_data=None):
    """
    Loads the trained real models and encoders, extracts features from the given Case,
    and returns duration risk and disposal likelihood predictions.
    If custom_data is provided, it uses those values directly instead of a Case object.
    """
    if (
        not os.path.exists(DURATION_MODEL_PATH)
        or not os.path.exists(DISPOSAL_MODEL_PATH)
        or not os.path.exists(ENCODERS_PATH)
    ):
        return {"error": "ML Models not found. Please run training pipeline."}

    try:
        (
            rf_duration,
            rf_disposal,
            dt_disposal,
            knn_disposal,
            nn_disposal,
            nn_scaler,
            encoders,
        ) = load_models()

        le_crime = encoders.get("crime_type")
        le_category = encoders.get("case_category")
        le_status = encoders.get("chargesheet_status")
        le_disp = encoders.get("disposal_type")

        if custom_data:
            crime_type_val = custom_data.get("crime_type", "Unknown")
            category_val = custom_data.get("case_category", "Civil")
            status_val = custom_data.get("chargesheet_status", "Not Filed")
            days_since_filing = int(custom_data.get("days_since_filing", 0))
            num_parties = int(custom_data.get("num_parties", 2))
            num_hearings = int(custom_data.get("num_hearings", 0))

            filing_to_first_list_days = int(
                custom_data.get("filing_to_first_list_days", 30)
            )
            listing_gap_days = int(custom_data.get("listing_gap_days", 180))
            court_caseload = int(custom_data.get("court_caseload", 100))
            case_age_days = int(
                custom_data.get("case_age_days", days_since_filing or 365)
            )
            female_defendant = int(custom_data.get("female_defendant", 0))
            female_petitioner = int(custom_data.get("female_petitioner", 0))
        else:
            crime_type_val = case.crime_type or "Unknown"
            category_val = case.case_category
            status_val = case.chargesheet_status

            days_since_filing = 0
            if case.filed_date:
                days_since_filing = (date.today() - case.filed_date).days

            num_parties = case.num_parties
            num_hearings = case.hearings.count()

            # Fetch hearing date info
            hearings = case.hearings.order_by("hearing_date")
            first_h = hearings.first()
            last_h = hearings.last()

            if first_h and case.filed_date:
                filing_to_first_list_days = (
                    first_h.hearing_date - case.filed_date
                ).days
            else:
                filing_to_first_list_days = 30

            if first_h and last_h:
                listing_gap_days = (last_h.hearing_date - first_h.hearing_date).days
            else:
                listing_gap_days = 180

            court_caseload = (
                Case.objects.filter(court_name=case.court_name).count()
                if case.court_name
                else 100
            )
            case_age_days = days_since_filing
            female_defendant = 0
            female_petitioner = 0

        crime_encoded = safe_encode(le_crime, crime_type_val)
        category_encoded = safe_encode(le_category, category_val)
        status_encoded = safe_encode(le_status, status_val)

        # Build features for regressor (excludes case_age_days)
        df_reg = pd.DataFrame(
            [
                {
                    "crime_type": crime_encoded,
                    "case_category": category_encoded,
                    "chargesheet_status": status_encoded,
                    "num_parties": num_parties,
                    "num_hearings": num_hearings,
                    "filing_to_first_list_days": filing_to_first_list_days,
                    "court_caseload": court_caseload,
                    "female_defendant": female_defendant,
                    "female_petitioner": female_petitioner,
                }
            ]
        )

        # Build features for classifier (includes case_age_days)
        df_clf = pd.DataFrame(
            [
                {
                    "crime_type": crime_encoded,
                    "case_category": category_encoded,
                    "chargesheet_status": status_encoded,
                    "num_parties": num_parties,
                    "num_hearings": num_hearings,
                    "filing_to_first_list_days": filing_to_first_list_days,
                    "court_caseload": court_caseload,
                    "case_age_days": case_age_days,
                    "female_defendant": female_defendant,
                    "female_petitioner": female_petitioner,
                }
            ]
        )

        # Duration Risk Prediction (Regressor)
        predicted_days = rf_duration.predict(df_reg)[0]
        if predicted_days < 180:
            dur_class_name = "low"
        elif predicted_days < 365:
            dur_class_name = "medium"
        elif predicted_days < 730:
            dur_class_name = "high"
        else:
            dur_class_name = "critical"
        dur_confidence = 85.0  # Regression heuristic

        # Disposal Likelihood Prediction (Multi-Class)
        disp_probs = rf_disposal.predict_proba(df_clf)[0]
        disp_class_idx = rf_disposal.predict(df_clf)[0]
        disp_confidence = round(max(disp_probs) * 100, 1)

        if le_disp:
            disp_type_str = le_disp.inverse_transform([disp_class_idx])[0]
        else:
            disp_type_str = "resolved"

        disp_text = f"Likely ({disp_type_str.title()})"

        # --- Model Comparison Dictionary ---
        model_comparison = []

        # Helper to extract name + confidence
        def format_pred(model, name, use_scaler=False, is_nn=False):
            if not model:
                return None
            try:
                if is_nn:
                    X_input = nn_scaler.transform(df_clf) if nn_scaler else df_clf
                    import numpy as np

                    probs = model.predict(X_input, verbose=0)[0]
                    c_idx = np.argmax(probs)
                    c_conf = max(probs)
                else:
                    probs = model.predict_proba(df_clf)[0]
                    c_idx = model.predict(df_clf)[0]
                    c_conf = max(probs)

                c_str = le_disp.inverse_transform([c_idx])[0] if le_disp else "resolved"
                return {
                    "model": name,
                    "prediction": f"Likely ({c_str.title()})",
                    "confidence": round(float(c_conf) * 100, 1),
                }
            except Exception as e:
                print(f"Comparison error on {name}: {e}")
                return None

        cmp_rf = format_pred(rf_disposal, "Random Forest")
        if cmp_rf:
            model_comparison.append(cmp_rf)
        cmp_dt = format_pred(dt_disposal, "Decision Tree")
        if cmp_dt:
            model_comparison.append(cmp_dt)
        cmp_knn = format_pred(knn_disposal, "K-Nearest Neighbors")
        if cmp_knn:
            model_comparison.append(cmp_knn)
        cmp_nn = format_pred(nn_disposal, "Neural Network (Keras)", is_nn=True)
        if cmp_nn:
            model_comparison.append(cmp_nn)

        # Feature Importance Factors (just heuristic rules based on input for UI explanation)
        risk_factors = []
        if days_since_filing > 365:
            risk_factors.append(f"Case age is high ({days_since_filing} days).")
        if num_hearings > 5:
            risk_factors.append(f"High number of hearings ({num_hearings}).")
        if category_val == "Criminal":
            risk_factors.append(f"Criminal cases historically take longer.")

        if not risk_factors:
            risk_factors.append("No specific high-risk features detected.")

        return {
            "duration_risk": dur_class_name,
            "duration_confidence": dur_confidence,
            "disposal_likelihood": disp_text,
            "disposal_confidence": disp_confidence,
            "risk_factors": risk_factors,
            "model_comparison": model_comparison,
        }

    except Exception as e:
        print(f"ML Prediction Error: {e}")
        import traceback

        traceback.print_exc()
        return {"error": f"Prediction error: {str(e)}"}
