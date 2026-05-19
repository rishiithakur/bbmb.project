from rest_framework import permissions

class IsBBMCAdmin(permissions.BasePermission):
    """
    Allows access only to users with user_role 'Admin'.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['admin', 'supreme_admin', 'ultra_admin'])

class IsBBMCAdminOrReadOnly(permissions.BasePermission):
    """
    Allows read-only access (GET, HEAD, OPTIONS) to any authenticated user,
    but write operations (POST, PUT, PATCH, DELETE) only to Admins.
    """
    def has_permission(self, request, view):
        if not bool(request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user.role in ['admin', 'supreme_admin', 'ultra_admin'])

class IsSupremeOrUltraAdmin(permissions.BasePermission):
    """
    Allows access only to users with role supreme_admin or ultra_admin.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['supreme_admin', 'ultra_admin'])


