import pytest
from rest_framework.test import APIClient
from accounts.models import User
from districts.models import District, State, DistrictSummary
from cases.models import Case, CaseAssignment
from timeline.models import Hearing

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def state_gj(db):
    return State.objects.create(name="Gujarat", code="GJ")

@pytest.fixture
def district_ahm(db, state_gj):
    return District.objects.create(
        state=state_gj, name="Ahmedabad", code="AHM", population=1000000
    )

@pytest.fixture
def district_sur(db, state_gj):
    return District.objects.create(
        state=state_gj, name="Surat", code="SUR", population=800000
    )

@pytest.fixture
def district_summary_ahm(db, district_ahm):
    return DistrictSummary.objects.create(
        district=district_ahm,
        pending_count=2,
        disposed_count=10,
        disposal_rate=0.83,
        avg_case_age_days=180.5,
        severity_tier="medium",
    )

@pytest.fixture
def judge_ahm(db, district_ahm):
    return User.objects.create_user(
        username="judge_ahm",
        email="judge_ahm@justicewatch.com",
        password="Password@123",
        role="judge",
        full_name="Judge Ahmedabad",
        is_verified=True,
        district_scope=district_ahm,
    )

@pytest.fixture
def lawyer_verified(db):
    return User.objects.create_user(
        username="lawyer_verified",
        email="lawyer_ver@justicewatch.com",
        password="Password@123",
        role="lawyer",
        full_name="Verified Lawyer",
        is_verified=True,
    )

@pytest.fixture
def lawyer_unverified(db):
    return User.objects.create_user(
        username="lawyer_unverified",
        email="lawyer_unver@justicewatch.com",
        password="Password@123",
        role="lawyer",
        full_name="Unverified Lawyer",
        is_verified=False,
    )

@pytest.fixture
def case_ahm(db, district_ahm):
    return Case.objects.create(
        case_number="CIV/2026/AHM111",
        district=district_ahm,
        court_name="Ahmedabad Civil Court",
        case_category="Civil",
        crime_type="Property Dispute",
        applicable_sections="Sec 37",
        filed_date="2026-01-01",
        chargesheet_status="Not Filed",
        case_status="Pending",
        num_parties=2,
        difficulty_tier="medium",
    )

@pytest.fixture
def case_sur(db, district_sur):
    return Case.objects.create(
        case_number="CRM/2026/SUR222",
        district=district_sur,
        court_name="Surat Sessions Court",
        case_category="Criminal",
        crime_type="Theft",
        applicable_sections="Sec 379 IPC",
        filed_date="2024-01-01",
        chargesheet_status="Filed",
        case_status="Pending",
        num_parties=2,
        difficulty_tier="high",
    )

@pytest.fixture
def assignment_ahm(db, case_ahm, lawyer_verified):
    return CaseAssignment.objects.create(
        case=case_ahm, lawyer=lawyer_verified, representing="Petitioner"
    )

@pytest.fixture
def hearing_ahm(db, case_ahm, judge_ahm):
    return Hearing.objects.create(
        case=case_ahm,
        hearing_date="2026-03-01",
        purpose="First Hearing",
        logged_by=judge_ahm,
    )

@pytest.fixture
def auth_judge(judge_ahm):
    client = APIClient()
    client.force_authenticate(user=judge_ahm)
    return client

@pytest.fixture
def auth_lawyer(lawyer_verified):
    client = APIClient()
    client.force_authenticate(user=lawyer_verified)
    return client
