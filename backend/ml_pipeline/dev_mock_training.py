import os
import sys
import pandas as pd
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml_pipeline.train_model import train_models

def generate_mock_dataset(size=5000):
    print(f"Generating realistic mock dataset of size {size}...")
    np.random.seed(42)

    crime_types = [
        "Theft",
        "Assault",
        "Property Dispute",
        "Financial Fraud",
        "Murder",
        "Cheating",
        "Kidnapping",
        "Trespass",
        "Unknown",
    ]
    categories = ["Civil", "Criminal", "Appeal"]
    chargesheet_statuses = ["Not Filed", "Filed", "Under Review", "Trial"]
    disposal_types = ["acquitted", "convicted", "dismissed", "compromise", "allowed"]

    data = {
        "crime_type": np.random.choice(crime_types, size=size),
        "case_category": np.random.choice(categories, size=size),
        "chargesheet_status": np.random.choice(chargesheet_statuses, size=size),
        "num_parties": np.random.randint(2, 8, size=size),
        "num_hearings": np.random.randint(1, 20, size=size),
        "filing_to_first_list_days": np.random.randint(5, 60, size=size),
        "listing_gap_days": np.random.randint(10, 600, size=size),
        "court_caseload": np.random.randint(10, 500, size=size),
        "case_age_days": np.random.randint(30, 1800, size=size),
        "female_defendant": np.random.choice([0, 1], size=size, p=[0.8, 0.2]),
        "female_petitioner": np.random.choice([0, 1], size=size, p=[0.75, 0.25]),
        "disposal_type": np.random.choice(disposal_types, size=size),
        "date_of_filing": pd.date_range(
            start="2010-01-01", end="2018-12-31", periods=size
        ),
    }

    df = pd.DataFrame(data)

    df["duration_days"] = df["case_age_days"]

    return df

if __name__ == "__main__":
    mock_df = generate_mock_dataset(5000)
    print("Mock dataset generated successfully.")

    train_models(df=mock_df)
    print("ML Pipeline run and evaluation completed successfully.")

    results_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "artifacts", "RESULTS.md"
    )
    if os.path.exists(results_path):
        print("\n--- RESULTS.md Output Summary ---")
        with open(results_path, "r") as f:
            print(f.read())
    else:
        print("Error: RESULTS.md was not generated.")
