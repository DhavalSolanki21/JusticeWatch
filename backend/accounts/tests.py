import pytest
from django.urls import reverse
from rest_framework import status
from accounts.models import User

@pytest.mark.django_db
def test_superuser_creation(api_client):
    superuser = User.objects.create_superuser(
        username="admin_user",
        email="admin@justicewatch.com",
        password="SuperPassword@123",
    )
    assert superuser.is_superuser
    assert superuser.is_staff
    response = api_client.post(
        reverse("login"),
        {"username": "admin_user", "password": "SuperPassword@123"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data

@pytest.mark.django_db
def test_registration_valid_and_invalid(api_client):
    register_url = reverse("register")
    valid_data = {
        "username": "new_lawyer",
        "email": "new_lawyer@example.com",
        "password": "StrongPassword@123",
        "role": "lawyer",
        "full_name": "New Lawyer",
        "bar_council_id": "GJ-99999",
        "designation": "Advocate",
    }
    response = api_client.post(register_url, valid_data)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["username"] == "new_lawyer"

    new_user = User.objects.get(username="new_lawyer")
    assert not new_user.is_verified

    response = api_client.post(register_url, valid_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "username" in response.data

    invalid_data = valid_data.copy()
    invalid_data["email"] = "not-an-email"
    invalid_data["username"] = "diff"
    response = api_client.post(register_url, invalid_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_login_unverified_lawyer(api_client, lawyer_unverified):
    response = api_client.post(
        reverse("login"), {"username": "lawyer_unverified", "password": "Password@123"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"][0] == "Account is not verified. Please wait for admin approval."

@pytest.mark.django_db
def test_login_wrong_password(api_client, lawyer_verified):
    response = api_client.post(
        reverse("login"), {"username": "lawyer_verified", "password": "wrong"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.django_db
def test_login_verified_judge(api_client, judge_ahm):
    response = api_client.post(
        reverse("login"), {"username": "judge_ahm", "password": "Password@123"}
    )
    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data

@pytest.mark.django_db
def test_token_refresh_flow(api_client, judge_ahm):
    response = api_client.post(
        reverse("login"), {"username": "judge_ahm", "password": "Password@123"}
    )
    assert response.status_code == status.HTTP_200_OK
    refresh_token = response.data["refresh"]
    
    refresh_res = api_client.post(
        reverse("token_refresh"), {"refresh": refresh_token}
    )
    assert refresh_res.status_code == status.HTTP_200_OK
    assert "access" in refresh_res.data

@pytest.mark.django_db
def test_approve_lawyer_rbac(api_client, judge_ahm, lawyer_unverified, lawyer_verified):
    approve_url = reverse("approve_lawyer", args=[lawyer_unverified.id])

    # Unauthenticated
    response = api_client.post(approve_url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # Lawyer
    api_client.force_authenticate(user=lawyer_verified)
    response = api_client.post(approve_url)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    api_client.force_authenticate(user=None)

    # Judge
    api_client.force_authenticate(user=judge_ahm)
    response = api_client.post(approve_url)
    assert response.status_code == status.HTTP_200_OK
    lawyer_unverified.refresh_from_db()
    assert lawyer_unverified.is_verified

@pytest.mark.django_db
def test_profile_update(api_client, judge_ahm):
    api_client.force_authenticate(user=judge_ahm)
    profile_url = reverse("user_profile")
    
    response = api_client.put(profile_url, {"display_name": "Justice AHM", "email": "justice_ahm@justicewatch.com"})
    assert response.status_code == status.HTTP_200_OK
    judge_ahm.refresh_from_db()
    assert judge_ahm.email == "justice_ahm@justicewatch.com"

@pytest.mark.django_db
def test_unauthenticated_access_blocked(api_client):
    assert api_client.get(reverse("user_profile")).status_code == 401
    assert api_client.get(reverse("pending_lawyers")).status_code == 401
    assert api_client.get(reverse("judge_history")).status_code == 401
    assert api_client.get(reverse("verified_lawyers")).status_code == 401
    assert api_client.get(reverse("verified_judges")).status_code == 401

@pytest.mark.django_db
def test_verified_lawyers_list(api_client, judge_ahm, lawyer_verified, lawyer_unverified):
    api_client.force_authenticate(user=judge_ahm)
    response = api_client.get(reverse("verified_lawyers"))
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["username"] == lawyer_verified.username

@pytest.mark.django_db
def test_verified_judges_list(api_client, judge_ahm, lawyer_verified):
    api_client.force_authenticate(user=lawyer_verified)
    response = api_client.get(reverse("verified_judges"))
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["username"] == judge_ahm.username

@pytest.mark.django_db
def test_judge_case_history(api_client, judge_ahm, case_ahm):
    case_ahm.judge = judge_ahm
    case_ahm.save()
    api_client.force_authenticate(user=judge_ahm)
    response = api_client.get(reverse("judge_history"))
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["id"] == case_ahm.id
