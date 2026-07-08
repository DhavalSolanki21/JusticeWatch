from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import DistrictSummary, District
from .serializers import DistrictSummarySerializer
from accounts.permissions import IsJudge
from django.db.models import Count
from cases.models import Case

class DistrictSummaryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        summaries = DistrictSummary.objects.select_related('district').all()
        serializer = DistrictSummarySerializer(summaries, many=True)
        return Response(serializer.data)


class DistrictBreakdownView(APIView):
    permission_classes = [IsJudge]

    def get(self, request, pk):
        try:
            district = District.objects.get(pk=pk)
        except District.DoesNotExist:
            return Response({"error": "District not found"}, status=404)

        # Case category split
        cat_counts = Case.objects.filter(district=district).values('case_category').annotate(count=Count('id'))
        
        # Top 5 crime types
        crime_counts = Case.objects.filter(district=district, case_category='Criminal').values('crime_type').annotate(count=Count('id')).order_by('-count')[:5]
        
        # Chargesheet status distribution
        chargesheet_counts = Case.objects.filter(district=district).values('chargesheet_status').annotate(count=Count('id'))

        data = {
            "district": district.name,
            "category_split": {item['case_category']: item['count'] for item in cat_counts},
            "top_crime_types": {item['crime_type']: item['count'] for item in crime_counts},
            "chargesheet_distribution": {item['chargesheet_status']: item['count'] for item in chargesheet_counts}
        }
        
        return Response(data)

from .models import State

class StateListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        states = State.objects.all().values('id', 'name', 'code')
        return Response(list(states))

class DistrictListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        districts = District.objects.all().values('id', 'name', 'code', 'state_id')
        return Response(list(districts))
