import sys
import requests

url = "http://localhost:8000/api/v1/auth/login/"
payload = {
    "username": "admin_master",
    "password": "DamAdmin@2026"
}

try:
    response = requests.post(url, json=payload, timeout=5)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("[SUCCESS] API Authentication verified successfully!")
        sys.exit(0)
    else:
        print(f"[ERROR] API Authentication failed with code {response.status_code}: {response.text}")
        sys.exit(1)
except Exception as e:
    print(f"[ERROR] Failed to connect to authentication server: {e}")
    sys.exit(1)
