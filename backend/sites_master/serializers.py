from rest_framework import serializers
from .models import SiteMaster

class SiteMasterSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='site_id', read_only=True)
    site_name = serializers.CharField(source='station_name', read_only=True)

    class Meta:
        model = SiteMaster
        fields = [
            'id', 'site_id', 'site_code', 'station_name', 'site_name',
            'division', 'basin', 'district', 'state', 'river_tributary',
            'latitude', 'longitude',
            'full_reservoir_level', 'max_water_level', 'dead_storage_level',
            'danger_level', 'warning_level', 'minimum_draw_down_level',
            'total_capacity_mcm', 'live_capacity_mcm', 'catchment_area_sqkm',
            'dam_type', 'site_status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['site_id', 'created_at', 'updated_at']
