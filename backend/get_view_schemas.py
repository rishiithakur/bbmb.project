import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from django.db import connection

query = """
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('vw_site_latest_status', 'vw_gis_popup', 'vw_operator_site', 'vw_dashboard_summary', 'vw_full_entry_details')
ORDER BY table_name, ordinal_position;
"""

with connection.cursor() as cursor:
    cursor.execute(query)
    for row in cursor.fetchall():
        print(row)
