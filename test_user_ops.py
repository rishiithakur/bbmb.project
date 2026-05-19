import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')

# Fix for testserver host
from django.conf import settings
if not settings.configured:
    django.setup()

settings.ALLOWED_HOSTS = list(settings.ALLOWED_HOSTS) + ['testserver']

from rest_framework.test import APIClient
from accounts.models import User

def test_user_ops():
    client = APIClient()
    try:
        admin_user = User.objects.get(username='admin_master')
    except User.DoesNotExist:
        admin_user = User.objects.get(username='admin')
        
    client.force_authenticate(user=admin_user)
    
    # Create test user
    test_username = 'temp_test_user'
    User.objects.filter(username=test_username).delete()
    test_user = User.objects.create_user(username=test_username, password='InitialPassword123!', full_name='Temp Test User')
    print(f"Created test user: {test_user.username} (ID: {test_user.user_id})")
    
    # 1. Test Password Update
    print("Testing password update...")
    new_password = 'NewSecurePassword456!'
    response = client.put(f'/api/v1/users/{test_user.user_id}/', {
        'username': test_username,
        'full_name': 'Temp Test User Updated',
        'password': new_password,
        'role': 'operator'
    }, format='json')
    
    if response.status_code == 200:
        print("PUT request successful.")
        test_user.refresh_from_db()
        if test_user.check_password(new_password):
            print("Password update verified in DB.")
        else:
            print("Password update FAILED in DB.")
    else:
        print(f"PUT request failed with status {response.status_code}")
        if hasattr(response, 'data'):
             print(response.data)

    # 2. Test Soft Delete
    print("Testing soft delete...")
    response = client.delete(f'/api/v1/users/{test_user.user_id}/')
    if response.status_code == 204:
        print("DELETE request successful.")
        test_user.refresh_from_db()
        if test_user.is_deleted and not test_user.is_active:
            print("Soft delete verified in DB (is_deleted=True, is_active=False).")
        else:
            print(f"Soft delete FAILED in DB. is_deleted={test_user.is_deleted}, is_active={test_user.is_active}")
    else:
        print(f"DELETE request failed with status {response.status_code}")

    # Cleanup
    test_user.delete()
    print("Test user cleaned up.")

if __name__ == '__main__':
    test_user_ops()
