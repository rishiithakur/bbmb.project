import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from accounts.models import User

def check_or_fix_admin():
    username = 'admin_master'
    password = 'DamAdmin@2026'
    
    try:
        user = User.objects.get(username=username)
        print(f"User {username} found.")
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.user_role = 'Admin'
        user.account_status = 'Active'
        user.login_attempts = 0
        user.save()
        print(f"Password reset and account status fixed for {username}.")
    except User.DoesNotExist:
        print(f"User {username} not found. Creating...")
        User.objects.create_superuser(
            username=username,
            password=password,
            full_name='Super Admin'
        )
        print(f"Superuser {username} created successfully.")

if __name__ == '__main__':
    check_or_fix_admin()
