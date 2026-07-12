from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from districts.models import District, State
from cases.models import Case, CaseAssignment
from unittest.mock import patch


class CasesTests(APITestCase):
    def setUp(self):
        # Setup state, district
        self.state = State.objects.create(name="Gujarat", code="GJ")
        self.district_ahm = District.objects.create(
            state=self.state, name="Ahmedabad", code="AHM", population=1000000
        )
        self.district_sur = District.objects.create(
            state=self.state, name="Surat", code="SUR", population=800000
        )

        # Setup users
        self.judge_ahm = User.objects.create_user(
            username="judge_ahm",
            email="judge_ahm@justicewatch.com",
            password="Password@123",
            role="judge",
            full_name="Judge Ahmedabad",
            is_verified=True,
            district_scope=self.district_ahm,
        )
        self.lawyer1 = User.objects.create_user(
            username="lawyer1",
            email="lawyer1@justicewatch.com",
            password="Password@123",
            role="lawyer",
            full_name="Lawyer 1",
            is_verified=True,
        )
        self.lawyer2 = User.objects.create_user(
            username="lawyer2",
            email="lawyer2@justicewatch.com",
            password="Password@123",
            role="lawyer",
            full_name="Lawyer 2",
            is_verified=True,
        )

        # Setup cases
        self.case_ahm = Case.objects.create(
            case_number="CIV/2026/AHM111",
            district=self.district_ahm,
            court_name="Ahmedabad Civil Court",
            case_category="Civil",
            crime_type="Property Dispute",
            applicable_sections="Sec 37",
            filed_date="2026-01-01",
            chargesheet_status="Not Filed",
            case_status="Pending",
            num_parties=2,
        )
        self.case_sur = Case.objects.create(
            case_number="CRM/2026/SUR222",
            district=self.district_sur,
            court_name="Surat Sessions Court",
            case_category="Criminal",
            crime_type="Theft",
            applicable_sections="Sec 379 IPC",
            filed_date="2026-02-01",
            chargesheet_status="Filed",
            case_status="Pending",
            num_parties=2,
        )

        # Assign lawyer1 to case_ahm
        CaseAssignment.objects.create(
            case=self.case_ahm, lawyer=self.lawyer1, representing="Petitioner"
        )

    def test_case_list_judge(self):
        """Judge gets cases in their district scope."""
        self.client.force_authenticate(user=self.judge_ahm)
        response = self.client.get(reverse("case-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see Ahmedabad case
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["case_number"], "CIV/2026/AHM111")

    def test_case_list_lawyer(self):
        """Lawyer gets only assigned cases."""
        self.client.force_authenticate(user=self.lawyer1)
        response = self.client.get(reverse("case-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["case_number"], "CIV/2026/AHM111")

    def test_case_creation_valid_and_invalid(self):
        """Test case creation form with valid/invalid parameters."""
        self.client.force_authenticate(user=self.judge_ahm)

        valid_data = {
            "district": self.district_ahm.id,
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
        response = self.client.post(reverse("case-list"), valid_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["court_name"], "New Court AHM")
        self.assertIsNotNone(response.data["id"])

        # 2. Invalid case creation - invalid category choice
        invalid_data = valid_data.copy()
        invalid_data["case_category"] = "Supernatural"
        response = self.client.post(reverse("case-list"), invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("case_category", response.data)

        # 3. Invalid case creation - missing required district
        invalid_data = valid_data.copy()
        del invalid_data["district"]
        response = self.client.post(reverse("case-list"), invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("district", response.data)

    def test_lawyer_case_update(self):
        """Lawyer can update chargesheet_status and case_notes for assigned case."""
        self.client.force_authenticate(user=self.lawyer1)
        detail_url = reverse("case-detail", args=[self.case_ahm.id])

        update_data = {
            "chargesheet_status": "Under Review",
            "case_notes": "Updated lawyer notes.",
        }
        response = self.client.patch(detail_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify changes in DB
        case = Case.objects.get(id=self.case_ahm.id)
        self.assertEqual(case.chargesheet_status, "Under Review")
        self.assertEqual(case.case_notes, "Updated lawyer notes.")

    def test_lawyer_update_unassigned_case(self):
        """Lawyer cannot update an unassigned case."""
        self.client.force_authenticate(user=self.lawyer1)
        detail_url = reverse(
            "case-detail", args=[self.case_sur.id]
        )  # lawyer1 not assigned

        update_data = {
            "chargesheet_status": "Under Review",
            "case_notes": "Should fail.",
        }
        response = self.client.patch(detail_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_lawyer_update_unauthorized_fields(self):
        """Lawyer cannot update unauthorized fields like court_name."""
        self.client.force_authenticate(user=self.lawyer1)
        detail_url = reverse("case-detail", args=[self.case_ahm.id])

        update_data = {"court_name": "Hack Court Name"}
        # Serializer should ignore or reject it, and because they are lawyer, they only update allowed fields.
        response = self.client.patch(detail_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify court_name did not change
        case = Case.objects.get(id=self.case_ahm.id)
        self.assertEqual(case.court_name, "Ahmedabad Civil Court")

    @patch("cases.ml_service.predict_for_case")
    def test_case_predict_endpoint(self, mock_predict):
        """Test predict endpoint for cases."""
        mock_predict.return_value = {
            "duration_risk": "critical",
            "duration_confidence": 85.0,
            "disposal_likelihood": "Likely (Acquitted)",
            "disposal_confidence": 92.5,
            "risk_factors": ["High case age"],
        }
        self.client.force_authenticate(user=self.judge_ahm)
        predict_url = reverse("case-predict", args=[self.case_ahm.id])
        response = self.client.get(predict_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["duration_risk"], "critical")

        # Verify difficulty_tier was updated to 'critical' on the model
        case = Case.objects.get(id=self.case_ahm.id)
        self.assertEqual(case.difficulty_tier, "critical")
