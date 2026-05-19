import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from accounts.models import User

username = 'admin_master'
password = 'DamAdmin@2026'
email = 'admin@bbmc.com'

try:
    user = User.objects.get(username=username)
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.role = 'admin'
    user.save()
    print(f"User {username} updated successfully.")
except User.DoesNotExist:
    User.objects.create_superuser(username=username, email=email, password=password, full_name='System Admin', role='admin')
    print(f"User {username} created successfully.")
