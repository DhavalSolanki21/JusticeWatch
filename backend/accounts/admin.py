from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'email', 'full_name', 'role', 'is_verified', 'is_staff']
    list_filter = ['role', 'is_verified', 'is_staff', 'is_superuser', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('JusticeWatch Specific', {'fields': ('role', 'full_name', 'display_name', 'photo', 'district_scope', 'bar_council_id', 'designation', 'is_verified')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('JusticeWatch Specific', {'fields': ('role', 'full_name', 'display_name', 'photo', 'district_scope', 'bar_council_id', 'designation', 'is_verified')}),
    )
    actions = ['approve_lawyers']

    @admin.action(description='Approve selected lawyers (set is_verified=True)')
    def approve_lawyers(self, request, queryset):
        queryset.update(is_verified=True)

admin.site.register(User, CustomUserAdmin)
