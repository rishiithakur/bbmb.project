from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'', AuditLogViewSet, basename='audit')

urlpatterns = [
    path('', include(router.urls)),
]

