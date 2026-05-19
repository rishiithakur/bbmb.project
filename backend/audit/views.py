from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from audit.models import AuditLog, Notification
from audit.serializers import AuditLogSerializer, NotificationSerializer
from accounts.permissions import IsBBMCAdmin
from django.db.models import Q


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only audit log endpoint.
    Accessible to admin, supreme_admin, and ultra_admin roles.
    Previously restricted to IsSupremeOrUltraAdmin which caused 403 for admin role.
    """
    queryset = AuditLog.objects.select_related('user', 'site').order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [IsBBMCAdmin]   # Fixed: was IsSupremeOrUltraAdmin → blocked admin users
    filterset_fields = ['action', 'site']


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for database notifications.
    Includes strict role and site security isolation.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Notification.objects.select_related('recipient_user', 'site').order_by('-created_at')

        # Auto-trigger inactivity alert check for administrators when fetching notifications
        if user.role in ['admin', 'supreme_admin', 'ultra_admin']:
            self._trigger_inactivity_check()
            return qs

        # Operator is strictly isolated to their own site or notifications specifically targeted to their user
        # Note: recipient_role = 'operator' + matching site is also retrieved.
        if user.role == 'operator':
            if user.assigned_site_id:
                return qs.filter(
                    Q(recipient_user=user) | 
                    Q(recipient_role='operator', site_id=user.assigned_site_id)
                )
            else:
                return qs.filter(recipient_user=user)

        # Viewer can see notifications for all sites but read-only (though read_status can be changed for their viewing)
        if user.role == 'viewer':
            return qs

        return Notification.objects.none()

    def _trigger_inactivity_check(self):
        """
        Scan all active sites to see if they lack a final submission in the last 24 hours.
        Create an inactivity warning notification if none exists in the last 24 hours.
        """
        try:
            from django.utils import timezone
            from datetime import timedelta
            from sites_master.models import SiteMaster
            from observations.models import WaterLevelLog

            cutoff = timezone.now() - timedelta(hours=24)
            active_sites = SiteMaster.objects.filter(site_status='Active')
            
            for site in active_sites:
                # Check if there is any FINAL log in last 24 hours
                has_log = WaterLevelLog.objects.filter(
                    site=site,
                    is_verified=True,
                    observation_datetime__gte=cutoff
                ).exists()

                if not has_log:
                    # Check if an INACTIVE_SITE notification for this site has been sent in the last 24 hours
                    exists = Notification.objects.filter(
                        site=site,
                        type='INACTIVE_SITE',
                        created_at__gte=cutoff
                    ).exists()

                    if not exists:
                        Notification.objects.create(
                            recipient_role='admin',
                            site=site,
                            type='INACTIVE_SITE',
                            title=f"Station Alert: Inactivity Warning",
                            message=f"Station '{site.station_name}' has not submitted any finalized telemetry data in the last 24 hours.",
                            metadata_json={
                                'site_id': site.site_id,
                                'site_code': site.site_code,
                                'last_check': timezone.now().isoformat()
                            }
                        )
        except Exception as e:
            # Silent catch so it never crashes notification fetch
            print(f"Error in _trigger_inactivity_check: {e}")

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        qs = self.get_queryset().filter(read_status=False)
        count = qs.update(read_status=True)
        return Response({'message': f'{count} notifications marked as read.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='clear-all')
    def clear_all(self, request):
        # Allow clearing notifications scoped to current user/role
        qs = self.get_queryset()
        count = qs.count()
        qs.delete()
        return Response({'message': f'{count} notifications cleared.'}, status=status.HTTP_200_OK)

