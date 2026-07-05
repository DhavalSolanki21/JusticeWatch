from django.contrib import admin
from .models import Case, CaseAssignment

@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ('case_number', 'district', 'case_category', 'case_status', 'chargesheet_status', 'difficulty_tier')
    list_filter = ('case_category', 'case_status', 'chargesheet_status', 'difficulty_tier', 'district')
    search_fields = ('case_number', 'fir_number', 'applicable_sections')

@admin.register(CaseAssignment)
class CaseAssignmentAdmin(admin.ModelAdmin):
    list_display = ('case', 'lawyer', 'representing', 'assigned_date')
    list_filter = ('representing',)
    search_fields = ('case__case_number', 'lawyer__username', 'lawyer__full_name')
