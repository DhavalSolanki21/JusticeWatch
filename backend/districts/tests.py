import pytest
from django.urls import reverse
from rest_framework import status

@pytest.mark.django_db
def test_state_list(auth_lawyer, state_gj):
    response = auth_lawyer.get(reverse("state-list"))
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["name"] == "Gujarat"

@pytest.mark.django_db
def test_district_list(auth_lawyer, district_ahm):
    response = auth_lawyer.get(reverse("district-list"))
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["name"] == "Ahmedabad"

@pytest.mark.django_db
def test_district_summary(auth_lawyer, district_summary_ahm):
    response = auth_lawyer.get(reverse("district-summary"))
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["district_name"] == "Ahmedabad"
    assert response.data[0]["pending_count"] == 2

@pytest.mark.django_db
def test_district_breakdown_rbac(auth_lawyer, auth_judge, district_ahm):
    breakdown_url = reverse("district-breakdown", args=[district_ahm.id])
    response = auth_lawyer.get(breakdown_url)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    
    response = auth_judge.get(breakdown_url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["district"] == "Ahmedabad"

@pytest.mark.django_db
def test_unauthenticated_access_blocked(api_client, district_ahm):
    assert api_client.get(reverse("state-list")).status_code == 401
    assert api_client.get(reverse("district-list")).status_code == 401
    assert api_client.get(reverse("district-summary")).status_code == 401
    assert api_client.get(reverse("district-breakdown", args=[district_ahm.id])).status_code == 401

@pytest.mark.django_db
def test_district_breakdown_not_found(auth_judge):
    breakdown_url = reverse("district-breakdown", args=[9999])
    response = auth_judge.get(breakdown_url)
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_district_summary_empty_state(auth_lawyer, db):
    response = auth_lawyer.get(reverse("district-summary"))
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 0
