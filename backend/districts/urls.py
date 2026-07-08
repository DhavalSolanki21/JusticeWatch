from django.urls import path
from .views import DistrictSummaryListView, DistrictBreakdownView, DistrictListView, StateListView

urlpatterns = [
    path('summary/', DistrictSummaryListView.as_view(), name='district-summary'),
    path('list/', DistrictListView.as_view(), name='district-list'),
    path('states/', StateListView.as_view(), name='state-list'),
    path('<int:pk>/breakdown/', DistrictBreakdownView.as_view(), name='district-breakdown'),
]
