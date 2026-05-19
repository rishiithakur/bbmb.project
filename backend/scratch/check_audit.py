import os
import django
import sys

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bbmc_backend.settings")
django.setup()

from audit.models import AuditLog
print("AuditLog count:", AuditLog.objects.count())
if AuditLog.objects.exists():
    log = AuditLog.objects.first()
    print("First AuditLog:")
    print("Action:", log.action)
    print("Table Name:", log.table_name)
    print("Created At:", log.created_at)
else:
    print("No audit logs found.")
