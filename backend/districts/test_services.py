import pytest
from districts.services import compute_district_summaries
from districts.models import DistrictSummary

@pytest.mark.django_db
def test_compute_summaries_basic(district_ahm, case_ahm):
    # case_ahm is Pending
    compute_district_summaries()
    summary = DistrictSummary.objects.get(district=district_ahm)
    assert summary.pending_count == 1
    assert summary.disposed_count == 0
    assert summary.disposal_rate == 0.0

@pytest.mark.django_db
def test_compute_summaries_severity_tiers(district_ahm, case_ahm):
    compute_district_summaries()
    summary = DistrictSummary.objects.get(district=district_ahm)
    assert summary.severity_tier in ["low", "medium", "high", "critical"]

@pytest.mark.django_db
def test_compute_summaries_empty_db(db):
    compute_district_summaries()
    assert DistrictSummary.objects.count() == 0
