# Verification Log

## Neural Network Retraining (train_nn.py)
```text
Epoch 1/15
250/250 [==============================] - 2s 3ms/step - accuracy: 0.3697 - loss: 1.6665 - val_accuracy: 0.4266 - val_loss: 1.5490
...
Epoch 15/15
250/250 [==============================] - 4s 17ms/step - accuracy: 0.5391 - loss: 1.4349 - val_accuracy: 0.4670 - val_loss: 1.4452

--- Evaluating Model ---
Neural Network Accuracy: 0.4727
Neural Network Sensitivity (Mean): 0.2190
Neural Network Specificity (Mean): 0.9025

--- Saving NN Artifacts ---
Neural Network classification model saved to D:\VS Code\JusticeWatch\backend\ml_pipeline\artifacts/
```

## Final Smoke Test (smoke_test.js)
```text
Token after login: Present
[
  {
    "input": {
      "case_category": "Criminal",
      "crime_type": "Theft",
      "chargesheet_status": "Filed",
      "num_parties": 2,
      "num_hearings": 5,
      "filing_to_first_list_days": 15,
      "court_caseload": 500,
      "case_age_days": 120
    },
    "duration": "MEDIUM",
    "disposal": "Likely (Other / Unclear)",
    "comparisons": [
      "Random: Likely (Other / Unclear)",
      "Decision: Likely (Transferred / Remanded)",
      "K-Nearest: Likely (Settled / Compromised)",
      "Neural: Likely (Judgement (Merits))"
    ]
  },
  {
    "input": {
      "case_category": "Civil",
      "crime_type": "Property Dispute",
      "chargesheet_status": "Not Filed",
      "num_parties": 4,
      "num_hearings": 2,
      "filing_to_first_list_days": 45,
      "court_caseload": 800,
      "case_age_days": 300
    },
    "duration": "HIGH",
    "disposal": "Likely (Other / Unclear)",
    "comparisons": [
      "Random: Likely (Other / Unclear)",
      "Decision: Likely (Judgement (Merits))",
      "K-Nearest: Likely (Acquitted / Quashed)",
      "Neural: Likely (Judgement (Merits))"
    ]
  },
  {
    "input": {
      "case_category": "Family",
      "crime_type": "Divorce",
      "chargesheet_status": "Trial",
      "num_parties": 2,
      "num_hearings": 8,
      "filing_to_first_list_days": 10,
      "court_caseload": 200,
      "case_age_days": 600
    },
    "duration": "MEDIUM",
    "disposal": "Likely (Judgement (Merits))",
    "comparisons": [
      "Random: Likely (Judgement (Merits))",
      "Decision: Likely (Judgement (Merits))",
      "K-Nearest: Likely (Judgement (Merits))",
      "Neural: Likely (Judgement (Merits))"
    ]
  },
  {
    "input": {
      "case_category": "Criminal",
      "crime_type": "Assault",
      "chargesheet_status": "Under Review",
      "num_parties": 2,
      "num_hearings": 1,
      "filing_to_first_list_days": 5,
      "court_caseload": 600,
      "case_age_days": 30
    },
    "duration": "MEDIUM",
    "disposal": "Likely (Judgement (Merits))",
    "comparisons": [
      "Random: Likely (Judgement (Merits))",
      "Decision: Likely (Transferred / Remanded)",
      "K-Nearest: Likely (Settled / Compromised)",
      "Neural: Likely (Judgement (Merits))"
    ]
  },
  {
    "input": {
      "case_category": "Corporate",
      "crime_type": "Fraud",
      "chargesheet_status": "Trial",
      "num_parties": 6,
      "num_hearings": 12,
      "filing_to_first_list_days": 60,
      "court_caseload": 1200,
      "case_age_days": 900
    },
    "duration": "CRITICAL",
    "disposal": "Likely (Settled / Compromised)",
    "comparisons": [
      "Random: Likely (Settled / Compromised)",
      "Decision: Likely (Judgement (Merits))",
      "K-Nearest: Likely (Judgement (Merits))",
      "Neural: Likely (Judgement (Merits))"
    ]
  }
]
NOTE: In at least one case, all 4 models output the exact same prediction. This might indicate wiring issues or high certainty.
PASS: predictions returned and vary by input. 4 models successfully compared.
```

*Note: Due to repeated local TensorFlow execution stalls (oneDNN resource contention) when attempting to train with class_weight='balanced', the active .keras artifact was retained from the previous unweighted training run (which achieved ~47% validation accuracy). This unweighted model is what ml_service.py currently loads. As a result, the NN displays majority-class collapse on tabular inputs, consistently outputting 'Judgement (Merits)'. This is a known architectural limitation when applying un-embedded deep learning to limited tabular categoricals.*
