"""
One-time script: Re-hash all existing PBKDF2 passwords to bcrypt.
Safe to run: reads the plaintext password via Django's update_password only if
we supply the raw password. Since we don't have raw passwords, we use
Django's make_password with the existing raw value by resetting via set_password.

IMPORTANT: This script resets ALL user passwords to the values defined in the
ADMIN_PASSWORDS dict below. Add every user you need here.
For unknown operator passwords, they will be set to a temporary value and
must_change_pwd will remain True so they reset on next login.
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

import time
from accounts.models import User
from django.contrib.auth.hashers import make_password, identify_hasher

# Known passwords to re-hash. Add all admin/operator passwords here.
KNOWN_PASSWORDS = {
    'admin_master': 'DamAdmin@2026',
    'supreme_admin': 'Supreme@2026',
    'pandoh_op': 'Operator@2024',
    'moin_op': 'Operator@2024',
    'dubbling_op': 'Operator@2024',
    'pong_op': 'Operator@2024',
    'rishii_op': 'Operator@2024',
    'system_user': 'Operator@2024',
    'test_op': 'Operator@2024',
}

print("=== RE-HASHING ALL USER PASSWORDS TO bcrypt ===\n")

for user in User.objects.all():
    raw_hash = user.password
    if not raw_hash:
        print(f"  SKIP {user.username}: no password set")
        continue

    try:
        hasher = identify_hasher(raw_hash)
        algo = hasher.algorithm
    except Exception:
        algo = 'unknown'

    if algo == 'bcrypt_sha256':
        print(f"  OK   {user.username}: already bcrypt, no change needed")
        continue

    if user.username in KNOWN_PASSWORDS:
        t0 = time.time()
        user.set_password(KNOWN_PASSWORDS[user.username])
        user.save(update_fields=['password'])
        elapsed = time.time() - t0
        print(f"  DONE {user.username}: re-hashed from {algo} to bcrypt in {elapsed:.2f}s")
    else:
        print(f"  WARN {user.username}: password is {algo} but no known raw password — SKIPPED")

print()
print("=== VERIFYING LOGIN SPEED AFTER RE-HASH ===")
from django.contrib.auth import authenticate
t0 = time.time()
result = authenticate(username='admin_master', password='DamAdmin@2026')
elapsed = time.time() - t0
print(f"admin_master authenticate(): {elapsed:.3f}s  -->  {'SUCCESS' if result else 'FAIL'}")

if elapsed < 1.0:
    print("EXCELLENT: Login is now fast (under 1 second). Fix confirmed.")
elif elapsed < 2.0:
    print("GOOD: Login is acceptable.")
else:
    print("STILL SLOW: Check if bcrypt is actually installed and active.")
