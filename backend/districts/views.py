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
        summaries = list(DistrictSummary.objects.select_related("district").filter(district__state__code="GJ"))
        
        crime_dict = {}
        chargesheet_dict = {}
        category_dict = {}
        
        for summary in summaries:
            dist_id = summary.district.id
            total = summary.pending_count + summary.disposed_count
            
            crime_dict[dist_id] = [
                {"crime": "Theft", "count": int(total * 0.4)},
                {"crime": "Assault", "count": int(total * 0.2)},
                {"crime": "Fraud", "count": int(total * 0.15)},
                {"crime": "Narcotics", "count": int(total * 0.1)},
                {"crime": "Other", "count": int(total * 0.15)},
            ]
            
            chargesheet_dict[dist_id] = [
                {"status": "Filed", "count": int(summary.pending_count * 0.8)},
                {"status": "Not Filed", "count": int(summary.pending_count * 0.2)},
            ]
            
            category_dict[dist_id] = [
                {"category": "Criminal", "count": int(total * 0.7)},
                {"category": "Civil", "count": int(total * 0.3)},
            ]

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

        cat_counts = (
            Case.objects.filter(district=district)
            .values("case_category")
            .annotate(count=Count("id"))
        )

        crime_counts = (
            Case.objects.filter(district=district, case_category="Criminal")
            .values("crime_type")
            .annotate(count=Count("id"))
            .order_by("-count")[:5]
        )

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
        districts = District.objects.filter(state__code="GJ").values("id", "name", "code", "state_id")
        return Response(list(districts))
