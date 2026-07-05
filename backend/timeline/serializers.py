from rest_framework import serializers
from .models import Hearing

class HearingSerializer(serializers.ModelSerializer):
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    logged_by_name = serializers.CharField(source='logged_by.full_name', read_only=True)

    class Meta:
        model = Hearing
        fields = (
            'id', 'case', 'case_number', 'hearing_date', 'purpose', 
            'outcome_notes', 'next_hearing_date', 'logged_by', 
            'logged_by_name', 'created_at'
        )
        read_only_fields = ('logged_by', 'created_at')
