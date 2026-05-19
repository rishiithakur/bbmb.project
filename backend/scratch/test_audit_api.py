import os
import django
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bbmc_backend.settings")
django.setup()

from rest_framework.test import APIRequestFactory
from audit.views import AuditLogViewSet
from accounts.models import User

# Get an admin user to make the request
admin_user = User.objects.filter(role='admin').first() or User.objects.filter(is_superuser=True).first()
if not admin_user:
    print("No admin user found in db.")
    sys.exit(1)

print(f"Using user: {admin_user.username} (role: {admin_user.role})")

factory = APIRequestFactory()
request = factory.get('/api/v1/audit/')
request.user = admin_user

view = AuditLogViewSet.as_view({'get': 'list'})
try:
    response = view(request)
    print("Response Status Code:", response.status_code)
    if response.status_code == 200:
        print("First 2 items:")
        import json
        print(json.dumps(response.data[:2], indent=2, default=str))
    else:
        print("Response Data:", response.data)
except Exception as e:
    import traceback
    traceback.print_exc()
