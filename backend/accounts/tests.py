from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from districts.models import District, State

class AccountsTests(APITestCase):
    def setUp(self):
        self.state = State.objects.create(name="Gujarat", code="GJ")
        self.district = District.objects.create(
            state=self.state, name="Ahmedabad", code="AHM", population=1000000
        )

        self.judge = User.objects.create_user(
            username="judge1",
            email="judge1@justicewatch.com",
            password="Password@123",
            role="judge",
            full_name="Judge Ahmedabad",
            is_verified=True,
            district_scope=self.district,
        )

        self.lawyer_unverified = User.objects.create_user(
            username="lawyer1",
            email="lawyer1@justicewatch.com",
            password="Password@123",
            role="lawyer",
            full_name="Lawyer Ahmedabad",
            is_verified=False,
            bar_council_id="GJ-12345",
        )

    def test_superuser_creation(self):
        """Verify we can generate superuser models and test admin access."""
        superuser = User.objects.create_superuser(
            username="admin_user",
            email="admin@justicewatch.com",
            password="SuperPassword@123",
        )
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_staff)
        response = self.client.post(
            reverse("login"),
            {"username": "admin_user", "password": "SuperPassword@123"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertTrue(response.data["user"]["is_verified"] or superuser.is_superuser)

    def test_registration_valid_and_invalid(self):
        """Systematically test all application forms with valid and invalid data inputs."""
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
        response = self.client.post(register_url, valid_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "new_lawyer")

        new_user = User.objects.get(username="new_lawyer")
        self.assertFalse(new_user.is_verified)

        response = self.client.post(register_url, valid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

        invalid_data = valid_data.copy()
        invalid_data["username"] = "another_lawyer"
        invalid_data["email"] = "not-an-email"
        response = self.client.post(register_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

        invalid_data = valid_data.copy()
        invalid_data["username"] = "weak_pwd_user"
        invalid_data["email"] = "weak@example.com"
        invalid_data["password"] = "123"  # too short and simple
        response = self.client.post(register_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_login_unverified_lawyer(self):
        """Unverified lawyer should not be allowed to log in."""
        response = self.client.post(
            reverse("login"), {"username": "lawyer1", "password": "Password@123"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)
        self.assertEqual(
            response.data["detail"][0],
            "Account is not verified. Please wait for admin approval.",
        )

    def test_login_verified_judge(self):
        """Verified judge should log in successfully and receive JWT."""
        response = self.client.post(
            reverse("login"), {"username": "judge1", "password": "Password@123"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["user"]["role"], "judge")

    def test_approve_lawyer_rbac(self):
        """Only judges can approve lawyers."""
        approve_url = reverse("approve_lawyer", args=[self.lawyer_unverified.id])

        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.lawyer_unverified.is_verified = True
        self.lawyer_unverified.save()
        self.client.force_authenticate(user=self.lawyer_unverified)
        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(user=None)

        self.lawyer_unverified.is_verified = False
        self.lawyer_unverified.save()

        self.client.force_authenticate(user=self.judge)
        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(User.objects.get(id=self.lawyer_unverified.id).is_verified)

    def test_profile_update(self):
        """Test profile updates with valid/invalid data."""
        self.client.force_authenticate(user=self.judge)
        profile_url = reverse("user_profile")

        response = self.client.get(profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "judge1")

        update_data = {
            "display_name": "Justice AHM",
            "email": "justice_ahm@justicewatch.com",
        }
        response = self.client.put(profile_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["display_name"], "Justice AHM")
        self.assertEqual(
            User.objects.get(id=self.judge.id).email, "justice_ahm@justicewatch.com"
        )

        response = self.client.put(profile_url, {"email": "invalid-email"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
