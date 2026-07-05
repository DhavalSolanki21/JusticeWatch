from django_filters import rest_framework as filters
from .models import Case

class CaseFilter(filters.FilterSet):
    filed_date_after = filters.DateFilter(field_name="filed_date", lookup_expr='gte')
    filed_date_before = filters.DateFilter(field_name="filed_date", lookup_expr='lte')

    class Meta:
        model = Case
        fields = ['case_category', 'case_status', 'district', 'crime_type', 'chargesheet_status']
