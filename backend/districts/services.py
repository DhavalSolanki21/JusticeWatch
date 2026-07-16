from django.db.models import Count, Q, Avg, F
from django.db.models.functions import Cast
from django.db.models import FloatField
from datetime import date
from .models import District, DistrictSummary
from cases.models import Case

def compute_district_summaries():
    districts = District.objects.all()
    if not districts.exists():
        return

    today = date.today()

    for district in districts:
        stats = Case.objects.filter(district=district).aggregate(
            pending_count=Count("id", filter=Q(case_status="Pending")),
            disposed_count=Count("id", filter=Q(case_status="Disposed")),
        )

        pending_count = stats["pending_count"] or 0
        disposed_count = stats["disposed_count"] or 0
        total_cases = pending_count + disposed_count

        disposal_rate = 0.0
        if total_cases > 0:
            disposal_rate = disposed_count / total_cases

        pending_cases = Case.objects.filter(district=district, case_status="Pending")
        avg_case_age_days = 0.0
        if pending_cases.exists():
            total_days = 0
            for pc in pending_cases:
                total_days += (today - pc.filed_date).days
            avg_case_age_days = total_days / pending_cases.count()

        DistrictSummary.objects.update_or_create(
            district=district,
            defaults={
                "pending_count": pending_count,
                "disposed_count": disposed_count,
                "disposal_rate": disposal_rate,
                "avg_case_age_days": avg_case_age_days,
            },
        )

    summaries = DistrictSummary.objects.filter(district__state__code="GJ")
    max_pending = max([s.pending_count for s in summaries]) if summaries.exists() else 0
    max_avg_age = max([s.avg_case_age_days for s in summaries]) if summaries.exists() else 0

    max_pending = max_pending if max_pending > 0 else 1
    max_avg_age = max_avg_age if max_avg_age > 0 else 1

    for summary in summaries:
        p_score = (summary.pending_count / max_pending) * 0.5
        a_score = (summary.avg_case_age_days / max_avg_age) * 0.3
        d_score = (1 - summary.disposal_rate) * 0.2

        severity_score = p_score + a_score + d_score

        if severity_score <= 0.25:
            tier = "low"
        elif severity_score <= 0.50:
            tier = "medium"
        elif severity_score <= 0.75:
            tier = "high"
        else:
            tier = "critical"

        summary.severity_tier = tier
        summary.save()
