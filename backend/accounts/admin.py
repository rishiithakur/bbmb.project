from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SystemBranding
from django import forms

class SystemBrandingForm(forms.ModelForm):
    logo_upload = forms.ImageField(required=False, help_text="Upload a new logo to store in DB")
    background_upload = forms.ImageField(required=False, help_text="Upload a new background to store in DB")

    class Meta:
        model = SystemBranding
        fields = ['key', 'logo_upload', 'background_upload']

    def save(self, commit=True):
        instance = super().save(commit=False)
        logo = self.cleaned_data.get('logo_upload')
        if logo:
            instance.logo_data = logo.read()
            instance.logo_name = logo.name
            instance.logo_mimetype = logo.content_type
        
        bg = self.cleaned_data.get('background_upload')
        if bg:
            instance.background_data = bg.read()
            instance.background_name = bg.name
            instance.background_mimetype = bg.content_type
            
        if commit:
            instance.save()
        return instance

@admin.register(SystemBranding)
class SystemBrandingAdmin(admin.ModelAdmin):
    form = SystemBrandingForm
    list_display = ['key', 'logo_name', 'background_name', 'updated_at']
    readonly_fields = ['updated_at']

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'full_name', 'email', 'role', 'assigned_site', 'is_active', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('full_name', 'mobile', 'role', 'assigned_site', 'designation', 'department', 'login_count', 'must_change_pwd', 'created_by')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('full_name', 'mobile', 'role', 'assigned_site', 'designation', 'department')}),
    )

admin.site.register(User, CustomUserAdmin)
