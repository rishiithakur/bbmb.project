from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from sites_master.models import SiteMaster

class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(username, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('operator', 'Operator'),
        ('viewer', 'Viewer'),
        ('supreme_admin', 'Supreme Admin'),
        ('ultra_admin', 'Ultra Admin'),
    )
    
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=150)
    email = models.EmailField(max_length=150, unique=True, null=True, blank=True)
    mobile = models.CharField(max_length=15, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='operator')
    assigned_site = models.ForeignKey(SiteMaster, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_users')
    designation = models.CharField(max_length=100, null=True, blank=True)
    department = models.CharField(max_length=100, null=True, blank=True)
    
    # Operational fields
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    login_count = models.IntegerField(default=0)
    must_change_pwd = models.BooleanField(default=True)
    
    # Metadata
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_users')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Django specific
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'user_master'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.full_name} ({self.username})"

class SystemBranding(models.Model):
    key = models.CharField(max_length=50, unique=True, default='current')
    logo_name = models.CharField(max_length=100, default='logo.png')
    logo_data = models.BinaryField(null=True, blank=True)
    logo_mimetype = models.CharField(max_length=50, default='image/png')
    
    background_name = models.CharField(max_length=100, default='background.png')
    background_data = models.BinaryField(null=True, blank=True)
    background_mimetype = models.CharField(max_length=50, default='image/png')
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'System Branding'
        verbose_name_plural = 'System Branding'

    def __str__(self):
        return f"System Branding (Updated: {self.updated_at})"
