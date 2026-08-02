import pytest
from cases.ml_service import predict_for_case

@pytest.mark.slow
@pytest.mark.django_db
def test_predict_for_case_object(case_ahm):
    case_ahm.refresh_from_db()
    pred = predict_for_case(case_ahm)
    if "error" in pred and "ML Models not found" in pred["error"]:
        pytest.skip("Models not trained yet")
    assert "duration_risk" in pred
    assert "disposal_likelihood" in pred

@pytest.mark.slow
def test_predict_for_custom_data():
    custom_data = {
        "crime_type": "Theft",
        "case_category": "Criminal",
        "chargesheet_status": "Filed",
        "days_since_filing": 100,
        "num_parties": 2,
        "num_hearings": 3
    }
    pred = predict_for_case(custom_data=custom_data)
    if "error" in pred and "ML Models not found" in pred["error"]:
        pytest.skip("Models not trained yet")
    assert "duration_risk" in pred
    assert "disposal_likelihood" in pred

@pytest.mark.slow
def test_predict_edge_values():
    custom_data = {
        "crime_type": "",
        "case_category": "Unknown",
        "chargesheet_status": "Invalid",
        "days_since_filing": 0,
        "num_parties": 0,
        "num_hearings": 0
    }
    pred = predict_for_case(custom_data=custom_data)
    if "error" in pred and "ML Models not found" in pred["error"]:
        pytest.skip("Models not trained yet")
    assert "duration_risk" in pred
    assert "disposal_likelihood" in pred
