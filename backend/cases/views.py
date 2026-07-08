from rest_framework import viewsets, filters as drf_filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Case
from .serializers import CaseDetailSerializer, CaseListSerializer, LawyerCaseUpdateSerializer, CaseCreateSerializer, CaseBriefSerializer
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
                return Case.objects.filter(district=user.district_scope)
            return Case.objects.all()
            
        elif user.role == 'lawyer':
            return Case.objects.filter(caseassignment__lawyer=user)
            
        return Case.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return CaseCreateSerializer
        if self.action == 'list':
            return CaseListSerializer
        
        if self.action in ['update', 'partial_update'] and self.request.user.role == 'lawyer':
            return LawyerCaseUpdateSerializer
            
        return CaseDetailSerializer
        
    def perform_create(self, serializer):
        case = serializer.save()
        if self.request.user.role == 'lawyer':
            from .models import CaseAssignment
            CaseAssignment.objects.create(case=case, lawyer=self.request.user, representing='Petitioner')
        
    @action(detail=True, methods=['get'])
    def predict(self, request, pk=None):
        case = self.get_object()
        
        from .ml_service import predict_for_case
        predictions = predict_for_case(case)
        
        if 'error' not in predictions:
            # We can optionally save the duration_risk as the case difficulty tier
            # if we want to cache it, but let's just return it for now.
            if case.difficulty_tier != predictions['duration_risk']:
                case.difficulty_tier = predictions['duration_risk']
                case.save(update_fields=['difficulty_tier'])
                
        return Response(predictions)

from rest_framework import generics
from accounts.permissions import IsVerifiedUser

class AllCasesListView(generics.ListAPIView):
    permission_classes = [IsVerifiedUser]
    serializer_class = CaseBriefSerializer
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter]
    filterset_class = CaseFilter
    search_fields = ['case_number', 'fir_number', 'applicable_sections']
    queryset = Case.objects.all().order_by('-filed_date')

class MyCaseHistoryView(generics.ListAPIView):
    permission_classes = [IsVerifiedUser]
    serializer_class = CaseDetailSerializer
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter]
    filterset_class = CaseFilter
    search_fields = ['case_number', 'fir_number', 'applicable_sections']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'judge':
            return Case.objects.filter(judge=user).order_by('case_status', '-filed_date')
        elif user.role == 'lawyer':
            return Case.objects.filter(caseassignment__lawyer=user).order_by('case_status', '-filed_date')
        return Case.objects.none()
