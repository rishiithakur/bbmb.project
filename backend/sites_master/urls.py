from django.urls import path
from .views import SiteMasterListCreateView, SiteMasterDetailUpdateView, SiteMasterStatusToggleView

urlpatterns = [
    path('sites/', SiteMasterListCreateView.as_view(), name='site-list-create'),
    path('sites/<int:site_id>/', SiteMasterDetailUpdateView.as_view(), name='site-detail-update'),
    path('sites/<int:site_id>/toggle/', SiteMasterStatusToggleView.as_view(), name='site-toggle-status'),
]
