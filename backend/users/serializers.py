from rest_framework import serializers
from .models import UserMaster
from sites.models import SiteMaster

class UserMasterSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(source='site.station_name', read_only=True)
    
    class Meta:
        model = UserMaster
        fields = (
            'user_id', 'username', 'full_name', 'email', 'mobile', 
            'role', 'site', 'site_name', 'designation', 'department', 
            'is_active', 'must_change_pwd', 'password'
        )
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'site': {'required': False, 'allow_null': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = UserMaster(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
