import pytest
from django.urls import reverse
from rest_framework import status
from cases.models import Case, CaseAssignment
from unittest.mock import patch

@pytest.mark.django_db
def test_case_list_judge(api_client, auth_judge, case_ahm):
    response = auth_judge.get(reverse("case-list"))
    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["case_number"] == "CIV/2026/AHM111"

@pytest.mark.django_db
def test_case_list_lawyer(api_client, auth_lawyer, case_ahm, assignment_ahm):
    response = auth_lawyer.get(reverse("case-list"))
    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["case_number"] == "CIV/2026/AHM111"

@pytest.mark.django_db
def test_case_creation_valid_and_invalid(auth_judge, district_ahm):
    valid_data = {
        "district": district_ahm.id,
        "court_name": "New Court AHM",
        "case_category": "Civil",
        "crime_type": "Contract Dispute",
        "applicable_sections": "Sec 10 Indian Contract Act",
        "fir_number": "FIR-001",
        "fir_date": "2026-07-10",
        "arrest_date": "2026-07-10",
        "chargesheet_status": "Not Filed",
        "case_status": "Pending",
        "num_parties": 3,
        "case_notes": "Urgent contract case.",
    }
    response = auth_judge.post(reverse("case-list"), valid_data)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["court_name"] == "New Court AHM"

    invalid_data = valid_data.copy()
    invalid_data["case_category"] = "Supernatural"
    response = auth_judge.post(reverse("case-list"), invalid_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    invalid_data = valid_data.copy()
    del invalid_data["district"]
    response = auth_judge.post(reverse("case-list"), invalid_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_lawyer_case_update(auth_lawyer, case_ahm, assignment_ahm):
    detail_url = reverse("case-detail", args=[case_ahm.id])
    update_data = {
        "chargesheet_status": "Under Review",
        "case_notes": "Updated lawyer notes.",
    }
    response = auth_lawyer.patch(detail_url, update_data)
    assert response.status_code == status.HTTP_200_OK
    case_ahm.refresh_from_db()
    assert case_ahm.chargesheet_status == "Under Review"

@pytest.mark.django_db
def test_lawyer_update_unassigned_case(auth_lawyer, case_sur):
    detail_url = reverse("case-detail", args=[case_sur.id])
    update_data = {"chargesheet_status": "Under Review"}
    response = auth_lawyer.patch(detail_url, update_data)
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_lawyer_update_unauthorized_fields(auth_lawyer, case_ahm, assignment_ahm):
    detail_url = reverse("case-detail", args=[case_ahm.id])
    update_data = {"court_name": "Hack Court Name"}
    response = auth_lawyer.patch(detail_url, update_data)
    assert response.status_code == status.HTTP_200_OK
    case_ahm.refresh_from_db()
    assert case_ahm.court_name == "Ahmedabad Civil Court"

@pytest.mark.django_db
@patch("cases.ml_service.predict_for_case")
def test_case_predict_endpoint(mock_predict, auth_judge, case_ahm):
    mock_predict.return_value = {
        "duration_risk": "critical",
        "duration_confidence": 85.0,
        "disposal_likelihood": "Likely (Acquitted)",
        "disposal_confidence": 92.5,
        "risk_factors": ["High case age"],
    }
    predict_url = reverse("case-predict", args=[case_ahm.id])
    response = auth_judge.get(predict_url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["duration_risk"] == "critical"
    case_ahm.refresh_from_db()
    assert case_ahm.difficulty_tier == "critical"

@pytest.mark.django_db
def test_assign_lawyer_by_judge(auth_judge, case_ahm, lawyer_verified):
    assign_url = reverse("case-assign-lawyer", args=[case_ahm.id])
    response = auth_judge.post(assign_url, {"lawyer_id": lawyer_verified.id, "representing": "Defense"})
    assert response.status_code == status.HTTP_200_OK
    assert CaseAssignment.objects.filter(case=case_ahm, lawyer=lawyer_verified).exists()

@pytest.mark.django_db
def test_assign_lawyer_by_self(auth_lawyer, case_ahm, lawyer_verified):
    assign_url = reverse("case-assign-lawyer", args=[case_ahm.id])
    # assigning self should fail if lawyer cannot see the unassigned case (404)
    response = auth_lawyer.post(assign_url, {"lawyer_id": lawyer_verified.id})
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_assign_lawyer_invalid(auth_judge, case_ahm):
    assign_url = reverse("case-assign-lawyer", args=[case_ahm.id])
    response = auth_judge.post(assign_url, {})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    response = auth_judge.post(assign_url, {"lawyer_id": 9999})
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_unassign_lawyer_by_judge(auth_judge, case_ahm, assignment_ahm):
    unassign_url = reverse("case-unassign-lawyer", args=[case_ahm.id])
    response = auth_judge.post(unassign_url, {"assignment_id": assignment_ahm.id})
    assert response.status_code == status.HTTP_200_OK
    assert not CaseAssignment.objects.filter(id=assignment_ahm.id).exists()

@pytest.mark.django_db
def test_unassign_lawyer_forbidden(auth_lawyer, case_sur, lawyer_verified, db):
    unassign_url = reverse("case-unassign-lawyer", args=[case_sur.id])
    response = auth_lawyer.post(unassign_url, {"assignment_id": 999})
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_case_filters(auth_judge, case_ahm, case_sur):
    res = auth_judge.get(reverse("case-list") + "?case_category=Civil")
    assert res.data["count"] == 1
    res = auth_judge.get(reverse("case-list") + "?case_status=Pending")
    assert res.data["count"] == 1
    res = auth_judge.get(reverse("case-list") + "?search=CIV/2026/AHM111")
    assert res.data["count"] == 1

@pytest.mark.django_db
def test_case_ordering(auth_judge, case_ahm, case_sur, judge_ahm):
    case_sur.district = case_ahm.district
    case_sur.save()
    res = auth_judge.get(reverse("case-list") + "?ordering=difficulty_score")
    assert res.status_code == 200

@pytest.mark.django_db
def test_all_cases_list_verified_only(api_client, case_ahm, lawyer_unverified):
    api_client.force_authenticate(user=lawyer_unverified)
    response = api_client.get(reverse("all_cases"))
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_my_history_judge_and_lawyer(auth_judge, auth_lawyer, case_ahm, assignment_ahm, judge_ahm):
    case_ahm.judge = judge_ahm
    case_ahm.save()
    res_judge = auth_judge.get(reverse("my_history"))
    assert res_judge.status_code == 200
    assert len(res_judge.data["results"] if "results" in res_judge.data else res_judge.data) > 0

    res_lawyer = auth_lawyer.get(reverse("my_history"))
    assert res_lawyer.status_code == 200

@pytest.mark.django_db
def test_unauthenticated_case_access(api_client):
    assert api_client.get(reverse("case-list")).status_code == 401
    assert api_client.get(reverse("all_cases")).status_code == 401
    assert api_client.get(reverse("my_history")).status_code == 401
