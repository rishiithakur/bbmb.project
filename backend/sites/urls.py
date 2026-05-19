from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SiteMasterViewSet

router = DefaultRouter()
router.register(r'sites', SiteMasterViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
