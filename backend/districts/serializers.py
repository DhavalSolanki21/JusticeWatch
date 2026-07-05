from rest_framework import serializers
from .models import District, DistrictSummary

class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ('id', 'name', 'code')

class DistrictSummarySerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)
    district_code = serializers.CharField(source='district.code', read_only=True)

    class Meta:
        model = DistrictSummary
        fields = ('id', 'district_name', 'district_code', 'pending_count', 'disposed_count', 
                  'disposal_rate', 'avg_case_age_days', 'severity_tier')
