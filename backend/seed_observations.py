import os
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from sites_master.models import SiteMaster
from observations.models import Observation
from accounts.models import User

def seed_sample_observations():
    print("Seeding sample observations...")
    sites = SiteMaster.objects.all()
    admin = User.objects.get(username='admin_master')
    
    if not sites:
        print("No sites found. Please run seed_production_data.py first.")
        return

    for site in sites:
        # Create 5 observations for each site (one per day for the last 5 days)
        for i in range(5):
            date = datetime.now().date() - timedelta(days=i)
            time = datetime.now().time()
            
            # Random water level around danger/warning levels
            base_level = float(site.warning_level or 400)
            current_level = base_level + random.uniform(-10, 20)
            
            # Finalize the latest one, others can be draft or final
            status = 'FINAL' if i == 0 else random.choice(['DRAFT', 'FINAL'])
            
            Observation.objects.create(
                site=site,
                observer=admin,
                observation_date=date,
                observation_time=time,
                current_water_level=Decimal(f"{current_level:.2f}"),
                total_inflow=Decimal(f"{random.uniform(500, 2000):.3f}"),
                total_outflow=Decimal(f"{random.uniform(400, 1800):.3f}"),
                live_storage=Decimal(f"{random.uniform(5000, 15000):.3f}"),
                percentage_full=Decimal(f"{random.uniform(60, 95):.2f}"),
                rainfall_today=Decimal(f"{random.uniform(0, 50):.2f}"),
                discharge_through_gates=Decimal(f"{random.uniform(100, 500):.3f}"),
                weather_condition=random.choice(['Clear', 'Cloudy', 'Rainy']),
                water_quality='Good',
                status=status
            )
        print(f"Seeded observations for site: {site.site_name}")

    print("Sample observations seeded successfully.")

if __name__ == '__main__':
    seed_sample_observations()
