from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Hearing
from .serializers import HearingSerializer

class HearingViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = HearingSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.is_verified:
            return Hearing.objects.none()
            
        if user.role == 'judge':
            if user.district_scope:
                qs = Hearing.objects.filter(case__district=user.district_scope)
            else:
                qs = Hearing.objects.all()
            
        elif user.role == 'lawyer':
            qs = Hearing.objects.filter(case__caseassignment__lawyer=user)
            
        else:
            return Hearing.objects.none()

        case_id = self.request.query_params.get('case')
        if case_id:
            qs = qs.filter(case_id=case_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(logged_by=self.request.user)

    def create(self, request, *args, **kwargs):
        # Validate that the user has permission to log a hearing for this case
        case_id = request.data.get('case')
        if not case_id:
            return Response({"case": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
            
        user = request.user
        if user.role == 'lawyer':
            # Lawyer must be assigned to this case to create a hearing for it
            from cases.models import CaseAssignment
            is_assigned = CaseAssignment.objects.filter(case_id=case_id, lawyer=user).exists()
            if not is_assigned:
                return Response(
                    {"detail": "You do not have permission to log a hearing for this case."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.role == 'judge':
            # Judge must be in district scope if defined
            if user.district_scope:
                from cases.models import Case
                try:
                    case = Case.objects.get(pk=case_id)
                    if case.district != user.district_scope:
                        return Response(
                            {"detail": "You do not have permission to log a hearing for this case outside your district scope."},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except Case.DoesNotExist:
                    return Response({"case": ["Invalid case ID."]}, status=status.HTTP_400_BAD_REQUEST)
                    
        return super().create(request, *args, **kwargs)
