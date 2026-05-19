from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'supreme_admin', 'ultra_admin']

class IsSupremeOrUltraAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['supreme_admin', 'ultra_admin']

class IsOperator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'operator'

class IsViewer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'viewer', 'supreme_admin', 'ultra_admin']

class IsOwnSite(permissions.BasePermission):
    """
    Allows access only to resources belonging to the operator's site.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['admin', 'supreme_admin', 'ultra_admin']:
            return True
        
        # Check if the object has a site attribute (like WaterLevelLog)
        site_id = getattr(obj, 'site_id', None)
        if not site_id and hasattr(obj, 'site'):
            site_id = obj.site.site_id
            
        return request.user.assigned_site_id == site_id
