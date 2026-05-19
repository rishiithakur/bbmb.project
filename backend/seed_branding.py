import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from accounts.models import SystemBranding

def seed_branding():
    # Paths to the images
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    logo_path = os.path.join(base_dir, 'pics', 'og logo.png')
    bg_path = os.path.join(base_dir, 'pics', 'background pic.png')

    branding, created = SystemBranding.objects.get_or_create(key='current')

    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as f:
            branding.logo_data = f.read()
            branding.logo_name = 'og logo.png'
            branding.logo_mimetype = 'image/png'
        print(f"Logo seeded from {logo_path}")
    else:
        print(f"Warning: Logo not found at {logo_path}")

    if os.path.exists(bg_path):
        with open(bg_path, 'rb') as f:
            branding.background_data = f.read()
            branding.background_name = 'background pic.png'
            branding.background_mimetype = 'image/png'
        print(f"Background seeded from {bg_path}")
    else:
        print(f"Warning: Background not found at {bg_path}")

    branding.save()
    print("System Branding saved to database successfully.")

if __name__ == '__main__':
    seed_branding()
