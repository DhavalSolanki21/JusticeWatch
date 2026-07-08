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

class CaseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = (
            'district', 'court_name', 'case_category', 'crime_type', 
            'applicable_sections', 'fir_number', 'fir_date', 
            'num_parties', 'case_notes'
        )

    def create(self, validated_data):
        import uuid
        import datetime
        # Auto-generate a case number if not provided
        # Format: CAT/YYYY/UUID
        cat = str(validated_data.get('case_category', 'UNK'))[:3].upper()
        year = datetime.datetime.now().year
        uid = str(uuid.uuid4().hex[:6]).upper()
        case_number = f"{cat}/{year}/{uid}"
        validated_data['case_number'] = case_number
        validated_data['filed_date'] = datetime.datetime.now().date()
        return super().create(validated_data)

class CaseBriefSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)

    class Meta:
        model = Case
        fields = (
            'id', 'case_number', 'district_name', 'case_category', 
            'case_status', 'filed_date', 'difficulty_tier'
        )
