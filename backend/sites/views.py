from rest_framework import viewsets, permissions
from .models import SiteMaster
from .serializers import SiteMasterSerializer
from users.permissions import IsAdmin, IsViewer, IsSupremeOrUltraAdmin
from audit.utils import log_audit

class SiteMasterViewSet(viewsets.ModelViewSet):
    queryset = SiteMaster.objects.all()
    serializer_class = SiteMasterSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsSupremeOrUltraAdmin()]
        elif self.action in ['update', 'partial_update']:
            return [IsAdmin()]
        return [IsViewer()]

    def perform_create(self, serializer):
        site = serializer.save()
        log_audit(
            request=self.request,
            action='SITE_CREATED',
            table_name='sites_master',
            record_id=site.site_id,
            new_data=serializer.data,
            site=site
        )

    def perform_update(self, serializer):
        old_site = self.get_object()
        old_data = SiteMasterSerializer(old_site).data
        site = serializer.save()
        log_audit(
            request=self.request,
            action='SITE_EDITED',
            table_name='sites_master',
            record_id=site.site_id,
            old_data=old_data,
            new_data=serializer.data,
            site=site
        )

    def perform_destroy(self, instance):
        record_id = instance.site_id
        old_data = SiteMasterSerializer(instance).data
        instance.delete()
        log_audit(
            request=self.request,
            action='SITE_DELETED',
            table_name='sites_master',
            record_id=record_id,
            old_data=old_data,
            status='success'
        )
