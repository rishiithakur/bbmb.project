import os
import django
import random
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from sites.models import SiteMaster

def create_real_data():
    real_stations = [
        {
            'site_code': 'BHK001',
            'station_name': 'Bhakra Dam',
            'division': 'Bhakra Dam Division',
            'basin': 'Sutlej',
            'state': 'Himachal Pradesh',
            'latitude': 31.411000,
            'longitude': 76.433000,
            'dam_type': 'Concrete Gravity',
            'full_reservoir_level': 1680.000,
            'max_water_level': 1685.000,
            'dead_storage_level': 1462.000,
            'total_capacity_mcm': 9621.000,
            'live_capacity_mcm': 7191.000,
            'catchment_area_sqkm': 56980.000,
            'site_status': 'Active',
            'functional': True,
        },
        {
            'site_code': 'PNG001',
            'station_name': 'Pong Dam',
            'division': 'Pong Dam Division',
            'basin': 'Beas',
            'state': 'Himachal Pradesh',
            'latitude': 31.967000,
            'longitude': 75.950000,
            'dam_type': 'Earthfill',
            'full_reservoir_level': 1400.000,
            'max_water_level': 1421.000,
            'dead_storage_level': 1260.000,
            'total_capacity_mcm': 8570.000,
            'live_capacity_mcm': 7290.000,
            'catchment_area_sqkm': 12560.000,
            'site_status': 'Active',
            'functional': True,
        },
        {
            'site_code': 'PND001',
            'station_name': 'Pandoh Dam',
            'division': 'Pandoh Dam Division',
            'basin': 'Beas',
            'state': 'Himachal Pradesh',
            'latitude': 31.667000,
            'longitude': 77.067000,
            'dam_type': 'Earth and Rockfill',
            'full_reservoir_level': 2941.000,
            'max_water_level': 2950.000,
            'dead_storage_level': 2880.000,
            'total_capacity_mcm': 41.000,
            'live_capacity_mcm': 18.000,
            'catchment_area_sqkm': 5278.000,
            'site_status': 'Active',
            'functional': True,
        }
    ]

    # Generate additional dummy sites to reach ~50
    basins = ['Sutlej', 'Beas', 'Ravi', 'Chenab', 'Yamuna']
    divisions = ['Bhakra Dam Division', 'Pong Dam Division', 'Pandoh Dam Division', 'Shimla Division', 'Mandi Division']
    
    for i in range(1, 48):
        code = f'STN{i:03d}'
        lat = 31.0 + random.uniform(0, 2.0)
        lng = 76.0 + random.uniform(0, 2.0)
        real_stations.append({
            'site_code': code,
            'station_name': f'Monitoring Station {code}',
            'division': random.choice(divisions),
            'basin': random.choice(basins),
            'state': 'Himachal Pradesh',
            'latitude': lat,
            'longitude': lng,
            'dam_type': 'Check Dam',
            'full_reservoir_level': random.uniform(1000, 3000),
            'max_water_level': random.uniform(1000, 3000),
            'dead_storage_level': random.uniform(900, 2900),
            'total_capacity_mcm': random.uniform(10, 500),
            'live_capacity_mcm': random.uniform(5, 400),
            'catchment_area_sqkm': random.uniform(100, 5000),
            'site_status': 'Active',
            'functional': True,
        })

    for data in real_stations:
        site, created = SiteMaster.objects.update_or_create(
            site_code=data['site_code'],
            defaults=data
        )
        if created:
            print(f"Site created: {site.station_name}")
        else:
            print(f"Site updated: {site.station_name}")

if __name__ == '__main__':
    create_real_data()
