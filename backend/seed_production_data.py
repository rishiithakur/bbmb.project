import os
import django
import pandas as pd
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from sites_master.models import SiteMaster
from accounts.models import User
from observations.models import Observation
from audit.models import AuditLog

def purge_data():
    print("Purging data...")
    Observation.objects.all().delete()
    SiteMaster.objects.all().delete()
    AuditLog.objects.all().delete()
    # Don't delete all users, maybe just reset them?
    User.objects.exclude(username='admin_master').delete()
    print("Data purged.")

def seed_data():
    # Target sites
    target_sites = ["Pong Dam", "Pandoh Dam", "Moin Bridge", "Dubbling Bridge", "Sujanpur"]
    
    print("Seeding production sites...")
    for i, name in enumerate(target_sites):
        SiteMaster.objects.create(
            site_name=name,
            site_code=f"S{100+i}",
            dam_reservoir_name=name if "Dam" in name else "N/A",
            district_name="Kangra",
            state_name="Himachal Pradesh",
            river_name="Beas",
            latitude=Decimal(f"31.{8000+i*100}"),
            longitude=Decimal(f"76.{2000+i*100}"),
            full_reservoir_level=Decimal("420.00"),
            minimum_draw_down_level=Decimal("380.00"),
            danger_level=Decimal("415.00"),
            warning_level=Decimal("410.00"),
            site_status="Active",
            created_by="admin_master"
        )
        print(f"Created site: {name}")

    # Create System User (Operator)
    pong_site = SiteMaster.objects.get(site_name="Pong Dam")
    system_user, created = User.objects.get_or_create(
        username='system_user',
        defaults={
            'full_name': 'System Operator',
            'email': 'operator@bbmc.gov.in',
            'user_role': 'SiteUser',
            'assigned_site': pong_site,
            'mobile_number': '1234567890'
        }
    )
    system_user.set_password('systempassword')
    system_user.save()
    
    print(f"System user created/verified: {system_user.username} / systempassword")

    # Ensure admin user has password
    admin, created = User.objects.get_or_create(
        username='admin_master',
        defaults={
            'full_name': 'Super Administrator',
            'email': 'admin@bbmc.gov.in',
            'user_role': 'Admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    admin.set_password('DamAdmin@2026')
    admin.save()
    print("Admin user password reset to 'DamAdmin@2026'")

if __name__ == '__main__':
    purge_data()
    seed_data()
