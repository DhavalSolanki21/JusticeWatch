from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import DistrictSummary, District
from .serializers import DistrictSummarySerializer
from accounts.permissions import IsJudge
from django.db.models import Count
from cases.models import Case

from django.core.cache import cache


class DistrictSummaryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Fetch case status counts per district live from database
        case_stats = Case.objects.values("district_id", "case_status").annotate(
            count=Count("id")
        )

        pending_counts = {}
        disposed_counts = {}
        for item in case_stats:
            dist_id = item["district_id"]
            status = item["case_status"]
            count = item["count"]
            if status == "Pending":
                pending_counts[dist_id] = count
            elif status == "Disposed":
                disposed_counts[dist_id] = count

        # 2. Get average case age per district live from database
        from collections import defaultdict
        import datetime

        district_ages = defaultdict(list)
        today = datetime.date.today()

        for case_info in Case.objects.values(
            "district_id", "filed_date", "disposed_date"
        ):
            dist_id = case_info["district_id"]
            filed = case_info["filed_date"]
            disposed = case_info["disposed_date"]
            if filed:
                end_date = disposed if disposed else today
                age = (end_date - filed).days
                district_ages[dist_id].append(age)

        avg_ages = {}
        for dist_id, ages in district_ages.items():
            avg_ages[dist_id] = sum(ages) / len(ages) if ages else 0.0

        # 3. Instantiate in-memory DistrictSummary objects with live metrics
        summaries = []
        for dist in District.objects.all():
            pending = pending_counts.get(dist.id, 0)
            disposed = disposed_counts.get(dist.id, 0)
            total = pending + disposed
            rate = (disposed / total) if total > 0 else 0.0
            avg_age = avg_ages.get(dist.id, 0.0)

            if pending > 15:
                severity = "critical"
            elif pending > 10:
                severity = "high"
            elif pending > 5:
                severity = "medium"
            else:
                severity = "low"

            summary = DistrictSummary(
                district=dist,
                pending_count=pending,
                disposed_count=disposed,
                disposal_rate=rate,
                avg_case_age_days=avg_age,
                severity_tier=severity,
            )
            summaries.append(summary)

        # 4. Prefetch crime distribution (top 5 per district)
        crimes = (
            Case.objects.filter(case_category="Criminal")
            .values("district_id", "crime_type")
            .annotate(count=Count("id"))
            .order_by("district_id", "-count")
        )
        crime_dict = {}
        for item in crimes:
            dist_id = item["district_id"]
            if dist_id not in crime_dict:
                crime_dict[dist_id] = []
            if len(crime_dict[dist_id]) < 5:
                crime_dict[dist_id].append(
                    {"crime": item["crime_type"] or "Other", "count": item["count"]}
                )

        # 5. Prefetch chargesheet distribution
        chargesheets = Case.objects.values(
            "district_id", "chargesheet_status"
        ).annotate(count=Count("id"))
        chargesheet_dict = {}
        for item in chargesheets:
            dist_id = item["district_id"]
            if dist_id not in chargesheet_dict:
                chargesheet_dict[dist_id] = []
            chargesheet_dict[dist_id].append(
                {
                    "status": item["chargesheet_status"] or "Pending",
                    "count": item["count"],
                }
            )

        # 6. Prefetch category distribution
        categories = Case.objects.values("district_id", "case_category").annotate(
            count=Count("id")
        )
        category_dict = {}
        for item in categories:
            dist_id = item["district_id"]
            if dist_id not in category_dict:
                category_dict[dist_id] = []
            category_dict[dist_id].append(
                {"category": item["case_category"] or "Civil", "count": item["count"]}
            )

        serializer = DistrictSummarySerializer(
            summaries,
            many=True,
            context={
                "crime_dict": crime_dict,
                "chargesheet_dict": chargesheet_dict,
                "category_dict": category_dict,
            },
        )
        return Response(serializer.data)


class DistrictBreakdownView(APIView):
    permission_classes = [IsJudge]

    def get(self, request, pk):
        try:
            district = District.objects.get(pk=pk)
        except District.DoesNotExist:
            return Response({"error": "District not found"}, status=404)

        # Case category split
        cat_counts = (
            Case.objects.filter(district=district)
            .values("case_category")
            .annotate(count=Count("id"))
        )

        # Top 5 crime types
        crime_counts = (
            Case.objects.filter(district=district, case_category="Criminal")
            .values("crime_type")
            .annotate(count=Count("id"))
            .order_by("-count")[:5]
        )

        # Chargesheet status distribution
        chargesheet_counts = (
            Case.objects.filter(district=district)
            .values("chargesheet_status")
            .annotate(count=Count("id"))
        )

        data = {
            "district": district.name,
            "category_split": {
                item["case_category"]: item["count"] for item in cat_counts
            },
            "top_crime_types": {
                item["crime_type"]: item["count"] for item in crime_counts
            },
            "chargesheet_distribution": {
                item["chargesheet_status"]: item["count"] for item in chargesheet_counts
            },
        }

        return Response(data)


from .models import State


class StateListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        states = State.objects.all().values("id", "name", "code")
        return Response(list(states))


class DistrictListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        districts = District.objects.all().values("id", "name", "code", "state_id")
        return Response(list(districts))
