from rest_framework import serializers
from .models import AuditLog, Notification



class AuditLogSerializer(serializers.ModelSerializer):
    # Frontend expects 'timestamp' — map from model's 'created_at'
    timestamp = serializers.DateTimeField(source='created_at', read_only=True)

    # Frontend expects 'event_type' — map from model's 'action'
    event_type = serializers.CharField(source='action', read_only=True)

    # Resolved username from FK
    username = serializers.SerializerMethodField()

    # Resolved role
    user_role = serializers.SerializerMethodField()

    # Human-readable description
    description = serializers.SerializerMethodField()

    # site_id for filtering compat (frontend sends site_id param)
    site_id = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'audit_id',
            'event_type',      # mapped from action
            'username',        # computed
            'user_role',       # computed
            'site_id',         # computed
            'record_id',
            'ip_address',
            'timestamp',       # mapped from created_at
            'description',     # computed
            'status',
            'device_type',
            'table_name',
            'old_data',
            'new_data',
        ]

    def get_username(self, obj):
        return obj.user.username if obj.user else 'System'

    def get_user_role(self, obj):
        return getattr(obj.user, 'role', 'System') if obj.user else 'System'

    def get_description(self, obj):
        site_str = f' on site "{obj.site.station_name}"' if obj.site else ''
        return f'{obj.action}{site_str}'

    def get_site_id(self, obj):
        return obj.site_id if obj.site else None


class NotificationSerializer(serializers.ModelSerializer):
    site_name = serializers.ReadOnlyField(source='site.station_name')
    recipient_username = serializers.ReadOnlyField(source='recipient_user.username')

    class Meta:
        model = Notification
        fields = [
            'id',
            'recipient_user',
            'recipient_username',
            'recipient_role',
            'site',
            'site_name',
            'type',
            'title',
            'message',
            'read_status',
            'metadata_json',
            'created_at',
        ]

