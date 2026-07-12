from django.contrib import admin
from .models import Hearing


@admin.register(Hearing)
class HearingAdmin(admin.ModelAdmin):
    list_display = (
        "case",
        "hearing_date",
        "purpose",
        "next_hearing_date",
        "logged_by",
        "created_at",
    )
    list_filter = ("purpose", "hearing_date", "created_at")
    search_fields = (
        "case__case_number",
        "purpose",
        "logged_by__username",
        "logged_by__full_name",
    )
    ordering = ("-hearing_date",)
