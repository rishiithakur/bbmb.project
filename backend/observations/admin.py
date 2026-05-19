from django.contrib import admin
from .models import WaterLevelLog, DamObservation, ObservationPhoto

class ObservationPhotoInline(admin.TabularInline):
    model = ObservationPhoto
    extra = 1

class DamObservationInline(admin.StackedInline):
    model = DamObservation
    can_delete = False
    verbose_name_plural = 'Dam Detailed Observations'

@admin.register(WaterLevelLog)
class WaterLevelLogAdmin(admin.ModelAdmin):
    list_display = ('site', 'user', 'observation_datetime', 'water_level_m', 'storage_mcm', 'is_verified', 'is_flagged')
    search_fields = ('site__station_name', 'site__site_code', 'user__full_name', 'user__username')
    list_filter = ('is_verified', 'is_flagged', 'observation_date', 'site')
    readonly_fields = ('created_at', 'updated_at', 'verified_at', 'verified_by')
    date_hierarchy = 'observation_date'
    inlines = [DamObservationInline, ObservationPhotoInline]

@admin.register(DamObservation)
class DamObservationAdmin(admin.ModelAdmin):
    list_display = ('log', 'site', 'spillway_gates_open', 'power_generation_mw', 'rainfall_today_mm', 'alert_level')
    list_filter = ('alert_level', 'dam_condition', 'site')
    search_fields = ('site__station_name', 'site__site_code')

@admin.register(ObservationPhoto)
class ObservationPhotoAdmin(admin.ModelAdmin):
    list_display = ('log', 'photo', 'uploaded_at')
    list_filter = ('uploaded_at',)
