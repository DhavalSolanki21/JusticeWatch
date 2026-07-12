from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    UserProfileView,
    PendingLawyerListView,
    ApproveLawyerView,
    JudgeCaseHistoryView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", UserProfileView.as_view(), name="user_profile"),
    path("pending-lawyers/", PendingLawyerListView.as_view(), name="pending_lawyers"),
    path(
        "approve-lawyer/<int:pk>/", ApproveLawyerView.as_view(), name="approve_lawyer"
    ),
    path("judge-history/", JudgeCaseHistoryView.as_view(), name="judge_history"),
]
