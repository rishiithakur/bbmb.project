from django.contrib import admin
from .models import SiteMaster

@admin.register(SiteMaster)
class SiteMasterAdmin(admin.ModelAdmin):
    list_display = ('station_name', 'site_code', 'division', 'basin', 'site_status', 'created_at')
    search_fields = ('station_name', 'site_code', 'division', 'basin')
    list_filter = ('state', 'site_status', 'functional')
    readonly_fields = ('created_at', 'updated_at')
