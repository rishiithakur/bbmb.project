import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from accounts.models import User

def remove_fake_users():
    for username in ['admin', 'operator', 'viewer']:
        try:
            u = User.objects.get(username=username)
            u.delete()
            print(f"Deleted user {username}")
        except User.DoesNotExist:
            print(f"User {username} does not exist")

if __name__ == '__main__':
    remove_fake_users()
