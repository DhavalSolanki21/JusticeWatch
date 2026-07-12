from django.urls import path
from .views import SystemOverviewAPI, PredictionsOverviewAPI, AdvancedPredictView

urlpatterns = [
    path("overview/", SystemOverviewAPI.as_view(), name="analytics-overview"),
    path(
        "predictions/", PredictionsOverviewAPI.as_view(), name="analytics-predictions"
    ),
    path(
        "predict-custom/",
        AdvancedPredictView.as_view(),
        name="analytics-predict-custom",
    ),
]
