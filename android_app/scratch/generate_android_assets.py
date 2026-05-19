from PIL import Image, ImageOps, ImageDraw
import os

# Source files
logo_path = r"d:\BBMC DAM WATER LEVEL MONITORING SYSTEM\android-app\frontend-pwa\public\assets\logo.png"
res_path = r"d:\BBMC DAM WATER LEVEL MONITORING SYSTEM\android-app\frontend-pwa\android\app\src\main\res"

sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192
}

# Open source logo
img = Image.open(logo_path)

# Generate square and round launcher icons
for folder, size in sizes.items():
    folder_path = os.path.join(res_path, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    # Resize square icon
    square_img = img.resize((size, size), Image.Resampling.LANCZOS)
    square_img.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
    print(f"Generated square launcher icon for {folder} ({size}x{size})")
    
    # Resize and crop to circle for round icon
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    
    round_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    round_img.paste(square_img, (0, 0), mask)
    round_img.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")
    print(f"Generated round launcher icon for {folder} ({size}x{size})")

print("Android launcher icons successfully generated!")
