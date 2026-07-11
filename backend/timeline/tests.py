from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from districts.models import District, State
from cases.models import Case, CaseAssignment
from timeline.models import Hearing

class TimelineTests(APITestCase):
    def setUp(self):
        # Setup state, districts
        self.state = State.objects.create(name="Gujarat", code="GJ")
        self.district_ahm = District.objects.create(state=self.state, name="Ahmedabad", code="AHM")
        self.district_sur = District.objects.create(state=self.state, name="Surat", code="SUR")
        
        # Setup users
        self.judge_ahm = User.objects.create_user(
            username="judge_ahm",
            email="judge_ahm@justicewatch.com",
            password="Password@123",
            role="judge",
            full_name="Judge Ahmedabad",
            is_verified=True,
            district_scope=self.district_ahm
        )
        self.lawyer_assigned = User.objects.create_user(
            username="lawyer_asg",
            email="lawyer_asg@justicewatch.com",
            password="Password@123",
            role="lawyer",
            full_name="Assigned Lawyer",
            is_verified=True
        )
        self.lawyer_unassigned = User.objects.create_user(
            username="lawyer_unasg",
            email="lawyer_unasg@justicewatch.com",
            password="Password@123",
            role="lawyer",
            full_name="Unassigned Lawyer",
            is_verified=True
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
            case_status="Pending"
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
            case_status="Pending"
        )

        # Assign lawyer to Ahmedabad case
        CaseAssignment.objects.create(case=self.case_ahm, lawyer=self.lawyer_assigned, representing="Petitioner")

        # Create an initial hearing
        self.hearing = Hearing.objects.create(
            case=self.case_ahm,
            hearing_date="2026-03-01",
            purpose="First Hearing",
            logged_by=self.judge_ahm
        )

    def test_hearing_list_lawyer(self):
        """Lawyer only sees hearings for their assigned cases."""
        self.client.force_authenticate(user=self.lawyer_assigned)
        response = self.client.get(reverse('hearing-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['purpose'], "First Hearing")
        
        # Unassigned lawyer sees nothing
        self.client.force_authenticate(user=self.lawyer_unassigned)
        response = self.client.get(reverse('hearing-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    def test_hearing_creation_judge_valid(self):
        """Judge can create a hearing in their district scope."""
        self.client.force_authenticate(user=self.judge_ahm)
        data = {
            "case": self.case_ahm.id,
            "hearing_date": "2026-04-01",
            "purpose": "Arguments",
            "next_hearing_date": "2026-05-01"
        }
        response = self.client.post(reverse('hearing-list'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['purpose'], "Arguments")

    def test_hearing_creation_judge_invalid_scope(self):
        """Judge cannot create a hearing outside their district scope."""
        self.client.force_authenticate(user=self.judge_ahm)
        data = {
            "case": self.case_sur.id, # Surat case is outside Ahmedabad scope
            "hearing_date": "2026-04-01",
            "purpose": "Arguments"
        }
        response = self.client.post(reverse('hearing-list'), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("detail", response.data)
        self.assertEqual(response.data['detail'], "You do not have permission to log a hearing for this case outside your district scope.")

    def test_hearing_creation_lawyer_assigned(self):
        """Assigned lawyer can log a hearing for their case."""
        self.client.force_authenticate(user=self.lawyer_assigned)
        data = {
            "case": self.case_ahm.id,
            "hearing_date": "2026-04-01",
            "purpose": "Evidence Submission"
        }
        response = self.client.post(reverse('hearing-list'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_hearing_creation_lawyer_unassigned(self):
        """Unassigned lawyer cannot log a hearing."""
        self.client.force_authenticate(user=self.lawyer_unassigned)
        data = {
            "case": self.case_ahm.id,
            "hearing_date": "2026-04-01",
            "purpose": "Hack"
        }
        response = self.client.post(reverse('hearing-list'), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
