import pytest
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch

@pytest.mark.django_db
def test_system_overview_rbac(auth_lawyer, auth_judge, district_summary_ahm, case_ahm, case_sur):
    overview_url = reverse("analytics-overview")
    response = auth_lawyer.get(overview_url)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    
    response = auth_judge.get(overview_url)
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_overview_with_district_filter(auth_judge, district_summary_ahm, case_ahm):
    overview_url = reverse("analytics-overview") + "?district=Ahmedabad"
    response = auth_judge.get(overview_url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["pending_cases"] == 2 # From summary fixture

@pytest.mark.django_db
def test_overview_unauthenticated(api_client):
    assert api_client.get(reverse("analytics-overview")).status_code == 401

@pytest.mark.django_db
@patch("analytics.views.predict_for_case")
def test_predictions_overview(mock_predict, auth_lawyer, case_ahm, case_sur):
    mock_predict.return_value = {
        "duration_risk": "high",
        "duration_confidence": 85.0,
        "disposal_likelihood": "Likely (Acquitted)",
        "disposal_confidence": 90.0,
        "risk_factors": ["High case age"],
    }
    response = auth_lawyer.get(reverse("analytics-predictions"))
    assert response.status_code == status.HTTP_200_OK
    assert "duration_distribution" in response.data

@pytest.mark.django_db
@patch("analytics.views.predict_for_case")
def test_advanced_predict_case_id(mock_predict, auth_lawyer, case_ahm):
    mock_predict.return_value = {
        "duration_risk": "critical",
        "duration_confidence": 88.0,
        "disposal_likelihood": "Unlikely",
        "disposal_confidence": 75.0,
        "risk_factors": ["High complexity"],
    }
    response = auth_lawyer.post(
        reverse("analytics-predict-custom"), {"case_id": case_ahm.id}
    )
    assert response.status_code == status.HTTP_200_OK
    assert "predictions" in response.data
    assert "roadmap" in response.data

@pytest.mark.django_db
@patch("analytics.views.predict_for_case")
def test_advanced_predict_custom_data(mock_predict, auth_lawyer):
    mock_predict.return_value = {
        "duration_risk": "low",
        "duration_confidence": 95.0,
        "disposal_likelihood": "Likely",
        "disposal_confidence": 98.0,
        "risk_factors": ["Simple case parameters"],
    }
    custom_input = {
        "case_category": "Civil",
        "crime_type": "Rent Dispute",
        "chargesheet_status": "Not Filed",
        "days_since_filing": 45,
        "num_parties": 2,
        "num_hearings": 1,
    }
    response = auth_lawyer.post(reverse("analytics-predict-custom"), custom_input)
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_predict_custom_invalid_case_id(auth_lawyer):
    response = auth_lawyer.post(
        reverse("analytics-predict-custom"), {"case_id": 9999}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
@patch("analytics.views.predict_for_case")
def test_predict_custom_error_handling(mock_predict, auth_lawyer, case_ahm):
    mock_predict.return_value = {"error": "Some ML error"}
    response = auth_lawyer.post(
        reverse("analytics-predict-custom"), {"case_id": case_ahm.id}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
