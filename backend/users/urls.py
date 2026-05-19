from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserMasterViewSet, LoginView, LogoutView

router = DefaultRouter()
router.register(r'users', UserMasterViewSet)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('', include(router.urls)),
]
