from django.urls import path
from .views import SystemOverviewAPI

urlpatterns = [
    path('overview/', SystemOverviewAPI.as_view(), name='analytics-overview'),
]
