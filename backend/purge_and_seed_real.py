import os
import django
import pandas as pd

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from sites.models import SiteMaster
from users.models import UserMaster
from observations.models import WaterLevelLog, DamObservation
from audit.models import AuditLog

def purge_fake_data():
    print("Purging fake data...")
    # Delete observations first (foreign keys)
    DamObservation.objects.all().delete()
    WaterLevelLog.objects.all().delete()
    # Delete sites
    SiteMaster.objects.all().delete()
    # Delete non-superuser audit logs
    AuditLog.objects.all().delete()
    print("Fake data purged.")

def seed_real_data():
    file_path = r"D:\BBMC DAM WATER LEVEL MONITORING SYSTEM\Dam_WaterLevel_DB_Design.xlsx"
    try:
        # Read the Site Master sheet
        # Looking at previous output, real headers are in row 8 (index 7) or similar.
        # Let's read and skip rows to find the table.
        df = pd.read_excel(file_path, sheet_name='1. site_master', skiprows=7)
        
        # Clean column names
        df.columns = [
            'site_id', 'site_code', 'station_name', 'division', 'basin', 'river', 
            'lat_raw', 'long_raw', 'dam_type', 'frl', 'functional'
        ]
        
        # Drop rows where station_name is NaN
        df = df.dropna(subset=['station_name'])
        
        print(f"Found {len(df)} real sites in Excel.")
        
        for _, row in df.iterrows():
            # Basic parsing
            try:
                # Some lat/long might be strings or numbers
                lat = float(row['lat_raw'])
                lng = float(row['long_raw'])
            except:
                lat = 31.0 # Default if fail
                lng = 76.0

            SiteMaster.objects.create(
                site_code=str(row['site_code']).strip(),
                station_name=str(row['station_name']).strip(),
                division=str(row['division']).strip() if pd.notna(row['division']) else '',
                basin=str(row['basin']).strip() if pd.notna(row['basin']) else '',
                latitude=lat,
                longitude=lng,
                dam_type=str(row['dam_type']).strip() if pd.notna(row['dam_type']) else 'Gauge Site',
                full_reservoir_level=float(row['frl']) if pd.notna(row['frl']) else 0,
                functional=True if str(row['functional']).lower() == 'true' else False,
                state='Himachal Pradesh',
                site_status='Active'
            )
            print(f"Created real site: {row['station_name']}")

        # Ensure admin exists
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
            print("Admin user verified.")

    except Exception as e:
        print(f"Error seeding real data: {e}")

if __name__ == '__main__':
    purge_fake_data()
    seed_real_data()
