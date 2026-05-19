from django.contrib import admin
from .models import UserMaster

@admin.register(UserMaster)
class UserMasterAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'username', 'email', 'full_name', 'role', 'site', 'is_active')
    search_fields = ('username', 'email', 'full_name')
    list_filter = ('role', 'is_active', 'site')
