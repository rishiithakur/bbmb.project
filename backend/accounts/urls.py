from django.urls import path
from .views import (
    LoginView, LogoutView, 
    UserListCreateView, UserDetailUpdateView, 
    UserPasswordResetView, UserAccountStatusView,
    BrandingView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('branding/<str:image_type>/', BrandingView.as_view(), name='branding'),
    
    # User Master CRUD (Admin Only)
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:user_id>/', UserDetailUpdateView.as_view(), name='user-detail-update'),
    path('users/<int:user_id>/reset-password/', UserPasswordResetView.as_view(), name='user-password-reset'),
    path('users/<int:user_id>/status/', UserAccountStatusView.as_view(), name='user-status-update'),
]
