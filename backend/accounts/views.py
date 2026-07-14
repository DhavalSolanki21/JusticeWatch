from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import (
    UserRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    ProfileUpdateSerializer,
)
from .permissions import IsJudge


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return ProfileUpdateSerializer
        return UserProfileSerializer


class PendingLawyerListView(generics.ListAPIView):
    permission_classes = (IsJudge,)
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        return User.objects.filter(role="lawyer", is_verified=False)


class ApproveLawyerView(APIView):
    permission_classes = (IsJudge,)

    def post(self, request, pk):
        try:
            lawyer = User.objects.get(pk=pk, role="lawyer", is_verified=False)
            lawyer.is_verified = True
            lawyer.save()
            return Response(
                {"message": f"Lawyer {lawyer.full_name} approved successfully."},
                status=status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Pending lawyer not found."}, status=status.HTTP_404_NOT_FOUND
            )


class JudgeCaseHistoryView(APIView):
    permission_classes = (IsJudge,)

    def get(self, request):
        from cases.serializers import CaseListSerializer
        from cases.models import Case

        cases = Case.objects.filter(judge=request.user).order_by("-filed_date")
        serializer = CaseListSerializer(cases, many=True)
        return Response(serializer.data)


class VerifiedLawyerListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserProfileSerializer
    pagination_class = None

    def get_queryset(self):
        return User.objects.filter(role="lawyer", is_verified=True).order_by("full_name")


class VerifiedJudgeListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserProfileSerializer
    pagination_class = None

    def get_queryset(self):
        return User.objects.filter(role="judge", is_verified=True).order_by("full_name")
