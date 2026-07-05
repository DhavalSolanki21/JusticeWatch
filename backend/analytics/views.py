from rest_framework.views import APIView
from rest_framework.response import Response
from cases.models import Case
from django.db.models import Count, Avg, F, Q
from accounts.permissions import IsJudge

class SystemOverviewAPI(APIView):
    permission_classes = [IsJudge]

    def get(self, request):
        qs = Case.objects.all()
        
        # Total cases
        total = qs.count()
        
        # Pending vs Disposed
        status_counts = qs.values('case_status').annotate(count=Count('id'))
        pending = sum(item['count'] for item in status_counts if item['case_status'] == 'Pending')
        
        # Difficulty Tiers
        tiers = qs.values('difficulty_tier').annotate(count=Count('id'))
        
        # Top 5 congested districts
        congested = qs.filter(case_status='Pending').values('district__name').annotate(count=Count('id')).order_by('-count')[:5]

        data = {
            "total_cases": total,
            "pending_cases": pending,
            "status_breakdown": {item['case_status']: item['count'] for item in status_counts},
            "difficulty_breakdown": {item['difficulty_tier']: item['count'] for item in tiers},
            "top_congested_districts": {item['district__name']: item['count'] for item in congested}
        }
        
        return Response(data)
