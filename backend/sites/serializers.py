from rest_framework import serializers
from .models import SiteMaster

class SiteMasterSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(source='station_name', read_only=True)
    
    class Meta:
        model = SiteMaster
        fields = '__all__'
        # Ensure site_name is included if it's not picked up by __all__ for read_only fields
        extra_kwargs = {
            'station_name': {'required': True}
        }
    
    def get_fields(self):
        fields = super().get_fields()
        fields['site_name'] = serializers.CharField(source='station_name', read_only=True)
        return fields
