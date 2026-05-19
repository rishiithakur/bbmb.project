import time
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from accounts.models import User
from django.contrib.auth import authenticate
from django.db import connection

print("=== 1. DB QUERY TIMING ===")
t0 = time.time()
try:
    user = User.objects.get(username='admin_master')
    db_time = time.time() - t0
    print(f"DB lookup time: {db_time:.3f}s  -->  Found: {user.username} / Role: {user.role}")
except Exception as e:
    print(f"DB lookup FAILED in {time.time()-t0:.3f}s: {e}")

print()
print("=== 2. SQL QUERIES EXECUTED ===")
for q in connection.queries:
    print(f"  [{q['time']}s] {q['sql'][:120]}")

print()
print("=== 3. authenticate() / bcrypt TIMING ===")
t1 = time.time()
result = authenticate(username='admin_master', password='DamAdmin@2026')
auth_time = time.time() - t1
status = "SUCCESS" if result else "FAIL - wrong password"
print(f"authenticate() time: {auth_time:.3f}s  -->  {status}")

print()
print("=== 4. DIAGNOSIS ===")
if auth_time > 5:
    print("CRITICAL: authenticate() took over 5s - bcrypt iterations too high or CPU bottleneck")
elif auth_time > 1:
    print("WARNING: authenticate() is slow (>1s). Expected under 0.5s for bcrypt cost 12.")
else:
    print("OK: Authentication speed is normal.")

print()
print("=== 5. PASSWORD HASHER INFO ===")
from django.conf import settings
hashers = getattr(settings, 'PASSWORD_HASHERS', ['django.contrib.auth.hashers.PBKDF2PasswordHasher'])
print(f"Active hasher: {hashers[0]}")

# Check what algorithm is stored for admin_master
raw_hash = user.password
algo = raw_hash.split('$')[0] if raw_hash else 'unknown'
print(f"Hash stored for admin_master: algorithm={algo}, full prefix={raw_hash[:30]}...")

print()
print("=== 6. DB CONNECTION INFO ===")
from django.conf import settings as cfg
db = cfg.DATABASES['default']
print(f"HOST: {db['HOST']}")
print(f"PORT: {db['PORT']}")
print(f"NAME: {db['NAME']}")
print(f"CONN_MAX_AGE: {db.get('CONN_MAX_AGE', 0)}s")
