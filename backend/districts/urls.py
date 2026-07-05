from django.urls import path
from .views import DistrictSummaryListView, DistrictBreakdownView

urlpatterns = [
    path('summary/', DistrictSummaryListView.as_view(), name='district-summary'),
    path('<int:pk>/breakdown/', DistrictBreakdownView.as_view(), name='district-breakdown'),
]
