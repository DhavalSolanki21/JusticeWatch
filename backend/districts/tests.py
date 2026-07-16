from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from districts.models import District, State, DistrictSummary
from cases.models import Case

class DistrictsTests(APITestCase):
    def setUp(self):
        self.state = State.objects.create(name="Gujarat", code="GJ")
        self.district = District.objects.create(
            state=self.state, name="Ahmedabad", code="AHM", population=1000000
        )
        self.summary = DistrictSummary.objects.create(
            district=self.district,
            pending_count=2,
            disposed_count=10,
            disposal_rate=66.7,
            avg_case_age_days=180.5,
            severity_tier="medium",
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
        self.lawyer = User.objects.create_user(
            username="lawyer1",
            email="lawyer1@justicewatch.com",
            password="Password@123",
            role="lawyer",
            full_name="Lawyer Ahmedabad",
            is_verified=True,
        )

        self.case1 = Case.objects.create(
            case_number="CIV/2026/XYZ123",
            district=self.district,
            court_name="District Court 1",
            case_category="Civil",
            crime_type="Property Dispute",
            applicable_sections="Sec 37",
            fir_number="FIR-001",
            filed_date="2026-01-01",
            chargesheet_status="Not Filed",
            case_status="Pending",
            num_parties=2,
        )
        self.case2 = Case.objects.create(
            case_number="CRM/2026/ABC456",
            district=self.district,
            court_name="District Court 2",
            case_category="Criminal",
            crime_type="Theft",
            applicable_sections="Sec 379 IPC",
            fir_number="FIR-002",
            filed_date="2026-02-01",
            chargesheet_status="Filed",
            case_status="Pending",
            num_parties=2,
        )

    def test_state_list(self):
        """Authenticated users can list states."""
        self.client.force_authenticate(user=self.lawyer)
        response = self.client.get(reverse("state-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Gujarat")

    def test_district_list(self):
        """Authenticated users can list districts."""
        self.client.force_authenticate(user=self.lawyer)
        response = self.client.get(reverse("district-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Ahmedabad")

    def test_district_summary(self):
        """Authenticated users can view district summaries."""
        self.client.force_authenticate(user=self.lawyer)
        response = self.client.get(reverse("district-summary"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["district_name"], "Ahmedabad")
        self.assertEqual(response.data[0]["pending_count"], 2)

    def test_district_breakdown_rbac(self):
        """Only judges can access district breakdown."""
        breakdown_url = reverse("district-breakdown", args=[self.district.id])

        self.client.force_authenticate(user=self.lawyer)
        response = self.client.get(breakdown_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.judge)
        response = self.client.get(breakdown_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["district"], "Ahmedabad")
        self.assertEqual(response.data["category_split"]["Civil"], 1)
        self.assertEqual(response.data["category_split"]["Criminal"], 1)
        self.assertEqual(response.data["chargesheet_distribution"]["Not Filed"], 1)
        self.assertEqual(response.data["chargesheet_distribution"]["Filed"], 1)
        self.assertEqual(response.data["top_crime_types"]["Theft"], 1)
