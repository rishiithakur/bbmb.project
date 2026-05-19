from audit.models import AuditLog

def log_audit(request, action, table_name=None, record_id=None, old_data=None, new_data=None, site=None, status='success', error_message=None):
    """
    Utility function to log system actions.
    """
    
    # Try to extract site from data if not provided
    if not site and hasattr(request, 'user') and hasattr(request.user, 'site'):
        site = request.user.site

    # Extract GPS if available in headers or data (custom implementation)
    gps_lat = request.data.get('gps_latitude') if hasattr(request, 'data') else None
    gps_lon = request.data.get('gps_longitude') if hasattr(request, 'data') else None

    AuditLog.objects.create(
        user=request.user if hasattr(request, 'user') and request.user.is_authenticated else None,
        site=site,
        action=action,
        table_name=table_name,
        record_id=record_id,
        old_data=old_data,
        new_data=new_data,
        ip_address=request.META.get('REMOTE_ADDR') if request else None,
        device_type=request.META.get('HTTP_USER_AGENT', '')[:20] if request else None, # Simplified
        browser=request.META.get('HTTP_USER_AGENT', '')[:100] if request else None,
        gps_latitude=gps_lat,
        gps_longitude=gps_lon,
        status=status,
        error_message=error_message,
        session_id=request.session.session_key if request and hasattr(request, 'session') else None
    )
