import os
import sys
import django

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from accounts.models import User

username = 'admin_master'
password = 'DamAdmin@2026'

u = User.objects.filter(username=username).first()
if u:
    print(f"User found: {u.username}")
    print(f"Is active: {u.is_active}")
    print(f"Is staff: {u.is_staff}")
    print(f"Is superuser: {u.is_superuser}")
    print(f"Password correct: {u.check_password(password)}")
else:
    print("User not found")
    # Create it if missing
    User.objects.create_superuser(
        username=username,
        password=password,
        full_name='System Administrator',
        email='admin@bbmc.gov.in',
        role='admin'
    )
    print("User created successfully")
