from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WaterLevelLogViewSet, DamObservationViewSet

router = DefaultRouter()
router.register(r'observations', WaterLevelLogViewSet, basename='observation')
router.register(r'observations-details', DamObservationViewSet, basename='observation-detail')

urlpatterns = [
    path('', include(router.urls)),
]
