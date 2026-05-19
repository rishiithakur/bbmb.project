import os
import django
import pandas as pd
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from sites_master.models import SiteMaster
from accounts.models import User
from observations.models import WaterLevelLog, DamObservation
from audit.models import AuditLog

def purge_data():
    print("Purging data...")
    DamObservation.objects.all().delete()
    WaterLevelLog.objects.all().delete()
    SiteMaster.objects.all().delete()
    AuditLog.objects.all().delete()
    User.objects.all().delete()
    print("Data purged.")

def seed_data():
    # Target sites data
    sites_to_seed = [
        {
            'site_code': 'PNG001',
            'station_name': 'Pong Dam',
            'basin': 'Beas',
            'division': 'Pong Dam Division',
            'district': 'Kangra',
            'state': 'Himachal Pradesh',
            'latitude': Decimal('31.967000'),
            'longitude': Decimal('75.950000'),
            'full_reservoir_level': Decimal('1400.000'),
            'max_water_level': Decimal('1421.000'),
            'dead_storage_level': Decimal('1260.000'),
            'danger_level': Decimal('1410.000'),
            'warning_level': Decimal('1395.000'),
            'minimum_draw_down_level': Decimal('1260.000'),
            'total_capacity_mcm': Decimal('8570.000'),
            'live_capacity_mcm': Decimal('7290.000'),
            'catchment_area_sqkm': Decimal('12560.000'),
            'dam_type': 'Earthfill',
            'site_status': 'Active',
            'functional': True
        },
        {
            'site_code': 'PND001',
            'station_name': 'Pandoh Dam',
            'basin': 'Beas',
            'division': 'Pandoh Dam Division',
            'district': 'Mandi',
            'state': 'Himachal Pradesh',
            'latitude': Decimal('31.667000'),
            'longitude': Decimal('77.067000'),
            'full_reservoir_level': Decimal('2941.000'),
            'max_water_level': Decimal('2950.000'),
            'dead_storage_level': Decimal('2880.000'),
            'danger_level': Decimal('2945.000'),
            'warning_level': Decimal('2940.000'),
            'minimum_draw_down_level': Decimal('2880.000'),
            'total_capacity_mcm': Decimal('41.000'),
            'live_capacity_mcm': Decimal('18.000'),
            'catchment_area_sqkm': Decimal('5278.000'),
            'dam_type': 'Earth and Rockfill',
            'site_status': 'Active',
            'functional': True
        },
        {
            'site_code': 'BHK001',
            'station_name': 'Bhakra Dam',
            'basin': 'Sutlej',
            'division': 'Bhakra Dam Division',
            'district': 'Bilaspur',
            'state': 'Himachal Pradesh',
            'latitude': Decimal('31.411000'),
            'longitude': Decimal('76.433000'),
            'full_reservoir_level': Decimal('1680.000'),
            'max_water_level': Decimal('1685.000'),
            'dead_storage_level': Decimal('1462.000'),
            'danger_level': Decimal('1682.000'),
            'warning_level': Decimal('1675.000'),
            'minimum_draw_down_level': Decimal('1462.000'),
            'total_capacity_mcm': Decimal('9621.000'),
            'live_capacity_mcm': Decimal('7191.000'),
            'catchment_area_sqkm': Decimal('56980.000'),
            'dam_type': 'Concrete Gravity',
            'site_status': 'Active',
            'functional': True
        },
        {
            'site_code': 'MNB001',
            'station_name': 'Moin Bridge',
            'basin': 'Beas',
            'division': 'Mandi Division',
            'district': 'Mandi',
            'state': 'Himachal Pradesh',
            'latitude': Decimal('31.700000'),
            'longitude': Decimal('76.900000'),
            'full_reservoir_level': Decimal('120.000'),
            'max_water_level': Decimal('125.000'),
            'dead_storage_level': Decimal('100.000'),
            'danger_level': Decimal('122.000'),
            'warning_level': Decimal('118.000'),
            'minimum_draw_down_level': Decimal('100.000'),
            'dam_type': 'Gauge Site',
            'site_status': 'Active',
            'functional': True
        },
        {
            'site_code': 'DUB001',
            'station_name': 'Dubbling Bridge',
            'basin': 'Sutlej',
            'division': 'Rampur Division',
            'district': 'Kinnaur',
            'state': 'Himachal Pradesh',
            'latitude': Decimal('31.750000'),
            'longitude': Decimal('78.600000'),
            'full_reservoir_level': Decimal('2200.000'),
            'max_water_level': Decimal('2210.000'),
            'dead_storage_level': Decimal('2180.000'),
            'danger_level': Decimal('2205.000'),
            'warning_level': Decimal('2200.000'),
            'minimum_draw_down_level': Decimal('2180.000'),
            'dam_type': 'Gauge Site',
            'site_status': 'Active',
            'functional': True
        },
        {
            'site_code': 'SJN001',
            'station_name': 'Sujanpur',
            'basin': 'Beas',
            'division': 'Hamirpur Division',
            'district': 'Hamirpur',
            'state': 'Himachal Pradesh',
            'latitude': Decimal('31.830000'),
            'longitude': Decimal('76.500000'),
            'full_reservoir_level': Decimal('250.000'),
            'max_water_level': Decimal('255.000'),
            'dead_storage_level': Decimal('240.000'),
            'danger_level': Decimal('252.000'),
            'warning_level': Decimal('248.000'),
            'minimum_draw_down_level': Decimal('240.000'),
            'dam_type': 'Gauge Site',
            'site_status': 'Active',
            'functional': True
        }
    ]
    
    print("Seeding production sites...")
    for item in sites_to_seed:
        SiteMaster.objects.create(**item)
        print(f"Created site: {item['station_name']}")

    pong_site = SiteMaster.objects.get(station_name="Pong Dam")
    pandoh_site = SiteMaster.objects.get(station_name="Pandoh Dam")

    # Create admin_master
    admin_master = User.objects.create(
        username='admin_master',
        full_name='System Administrator',
        email='admin_master@bbmc.gov.in',
        role='admin',
        is_staff=True,
        is_superuser=True,
        is_active=True,
        must_change_pwd=False
    )
    admin_master.set_password('DamAdmin@2026')
    admin_master.save()
    print("Created System Admin: admin_master / DamAdmin@2026")

    # Create supreme_admin
    supreme_admin = User.objects.create(
        username='supreme_admin',
        full_name='Supreme Administrator',
        email='supreme@bbmc.gov.in',
        role='supreme_admin',
        is_staff=True,
        is_superuser=True,
        is_active=True,
        must_change_pwd=False
    )
    supreme_admin.set_password('SupremeDam@2026')
    supreme_admin.save()
    print("Created Supreme Admin: supreme_admin / SupremeDam@2026")

    # Create Operators
    operators_data = [
        {
            'username': 'rahul_operator',
            'full_name': 'Rahul Operator',
            'email': 'rahul@bbmc.gov.in',
            'password': 'Rahul@2026',
            'assigned_site': pong_site,
        },
        {
            'username': 'rishii_op',
            'full_name': 'Rishii Operator',
            'email': 'rishii@bbmc.gov.in',
            'password': 'RISHII@2026',
            'assigned_site': pandoh_site,
        },
        {
            'username': 'testvij',
            'full_name': 'Test Vij Operator',
            'email': 'testvij@bbmc.gov.in',
            'password': 'Test@1234',
            'assigned_site': pong_site,
        },
        {
            'username': 'testsintu',
            'full_name': 'Test Sintu Operator',
            'email': 'testsintu@bbmc.gov.in',
            'password': 'Test@1234',
            'assigned_site': pandoh_site,
        }
    ]

    for op in operators_data:
        user = User.objects.create(
            username=op['username'],
            full_name=op['full_name'],
            email=op['email'],
            role='operator',
            assigned_site=op['assigned_site'],
            is_active=True,
            must_change_pwd=False
        )
        user.set_password(op['password'])
        user.save()
        print(f"Created Operator: {op['username']} / {op['password']} (Assigned to {op['assigned_site'].station_name})")

if __name__ == '__main__':
    purge_data()
    seed_data()
