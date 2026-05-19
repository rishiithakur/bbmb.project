from django.contrib import admin
from .models import SiteMaster

@admin.register(SiteMaster)
class SiteMasterAdmin(admin.ModelAdmin):
    list_display = ('site_id', 'station_name', 'site_code', 'division', 'state', 'latitude', 'longitude', 'site_status', 'functional')
    search_fields = ('station_name', 'site_code', 'division')
    list_filter = ('state', 'site_status', 'functional')
