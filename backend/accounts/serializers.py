from rest_framework import serializers
from .models import User
from sites_master.models import SiteMaster

class UserSerializer(serializers.ModelSerializer):
    
    # Map backend user_id to id for frontend compatibility
    id = serializers.IntegerField(source='user_id', read_only=True)
    
    # site field is used for write operations in some parts of frontend
    site = serializers.PrimaryKeyRelatedField(
        source='assigned_site', 
        queryset=SiteMaster.objects.all(),
        required=False,
        allow_null=True
    )
    
    # Aliases for frontend compatibility
    mobile_number = serializers.CharField(source='mobile', required=False, allow_blank=True)
    user_role = serializers.CharField(source='role', required=False)
    site_name = serializers.CharField(source='assigned_site.station_name', read_only=True)
    
    # password field for updates
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'id', 'user_id', 'username', 'email', 'full_name', 'role', 'user_role',
            'mobile', 'mobile_number', 'is_active', 'assigned_site', 'site', 'site_name',
            'created_at', 'updated_at', 'password'
        ]
        read_only_fields = ['user_id', 'created_at']

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        # Handle role mapping if user_role is provided
        user_role = validated_data.pop('role', None)
        if user_role:
            instance.role = user_role
            
        return super().update(instance, validated_data)

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    site = serializers.PrimaryKeyRelatedField(
        source='assigned_site', 
        queryset=SiteMaster.objects.all(),
        required=False,
        allow_null=True
    )
    user_role = serializers.CharField(source='role', required=False)
    assigned_site = serializers.PrimaryKeyRelatedField(
        queryset=SiteMaster.objects.all(),
        required=False,
        allow_null=True
    )
    mobile_number = serializers.CharField(source='mobile', required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ['full_name', 'username', 'password', 'email', 'mobile', 'mobile_number', 'role', 'user_role', 'site', 'assigned_site', 'designation', 'department']
        
    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class PasswordResetSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
