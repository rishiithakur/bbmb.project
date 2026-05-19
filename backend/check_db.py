import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from accounts.models import User
from sites_master.models import SiteMaster

print("Users in database:")
for u in User.objects.all():
    print(f"- {u.username} (Role: {u.role}, Status: {'Active' if u.is_active else 'Inactive'})")

print("\nSites in database:")
for s in SiteMaster.objects.all():
    print(f"- {s.station_name} ({s.site_code})")
