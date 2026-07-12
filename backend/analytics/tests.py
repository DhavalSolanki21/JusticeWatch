from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from districts.models import District, State
from cases.models import Case
from unittest.mock import patch


class AnalyticsTests(APITestCase):
    def setUp(self):
        # Setup state, district
        self.state = State.objects.create(name="Gujarat", code="GJ")
        self.district = District.objects.create(
            state=self.state, name="Ahmedabad", code="AHM"
        )

        # Setup users
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

        # Setup cases
        self.case1 = Case.objects.create(
            case_number="CIV/2026/AHM111",
            district=self.district,
            court_name="Ahmedabad Civil Court",
            case_category="Civil",
            crime_type="Property Dispute",
            applicable_sections="Sec 37",
            filed_date="2026-01-01",
            chargesheet_status="Not Filed",
            case_status="Pending",
            difficulty_tier="medium",
        )
        self.case2 = Case.objects.create(
            case_number="CRM/2026/AHM222",
            district=self.district,
            court_name="Ahmedabad Sessions Court",
            case_category="Criminal",
            crime_type="Theft",
            applicable_sections="Sec 379 IPC",
            filed_date="2024-01-01",  # Over 2 years ago for age brackets
            chargesheet_status="Filed",
            case_status="Pending",
            difficulty_tier="high",
        )

    def test_system_overview_rbac(self):
        """Only judges can access system overview analytics."""
        overview_url = reverse("analytics-overview")

        # 1. Lawyer is forbidden
        self.client.force_authenticate(user=self.lawyer)
        response = self.client.get(overview_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Judge succeeds
        self.client.force_authenticate(user=self.judge)
        response = self.client.get(overview_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_cases"], 2)
        self.assertEqual(response.data["pending_cases"], 2)
        self.assertIn("status_breakdown", response.data)
        self.assertIn("difficulty_breakdown", response.data)
        self.assertIn("backlog_age_brackets", response.data)
        # Verify age bracket logic works (case2 filed in 2024 is in 1-3 Years bracket)
        self.assertEqual(response.data["backlog_age_brackets"]["1-3 Years"], 1)
        self.assertEqual(response.data["backlog_age_brackets"]["0-1 Year"], 1)

    @patch("analytics.views.predict_for_case")
    def test_predictions_overview(self, mock_predict):
        """Verified users can access predictions overview statistics."""
        mock_predict.return_value = {
            "duration_risk": "high",
            "duration_confidence": 85.0,
            "disposal_likelihood": "Likely (Acquitted)",
            "disposal_confidence": 90.0,
            "risk_factors": ["High case age"],
        }
        self.client.force_authenticate(user=self.lawyer)
        response = self.client.get(reverse("analytics-predictions"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("duration_distribution", response.data)
        self.assertIn("disposal_distribution", response.data)
        self.assertIn("at_risk_cases", response.data)
        self.assertEqual(
            response.data["duration_distribution"]["Long-Pending (>2yr)"], 2
        )  # Both returned 'high'

    @patch("analytics.views.predict_for_case")
    def test_advanced_predict_case_id(self, mock_predict):
        """Test roadmap and prediction generation using a Case ID."""
        mock_predict.return_value = {
            "duration_risk": "critical",
            "duration_confidence": 88.0,
            "disposal_likelihood": "Unlikely",
            "disposal_confidence": 75.0,
            "risk_factors": ["High complexity"],
        }
        self.client.force_authenticate(user=self.lawyer)
        response = self.client.post(
            reverse("analytics-predict-custom"), {"case_id": self.case1.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("predictions", response.data)
        self.assertIn("roadmap", response.data)
        self.assertEqual(response.data["predictions"]["duration_risk"], "critical")

        # Verify roadmap phases logic for critical risk & unlikely disposal
        roadmap = response.data["roadmap"]
        self.assertEqual(len(roadmap), 3)
        self.assertEqual(roadmap[0]["phase"], "Pre-Trial & Discovery")
        self.assertEqual(roadmap[0]["status"], "warning")
        self.assertEqual(roadmap[1]["phase"], "Trial & Cross-Examination")
        self.assertEqual(roadmap[1]["status"], "danger")
        self.assertEqual(roadmap[2]["phase"], "Judgment & Potential Appeal")
        self.assertEqual(roadmap[2]["status"], "danger")

    @patch("analytics.views.predict_for_case")
    def test_advanced_predict_custom_data(self, mock_predict):
        """Test roadmap and prediction generation using custom data inputs."""
        mock_predict.return_value = {
            "duration_risk": "low",
            "duration_confidence": 95.0,
            "disposal_likelihood": "Likely",
            "disposal_confidence": 98.0,
            "risk_factors": ["Simple case parameters"],
        }
        self.client.force_authenticate(user=self.lawyer)
        custom_input = {
            "case_category": "Civil",
            "crime_type": "Rent Dispute",
            "chargesheet_status": "Not Filed",
            "days_since_filing": 45,
            "num_parties": 2,
            "num_hearings": 1,
        }
        response = self.client.post(reverse("analytics-predict-custom"), custom_input)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["predictions"]["duration_risk"], "low")

        roadmap = response.data["roadmap"]
        self.assertEqual(len(roadmap), 3)
        self.assertEqual(roadmap[0]["phase"], "Pre-Trial & Discovery")
        self.assertEqual(roadmap[0]["status"], "success")
        self.assertEqual(roadmap[1]["phase"], "Trial & Cross-Examination")
        self.assertEqual(roadmap[1]["status"], "success")
        self.assertEqual(roadmap[2]["phase"], "Judgment")
        self.assertEqual(roadmap[2]["status"], "success")
