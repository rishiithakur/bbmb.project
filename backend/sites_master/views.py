from rest_framework import generics, status
from rest_framework.response import Response
from .models import SiteMaster
from .serializers import SiteMasterSerializer
from accounts.permissions import IsBBMCAdmin, IsBBMCAdminOrReadOnly

class SiteMasterListCreateView(generics.ListCreateAPIView):
    """
    Build Django views for Site Master: list all sites with 
    search/filter, and create site.
    Admin only for creation, authenticated users can list/read.
    """
    serializer_class = SiteMasterSerializer
    permission_classes = [IsBBMCAdminOrReadOnly]

    def get_queryset(self):
        queryset = SiteMaster.objects.filter(is_deleted=False)
        search_query = self.request.query_params.get('search', None)
        district = self.request.query_params.get('district', None)
        status_filter = self.request.query_params.get('status', None)
        
        if search_query:
            queryset = queryset.filter(station_name__icontains=search_query) | \
                       queryset.filter(site_code__icontains=search_query)
        
        if district:
            queryset = queryset.filter(division__icontains=district)
            
        if status_filter:
            queryset = queryset.filter(site_status=status_filter)
            
        return queryset

class SiteMasterDetailUpdateView(generics.RetrieveUpdateAPIView):
    """
    Build Django views for Site Master: edit site.
    Admin only for updates, authenticated users can retrieve.
    """
    queryset = SiteMaster.objects.filter(is_deleted=False)
    serializer_class = SiteMasterSerializer
    permission_classes = [IsBBMCAdminOrReadOnly]
    lookup_field = 'site_id'

class SiteMasterStatusToggleView(generics.GenericAPIView):
    """
    Activate/Deactivate site.
    Admin only.
    """
    queryset = SiteMaster.objects.filter(is_deleted=False)
    permission_classes = [IsBBMCAdmin]
    lookup_field = 'site_id'

    def post(self, request, *args, **kwargs):
        site = self.get_object()
        action = request.data.get('action') # 'activate' or 'deactivate'
        
        if action == 'activate':
            site.site_status = 'Active'
            site.save()
            return Response({'message': f'Site {site.station_name} activated successfully.'})
        elif action == 'deactivate':
            site.site_status = 'Inactive'
            site.save()
            return Response({'message': f'Site {site.station_name} deactivated successfully.'})
        else:
            return Response({'error': 'Invalid action. Use "activate" or "deactivate".'}, status=status.HTTP_400_BAD_REQUEST)
