from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import HealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', HealthCheckView.as_view(), name='health_check'),
    
    # Auth
    # Auth (SimpleJWT defaults)
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Apps
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/', include('accounts.urls')),
    path('api/v1/', include('sites_master.urls')),
    path('api/v1/', include('observations.urls')),
    path('api/v1/audit/', include('audit.urls')),
    path('api/v1/gis/', include('gis.urls')),
]
