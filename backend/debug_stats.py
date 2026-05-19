import os
import django
from django.conf import settings
from django.utils import timezone
from django.db import models

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from observations.models import Observation
from sites_master.models import SiteMaster
from accounts.models import User

try:
    total_sites = SiteMaster.objects.filter(is_deleted=False).count()
    total_users = User.objects.filter(is_deleted=False).count()
    last_24h = Observation.objects.filter(is_deleted=False, created_at__gte=timezone.now() - timezone.timedelta(days=1)).count()
    
    # Alert Distributions
    red_alerts = Observation.objects.filter(is_deleted=False, status='FINAL', current_water_level__gte=models.F('site__danger_level')).count()
    yellow_alerts = Observation.objects.filter(is_deleted=False, status='FINAL', current_water_level__gte=models.F('site__warning_level'), current_water_level__lt=models.F('site__danger_level')).count()
    normal_sites = total_sites - red_alerts - yellow_alerts
    
    health_score = 100
    if total_sites > 0:
        health_score = max(0, 100 - (red_alerts * 10) - (yellow_alerts * 3))

    print(f"Total Sites: {total_sites}")
    print(f"Total Users: {total_users}")
    print(f"Last 24h: {last_24h}")
    print(f"Red Alerts: {red_alerts}")
    print(f"Yellow Alerts: {yellow_alerts}")
    print(f"Normal Sites: {normal_sites}")
    print(f"Health Score: {health_score}")

except Exception as e:
    import traceback
    print(traceback.format_exc())
