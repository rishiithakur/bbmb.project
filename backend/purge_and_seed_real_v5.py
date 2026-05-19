import os
import django
import pandas as pd
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from sites.models import SiteMaster
from users.models import UserMaster
from observations.models import WaterLevelLog, DamObservation
from audit.models import AuditLog

def purge_fake_data():
    print("Purging fake data...")
    DamObservation.objects.all().delete()
    WaterLevelLog.objects.all().delete()
    SiteMaster.objects.all().delete()
    AuditLog.objects.all().delete()
    print("Fake data purged.")

def seed_real_data():
    file_path = r"D:\BBMC DAM WATER LEVEL MONITORING SYSTEM\Dam_WaterLevel_DB_Design.xlsx"
    try:
        df = pd.read_excel(file_path, sheet_name='1. site_master', header=None)
        target_sites = ["Pong Dam", "Pandoh Dam", "Moin Bridge", "Dubbling Bridge", "Sujanpur"]
        
        created_count = 0
        for i, row in df.iterrows():
            name = str(row[2]).strip()
            if name in target_sites:
                code = str(row[1]).strip()
                division = str(row[3]).strip() if pd.notna(row[3]) else ''
                basin = str(row[4]).strip() if pd.notna(row[4]) else ''
                
                try:
                    lat = float(row[6]) if pd.notna(row[6]) else 31.0
                    lng = float(row[7]) if pd.notna(row[7]) else 76.0
                except:
                    lat, lng = 31.0, 76.0

                SiteMaster.objects.create(
                    site_code=code,
                    station_name=name,
                    division=division,
                    basin=basin,
                    latitude=Decimal(str(lat)),
                    longitude=Decimal(str(lng)),
                    dam_type=str(row[8]).strip() if pd.notna(row[8]) else 'Gauge Site',
                    functional=True,
                    state='Himachal Pradesh',
                    site_status='Active'
                )
                print(f"Created real site: {name}")
                created_count += 1

        print(f"Total real sites created: {created_count}")

        UserMaster.objects.get_or_create(
            username='admin',
            defaults={
                'full_name': 'System Administrator',
                'email': 'admin@bbmc.gov.in',
                'role': 'admin',
                'is_superuser': True,
                'is_staff': True
            }
        )
        print("Admin user verified.")

    except Exception as e:
        print(f"Error seeding real data: {e}")

if __name__ == '__main__':
    purge_fake_data()
    seed_real_data()
