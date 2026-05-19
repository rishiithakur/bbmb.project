import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from accounts.models import User

users = User.objects.all()
for u in users:
    print(f"ID: {u.user_id}, Username: {u.username}, Role: {u.role}, IsActive: {u.is_active}, IsSuperuser: {u.is_superuser}")
