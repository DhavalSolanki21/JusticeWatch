from rest_framework import serializers
from .models import Case, CaseAssignment
from accounts.serializers import UserProfileSerializer

class LawyerAssignmentSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='lawyer.full_name', read_only=True)
    
    class Meta:
        model = CaseAssignment
        fields = ('id', 'lawyer', 'full_name', 'representing', 'assigned_date')

class CaseDetailSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)
    judge_name = serializers.CharField(source='judge.full_name', read_only=True)
    assigned_lawyers = LawyerAssignmentSerializer(source='caseassignment_set', many=True, read_only=True)

    class Meta:
        model = Case
        fields = '__all__'

class CaseListSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)

    class Meta:
        model = Case
        fields = (
            'id', 'case_number', 'district_name', 'case_category', 
            'crime_type', 'case_status', 'chargesheet_status', 
            'difficulty_tier', 'filed_date'
        )

class LawyerCaseUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = ('chargesheet_status', 'case_notes')
