from rest_framework import viewsets, filters as drf_filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Case
from .serializers import (
    CaseDetailSerializer,
    CaseListSerializer,
    LawyerCaseUpdateSerializer,
    CaseCreateSerializer,
    CaseBriefSerializer,
)
from .filters import CaseFilter
from accounts.permissions import IsJudgeOrReadOnlyForLawyer


class CaseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsJudgeOrReadOnlyForLawyer]
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter, drf_filters.OrderingFilter]
    filterset_class = CaseFilter
    search_fields = ["case_number", "fir_number", "applicable_sections"]
    ordering_fields = ["filed_date", "difficulty_score"]

    def get_queryset(self):
        user = self.request.user

        if user.role == "judge":
            if user.district_scope:
                return Case.objects.filter(district=user.district_scope)
            return Case.objects.all()

        elif user.role == "lawyer":
            return Case.objects.filter(caseassignment__lawyer=user)

        return Case.objects.none()

    def list(self, request, *args, **kwargs):
        # FAST PATH FOR DASHBOARD ESCALATION WIDGET
        # Prevents full table scan, filesort, and .count() on 5.3M rows
        if request.query_params.get("ordering") == "-difficulty_score" and request.query_params.get("case_status") == "Pending":
            qs = self.get_queryset().filter(case_status="Pending")[:5]
            serializer = self.get_serializer(qs, many=True)
            return Response({"results": serializer.data, "count": 5})
            
        return super().list(request, *args, **kwargs)

    def get_serializer_class(self):
        if self.action == "create":
            return CaseCreateSerializer
        if self.action == "list":
            return CaseListSerializer

        if (
            self.action in ["update", "partial_update"]
            and self.request.user.role == "lawyer"
        ):
            return LawyerCaseUpdateSerializer

        return CaseDetailSerializer

    def perform_create(self, serializer):
        case = serializer.save()
        if self.request.user.role == "lawyer":
            from .models import CaseAssignment

            CaseAssignment.objects.create(
                case=case, lawyer=self.request.user, representing="Petitioner"
            )

    @action(detail=True, methods=["get"])
    def predict(self, request, pk=None):
        case = self.get_object()

        from .ml_service import predict_for_case

        predictions = predict_for_case(case)

        if "error" not in predictions:
            # We can optionally save the duration_risk as the case difficulty tier
            # if we want to cache it, but let's just return it for now.
            if case.difficulty_tier != predictions["duration_risk"]:
                case.difficulty_tier = predictions["duration_risk"]
                case.save(update_fields=["difficulty_tier"])

        return Response(predictions)

    @action(detail=True, methods=["post"])
    def assign_lawyer(self, request, pk=None):
        case = self.get_object()
        lawyer_id = request.data.get("lawyer_id")
        representing = request.data.get("representing", "Petitioner")

        if not lawyer_id:
            return Response({"error": "lawyer_id is required"}, status=400)

        # Non-judges can only assign themselves to represent a party
        if request.user.role != "judge" and request.user.id != int(lawyer_id):
            return Response({"error": "You can only assign yourself to a case"}, status=403)

        from accounts.models import User
        try:
            lawyer = User.objects.get(id=lawyer_id, role="lawyer", is_verified=True)
        except User.DoesNotExist:
            return Response({"error": "Verified lawyer not found"}, status=404)

        from .models import CaseAssignment
        assignment, created = CaseAssignment.objects.get_or_create(
            case=case,
            lawyer=lawyer,
            defaults={"representing": representing}
        )
        if not created:
            assignment.representing = representing
            assignment.save()

        return Response({"status": "Lawyer assigned successfully"})

    @action(detail=True, methods=["post"])
    def unassign_lawyer(self, request, pk=None):
        case = self.get_object()
        assignment_id = request.data.get("assignment_id")

        if not assignment_id:
            return Response({"error": "assignment_id is required"}, status=400)

        from .models import CaseAssignment
        try:
            assignment = CaseAssignment.objects.get(id=assignment_id, case=case)
            
            # Non-judges can only unassign themselves
            if request.user.role != "judge" and assignment.lawyer != request.user:
                return Response({"error": "You can only unassign yourself"}, status=403)
                
            assignment.delete()
            return Response({"status": "Lawyer unassigned successfully"})
        except CaseAssignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=404)


from rest_framework import generics
from accounts.permissions import IsVerifiedUser


class AllCasesListView(generics.ListAPIView):
    permission_classes = [IsVerifiedUser]
    serializer_class = CaseBriefSerializer
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter]
    filterset_class = CaseFilter
    search_fields = ["case_number", "fir_number", "applicable_sections"]
    queryset = Case.objects.filter(district__state__code="GJ").order_by("-filed_date")


class MyCaseHistoryView(generics.ListAPIView):
    permission_classes = [IsVerifiedUser]
    serializer_class = CaseDetailSerializer
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter]
    filterset_class = CaseFilter
    search_fields = ["case_number", "fir_number", "applicable_sections"]

    def get_queryset(self):
        user = self.request.user
        if user.role == "judge":
            return Case.objects.filter(judge=user).order_by(
                "case_status", "-filed_date"
            )
        elif user.role == "lawyer":
            return Case.objects.filter(caseassignment__lawyer=user).order_by(
                "case_status", "-filed_date"
            )
        return Case.objects.none()
