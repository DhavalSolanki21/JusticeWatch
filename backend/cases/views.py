from rest_framework import viewsets, filters as drf_filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Case
from .serializers import CaseDetailSerializer, CaseListSerializer, LawyerCaseUpdateSerializer
from .filters import CaseFilter
from accounts.permissions import IsJudgeOrReadOnlyForLawyer

class CaseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsJudgeOrReadOnlyForLawyer]
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter]
    filterset_class = CaseFilter
    search_fields = ['case_number', 'fir_number', 'applicable_sections']

    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'judge':
            if user.district_scope:
                return Case.objects.filter(district__name=user.district_scope)
            return Case.objects.all()
            
        elif user.role == 'lawyer':
            return Case.objects.filter(caseassignment__lawyer=user)
            
        return Case.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return CaseListSerializer
        
        if self.action in ['update', 'partial_update'] and self.request.user.role == 'lawyer':
            return LawyerCaseUpdateSerializer
            
        return CaseDetailSerializer
        
    @action(detail=True, methods=['get'])
    def difficulty_breakdown(self, request, pk=None):
        case = self.get_object()
        
        from .ml_service import get_difficulty_score
        num_hearings = case.hearings.count()
        score, factors = get_difficulty_score(
            case.crime_type,
            case.fir_date,
            case.chargesheet_status,
            num_hearings
        )
        
        if score is not None:
            if case.difficulty_score != score:
                case.difficulty_score = score
                if score <= 0.25:
                    case.difficulty_tier = 'low'
                elif score <= 0.50:
                    case.difficulty_tier = 'medium'
                elif score <= 0.75:
                    case.difficulty_tier = 'high'
                else:
                    case.difficulty_tier = 'critical'
                case.save(update_fields=['difficulty_score', 'difficulty_tier'])
        
        data = {
            "difficulty_score": case.difficulty_score,
            "difficulty_tier": case.difficulty_tier,
            "contributing_factors": factors,
            "disclaimer": "This is a case-complexity estimate based on procedural and administrative factors. It does not predict, assess, or comment on the merits, guilt, or legal outcome of this case."
        }
        
        return Response(data)
