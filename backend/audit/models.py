from django.db import models
from django.conf import settings
from sites_master.models import SiteMaster

class AuditLog(models.Model):
    audit_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    site = models.ForeignKey(SiteMaster, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    
    action = models.CharField(max_length=50) # INSERT_WATER_LEVEL, LOGIN_SUCCESS, etc.
    table_name = models.CharField(max_length=50, null=True, blank=True)
    record_id = models.IntegerField(null=True, blank=True)
    
    # Data Changes
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    
    # Device & Network Context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_type = models.CharField(max_length=20, null=True, blank=True) # mobile, tablet, desktop
    browser = models.CharField(max_length=255, null=True, blank=True)
    
    # GPS Context
    gps_latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    gps_longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    
    # Execution Info
    status = models.CharField(max_length=20, default='success') # success, failed, blocked
    error_message = models.TextField(null=True, blank=True)
    session_id = models.CharField(max_length=100, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_log'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.username if self.user else "System"
        return f"{self.action} by {user_str} at {self.created_at}"


class Notification(models.Model):
    id = models.BigAutoField(primary_key=True)
    recipient_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    recipient_role = models.CharField(max_length=50, null=True, blank=True) # admin, operator, etc.
    site = models.ForeignKey(
        SiteMaster,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    type = models.CharField(max_length=50) # FINAL_SUBMISSION, DRAFT_SAVED, RESERVOIR_ALERT, etc.
    title = models.CharField(max_length=255)
    message = models.TextField()
    read_status = models.BooleanField(default=False)
    metadata_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notification'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.type} ({self.created_at})"

