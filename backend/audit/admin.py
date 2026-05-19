from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'user', 'site', 'table_name', 'status', 'created_at')
    list_filter = ('action', 'status', 'created_at', 'device_type')
    search_fields = ('user__username', 'table_name', 'action', 'error_message')
    readonly_fields = ('created_at',)
