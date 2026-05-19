from django.urls import path
from .views import SiteGeoJSONView

urlpatterns = [
    path('sites/', SiteGeoJSONView.as_view(), name='sites-geojson'),
]
