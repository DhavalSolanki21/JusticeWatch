import pytest
from django.urls import reverse
from rest_framework import status

@pytest.mark.django_db
def test_hearing_list_lawyer(auth_lawyer, hearing_ahm, lawyer_unverified, api_client, assignment_ahm):
    response = auth_lawyer.get(reverse("hearing-list"))
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["purpose"] == "First Hearing"

    api_client.force_authenticate(user=lawyer_unverified)
    response = api_client.get(reverse("hearing-list"))
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 0

@pytest.mark.django_db
def test_hearing_creation_judge_valid(auth_judge, case_ahm):
    data = {
        "case": case_ahm.id,
        "hearing_date": "2026-04-01",
        "purpose": "Arguments",
        "next_hearing_date": "2026-05-01",
    }
    response = auth_judge.post(reverse("hearing-list"), data)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["purpose"] == "Arguments"

@pytest.mark.django_db
def test_hearing_creation_judge_invalid_scope(auth_judge, case_sur):
    data = {
        "case": case_sur.id,
        "hearing_date": "2026-04-01",
        "purpose": "Arguments",
    }
    response = auth_judge.post(reverse("hearing-list"), data)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["detail"] == "You do not have permission to log a hearing for this case outside your district scope."

@pytest.mark.django_db
def test_hearing_creation_lawyer_assigned(auth_lawyer, case_ahm, assignment_ahm):
    data = {
        "case": case_ahm.id,
        "hearing_date": "2026-04-01",
        "purpose": "Evidence Submission",
    }
    response = auth_lawyer.post(reverse("hearing-list"), data)
    assert response.status_code == status.HTTP_201_CREATED

@pytest.mark.django_db
def test_hearing_creation_lawyer_unassigned(api_client, case_ahm, lawyer_unverified):
    api_client.force_authenticate(user=lawyer_unverified)
    lawyer_unverified.is_verified = True
    lawyer_unverified.save()
    data = {
        "case": case_ahm.id,
        "hearing_date": "2026-04-01",
        "purpose": "Hack",
    }
    response = api_client.post(reverse("hearing-list"), data)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_hearing_list_filtered_by_case(auth_judge, case_ahm, hearing_ahm):
    response = auth_judge.get(reverse("hearing-list") + f"?case={case_ahm.id}")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1

@pytest.mark.django_db
def test_hearing_creation_missing_case(auth_judge):
    data = {
        "hearing_date": "2026-04-01",
        "purpose": "Arguments",
    }
    response = auth_judge.post(reverse("hearing-list"), data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_hearing_creation_invalid_case_id(auth_judge):
    data = {
        "case": 9999,
        "hearing_date": "2026-04-01",
        "purpose": "Arguments",
    }
    response = auth_judge.post(reverse("hearing-list"), data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_unauthenticated_access(api_client):
    assert api_client.get(reverse("hearing-list")).status_code == 401

@pytest.mark.django_db
def test_unverified_user_sees_nothing(api_client, lawyer_unverified):
    api_client.force_authenticate(user=lawyer_unverified)
    response = api_client.get(reverse("hearing-list"))
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 0
