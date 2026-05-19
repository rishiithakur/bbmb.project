import os
import sys
import django
from decimal import Decimal

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from sites_master.models import SiteMaster
from accounts.models import User
from observations.models import WaterLevelLog, DamObservation, ObservationPhoto
from audit.models import AuditLog

def purge_data():
    print("Purging data...")
    ObservationPhoto.objects.all().delete()
    DamObservation.objects.all().delete()
    WaterLevelLog.objects.all().delete()
    SiteMaster.objects.all().delete()
    AuditLog.objects.all().delete()
    # Delete all users except admin_master
    User.objects.exclude(username='admin_master').delete()
    print("Data purged.")

def seed_data():
    # Production Sites Data
    sites_data = [
        {
            "site_code": "PONG-01",
            "station_name": "Pong Dam",
            "division": "Talwara",
            "basin": "Beas",
            "latitude": 31.9667,
            "longitude": 75.9167,
            "full_reservoir_level": 423.67,
            "max_water_level": 426.72,
            "dead_storage_level": 384.05,
            "total_capacity_mcm": 8570.00,
            "live_capacity_mcm": 7290.00,
            "catchment_area_sqkm": 12560.00,
            "instrumentation": "Automated",
            "transmission_minutes": 15
        },
        {
            "site_code": "PNDH-02",
            "station_name": "Pandoh Dam",
            "division": "Pandoh",
            "basin": "Beas",
            "latitude": 31.6667,
            "longitude": 77.0667,
            "full_reservoir_level": 890.32,
            "max_water_level": 893.00,
            "dead_storage_level": 880.00,
            "total_capacity_mcm": 310.00,
            "live_capacity_mcm": 18.00,
            "catchment_area_sqkm": 13160.00,
            "instrumentation": "Semi-Automated",
            "transmission_minutes": 30
        },
        {
            "site_code": "BHAK-03",
            "station_name": "Bhakra Dam",
            "division": "Nangal",
            "basin": "Sutlej",
            "latitude": 31.4167,
            "longitude": 76.4333,
            "full_reservoir_level": 512.06,
            "max_water_level": 515.11,
            "dead_storage_level": 445.62,
            "total_capacity_mcm": 9340.00,
            "live_capacity_mcm": 7430.00,
            "catchment_area_sqkm": 56980.00,
            "instrumentation": "Digital Gauge",
            "transmission_minutes": 10
        },
        {
            "site_code": "LRJI-04",
            "station_name": "Larji Dam",
            "division": "Kullu",
            "basin": "Beas",
            "latitude": 31.7167,
            "longitude": 77.2167,
            "full_reservoir_level": 950.00,
            "max_water_level": 953.00,
            "dead_storage_level": 930.00,
            "total_capacity_mcm": 50.00,
            "live_capacity_mcm": 15.00,
            "catchment_area_sqkm": 4500.00,
            "instrumentation": "Manual",
            "transmission_minutes": 60
        },
        {
            "site_code": "KOLD-05",
            "station_name": "Kol Dam",
            "division": "Bilaspur",
            "basin": "Sutlej",
            "latitude": 31.3667,
            "longitude": 76.8667,
            "full_reservoir_level": 642.00,
            "max_water_level": 645.00,
            "dead_storage_level": 615.00,
            "total_capacity_mcm": 560.00,
            "live_capacity_mcm": 90.00,
            "catchment_area_sqkm": 46900.00,
            "instrumentation": "Radar",
            "transmission_minutes": 15
        }
    ]

    print("Seeding production sites...")
    for data in sites_data:
        site = SiteMaster.objects.create(
            site_code=data["site_code"],
            station_name=data["station_name"],
            division=data["division"],
            basin=data["basin"],
            latitude=Decimal(str(data["latitude"])),
            longitude=Decimal(str(data["longitude"])),
            full_reservoir_level=Decimal(str(data["full_reservoir_level"])),
            max_water_level=Decimal(str(data["max_water_level"])),
            dead_storage_level=Decimal(str(data["dead_storage_level"])),
            total_capacity_mcm=Decimal(str(data["total_capacity_mcm"])),
            live_capacity_mcm=Decimal(str(data["live_capacity_mcm"])),
            catchment_area_sqkm=Decimal(str(data["catchment_area_sqkm"])),
            instrumentation=data["instrumentation"],
            transmission_minutes=data["transmission_minutes"],
            site_status="Active",
            functional=True
        )
        print(f"Created site: {site.station_name}")

        # Create an operator for each site
        operator_username = f"op_{site.site_code.lower().replace('-', '_')}"
        op = User.objects.create_user(
            username=operator_username,
            password='Password@123',
            full_name=f"{site.station_name} Operator",
            email=f"{operator_username}@bbmc.gov.in",
            role='operator',
            assigned_site=site,
            designation='Site Engineer',
            department='Dam Safety'
        )
        print(f"Created operator: {op.username}")

    print("Seeding complete.")

if __name__ == '__main__':
    purge_data()
    seed_data()
