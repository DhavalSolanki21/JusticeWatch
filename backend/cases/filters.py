from django_filters import rest_framework as filters
from .models import Case


class CaseFilter(filters.FilterSet):
    filed_date_after = filters.DateFilter(field_name="filed_date", lookup_expr="gte")
    filed_date_before = filters.DateFilter(field_name="filed_date", lookup_expr="lte")
    state = filters.NumberFilter(field_name="district__state__id")
    district__name = filters.CharFilter(
        field_name="district__name", lookup_expr="icontains"
    )

    class Meta:
        model = Case
        fields = [
            "case_category",
            "case_status",
            "district",
            "state",
            "crime_type",
            "chargesheet_status",
        ]
