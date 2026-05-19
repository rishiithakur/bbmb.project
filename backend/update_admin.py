import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from accounts.models import User

try:
    user = User.objects.get(username='admin_master')
    user.set_password('DamAdmin@2026')
    user.save()
    print("Password for admin_master updated successfully.")
except User.DoesNotExist:
    print("User admin_master not found.")
except Exception as e:
    print(f"Error: {e}")
