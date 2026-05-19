import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from users.models import UserMaster
from sites.models import SiteMaster

def create_initial_data():
    # Create Site
    site, _ = SiteMaster.objects.get_or_create(
        site_id=1,
        defaults={
            'site_code': 'DAM001',
            'station_name': 'Main Dam Station',
            'latitude': 25.0000,
            'longitude': 85.0000,
            'functional': True
        }
    )
    print(f"Site created: {site.station_name}")

    # Create Admin
    admin_user, created = UserMaster.objects.get_or_create(
        username='admin',
        defaults={
            'full_name': 'System Administrator',
            'email': 'admin@bbmc.gov.in',
            'role': 'admin',
            'is_superuser': True,
            'is_staff': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("Admin user created (username: admin, password: admin123)")

    # Create Operator
    op_user, created = UserMaster.objects.get_or_create(
        username='operator1',
        defaults={
            'full_name': 'Dam Operator 1',
            'email': 'operator1@bbmc.gov.in',
            'role': 'operator',
            'site': site
        }
    )
    if created:
        op_user.set_password('op123')
        op_user.save()
        print("Operator user created (username: operator1, password: op123)")

if __name__ == '__main__':
    create_initial_data()
