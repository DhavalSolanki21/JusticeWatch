from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CaseViewSet, AllCasesListView, MyCaseHistoryView

router = DefaultRouter()
router.register(r"", CaseViewSet, basename="case")

urlpatterns = [
    path("all/", AllCasesListView.as_view(), name="all_cases"),
    path("my-history/", MyCaseHistoryView.as_view(), name="my_history"),
    path("", include(router.urls)),
]
