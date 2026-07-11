from rest_framework import serializers
from django.db.models import Count
from .models import District, DistrictSummary
from cases.models import Case

class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ('id', 'name', 'code')

class DistrictSummarySerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)
    district_code = serializers.CharField(source='district.code', read_only=True)
    crime_distribution = serializers.SerializerMethodField()
    chargesheet_distribution = serializers.SerializerMethodField()
    category_distribution = serializers.SerializerMethodField()

    class Meta:
        model = DistrictSummary
        fields = ('id', 'district_name', 'district_code', 'pending_count', 'disposed_count', 
                  'disposal_rate', 'avg_case_age_days', 'severity_tier', 
                  'crime_distribution', 'chargesheet_distribution', 'category_distribution')

    def get_crime_distribution(self, obj):
        crime_dict = self.context.get('crime_dict')
        if crime_dict is not None:
            return crime_dict.get(obj.district.id, [])
        crime_counts = Case.objects.filter(district=obj.district, case_category='Criminal').values('crime_type').annotate(count=Count('id')).order_by('-count')[:5]
        return [{'crime': item['crime_type'] or 'Other', 'count': item['count']} for item in crime_counts]

    def get_chargesheet_distribution(self, obj):
        chargesheet_dict = self.context.get('chargesheet_dict')
        if chargesheet_dict is not None:
            return chargesheet_dict.get(obj.district.id, [])
        chargesheet_counts = Case.objects.filter(district=obj.district).values('chargesheet_status').annotate(count=Count('id'))
        return [{'status': item['chargesheet_status'] or 'Pending', 'count': item['count']} for item in chargesheet_counts]

    def get_category_distribution(self, obj):
        category_dict = self.context.get('category_dict')
        if category_dict is not None:
            return category_dict.get(obj.district.id, [])
        category_counts = Case.objects.filter(district=obj.district).values('case_category').annotate(count=Count('id'))
        return [{'category': item['case_category'] or 'Civil', 'count': item['count']} for item in category_counts]
