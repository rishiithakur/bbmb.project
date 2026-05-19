import os
import sys
import django

# Setup django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from django.contrib.auth import get_user_model
from observations.views import WaterLevelLogViewSet

User = get_user_model()

def test_export():
    try:
        # Find or create an admin user
        admin = User.objects.filter(role='admin').first()
        if not admin:
            admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            print("No admin user found. Creating one...")
            admin = User.objects.create_superuser('temp_admin', 'admin@example.com', 'adminpass', role='admin')
        
        factory = APIRequestFactory()
        request = factory.get('/api/observations/export-excel/')
        request.user = admin
        
        view = WaterLevelLogViewSet.as_view({'get': 'export_excel'})
        response = view(request)
        print("Status code:", response.status_code)
        if response.status_code == 500:
            if hasattr(response, 'data'):
                print("Error data:", response.data)
            else:
                print("Response content:", response.content[:1000])
        else:
            print("Export successful! Response type:", type(response))
    except Exception as e:
        import traceback
        print("Exception caught:")
        traceback.print_exc()

if __name__ == '__main__':
    test_export()
