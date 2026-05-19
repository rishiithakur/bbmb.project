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
        # Read the Site Master sheet, skip the technical design rows
        # Based on previous output, real data starts after about 30 rows of design info
        df_full = pd.read_excel(file_path, sheet_name='1. site_master', header=None)
        
        # Find the row that contains "Pong Dam" - that's where real data starts
        start_row = 0
        for i, row in df_full.iterrows():
            if "Pong Dam" in str(row.values):
                start_row = i
                break
        
        print(f"Detected real data starting at row {start_row}")
        
        # Now re-read from that row
        # Manual mapping based on inspection:
        # Col 0: ID, Col 1: Code, Col 2: Name, Col 3: Division, Col 4: Basin, Col 5: River, Col 6: Lat, Col 7: Long, Col 8: Type
        
        data_rows = df_full.iloc[start_row:]
        
        created_count = 0
        for _, row in data_rows.iterrows():
            name = str(row[2]).strip()
            if not name or name == 'nan' or name == 'station_name':
                continue
            
            code = str(row[1]).strip()
            division = str(row[3]).strip() if pd.notna(row[3]) else ''
            basin = str(row[4]).strip() if pd.notna(row[4]) else ''
            river = str(row[5]).strip() if pd.notna(row[5]) else ''
            
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
                full_reservoir_level=Decimal("0.0"), # We can update these if found
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
