from django.contrib import admin
from .models import State, District, DistrictSummary

@admin.register(State)
class StateAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')

@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ('name', 'state', 'code', 'total_courts')
    list_filter = ('state',)
    search_fields = ('name', 'code', 'state__name')

@admin.register(DistrictSummary)
class DistrictSummaryAdmin(admin.ModelAdmin):
    list_display = ('district', 'severity_tier', 'pending_count', 'disposed_count', 'disposal_rate', 'last_computed')
    list_filter = ('severity_tier',)
    search_fields = ('district__name',)
