# BBMC Monitoring System: Isolated Mobile-First Workspace Walkthrough

This document outlines the complete set of implementations, architectural decisions, and configurations created inside the isolated `/android-app/` development workspace. The original production web application remains completely untouched as a stable benchmark.

---

## 1. Accomplished Implementations & Customizations

### A. Isolated Workspace Scaffolding
Created a standalone sandbox in `/android-app/` with the following clean structural boundaries:
- `/android-app/frontend-pwa/` — Contains the mobile-optimized, standalone React web application and Capacitor bindings.
- `/android-app/builds/` — Dedicated target directory for build distributions.
  - `/android-app/builds/pwa/` — Compiled production PWA static files, completely self-contained.
  - `/android-app/builds/apk/` — Destination folder for native Android package binaries.
- `/android-app/docs/` — Technical documentation and assets.

### B. Progressive Web App (PWA) Conversion
Configured `vite-plugin-pwa` in `vite.config.ts` using a custom Workbox caching strategy specifically designed for remote, low-connectivity dam field surveys:
- **Application Name**: `BBMC DWLMS` (Short Name: `BBMC`)
- **Theme & Brand Aesthetics**: Primary `#0f3b63` bar colors, full dark mode variables, and glassmorphic overlays.
- **Offline Geospatial Support**: Added dynamic, client-side caching filters for OpenStreetMap GIS tile engines (`tile.openstreetmap.org/*.png`) and public Google font APIs (`fonts.googleapis.com` / `fonts.gstatic.com`), preserving offline map styling.
- **Asset precaching threshold extension**: Elevated `maximumFileSizeToCacheInBytes` to `5MB` to support caching high-fidelity dam imagery and localized structural diagnostics.

### C. Glassmorphic PWA Install Banner
Created `src/components/PWAInstallPrompt.tsx` to hook into browser-level `beforeinstallprompt` events:
- Automatically detects if the application is run inside a standard browser context and can be installed.
- Renders a visually premium, slide-up install bar with custom branding, an install CTA, and a dismiss button.

### D. Capacitor Integration & Native Android Configuration
- Added native platform bindings supporting `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android`.
- Customized `/android-app/frontend-pwa/android/app/src/main/AndroidManifest.xml` to include critical field capabilities:
  - **Fine Location Permissions**: `android.permission.ACCESS_FINE_LOCATION` and `android.permission.ACCESS_COARSE_LOCATION` to enable precise GPS dam-station mapping.
  - **Hardware GPS Support**: `android.hardware.location.gps` feature declaration.
  - **Camera Capabilities**: `android.permission.CAMERA` and storage permissions to support real-time dam structural damage photography.
  - **Cleartext HTTP support**: Added `android:usesCleartextTraffic="true"` to facilitate local networking testing against active Django API backend servers during development cycles.

### E. Adaptive Icon Asset Scaling Pipeline
Developed a custom Python PIL image-processing utility at `/android-app/scratch/generate_android_assets.py` to convert `logo.png` into perfectly rescaled native Android resources:
- Generates **Square Launcher Icons** (`ic_launcher.png`) for all system densities.
- Generates **Circular Adaptive Icons** (`ic_launcher_round.png`) for modern Android launcher interfaces.
- Distributes assets directly to resources:
  - `mipmap-mdpi` (48x48)
  - `mipmap-hdpi` (72x72)
  - `mipmap-xhdpi` (96x96)
  - `mipmap-xxhdpi` (144x144)
  - `mipmap-xxxhdpi` (192x192)

---

## 2. Compilation and Build Instructions

The isolated workspace includes built-in automation pipelines within `package.json` to compile PWA distributions and compile native Android binaries.

### A. Compile Progressive Web App (PWA)
Generates the production distribution and copies it into `/android-app/builds/pwa/`:
```bash
cd "/android-app/frontend-pwa"
npm run build:pwa
```
*Note: This task executes successfully with a 100% clean exit code.*

### B. Compile Native Android Package (APK)
Automated commands to sync Capacitor wrapper assets and assemble standard debug or release APK formats:
```bash
# Compile and copy Debug APK to /android-app/builds/apk/
npm run build:apk-debug

# Compile and copy Release APK to /android-app/builds/apk/
npm run build:apk-release
```

> [!WARNING]
> **Android SDK Dependency**
>
> Running the APK compilation commands natively requires the Android SDK and build tools installed on your operating system.
> If the Android SDK is not detected on the build host (yielding `SDK location not found`), follow these quick steps:
> 1. Install [Android Studio](https://developer.android.com/studio) to automatically configure SDK platforms.
> 2. Define the path in `/android-app/frontend-pwa/android/local.properties`:
>    ```properties
>    sdk.dir=C\:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
>    ```

---

## 3. Native APK Build Verification & Real-Device Testing

The compilation pipeline is fully operational. A successful compilation of `app-debug.apk` was executed directly on the host using your active Android SDK.

### A. Generated Artifact
* **Primary Output Path**: [app-debug.apk](file:///d:/BBMC%20DAM%20WATER%20LEVEL%20MONITORING%20SYSTEM/android-app/builds/apk/app-debug.apk) (approx. 9.64 MB)
* **Status**: Complete, Signed, and Verified.

---

### B. Steps to Install & Test on a Physical Mobile Phone

Follow these sequential steps to install the APK on your device and establish a connection to your development environment:

#### 1. Transfer the APK to Your Phone
* Connect your Android phone to your laptop via USB cable.
* Drag and drop the `app-debug.apk` from the output folder into your phone's internal storage (e.g., the `Download` folder).
* *Alternative*: Send the APK to your phone using email, Bluetooth, or local sharing tools.

#### 2. Install Natively
* On your phone, open the **Files** manager app, navigate to `Downloads`, and tap on `app-debug.apk`.
* Allow "Install from unknown sources" if prompted by Android's security settings, and proceed with the installation.
* Launch the `BBMC DWLMS` application from your app list.

#### 3. Establish Backend Connectivity

You have **two options** to connect the Android app to your development Django server:

##### Option A: Cloudflare Public Tunnel (Zero-Config, Recommended)
Your mobile workspace is currently pre-configured to communicate via a secure Cloudflare Tunnel endpoint:
`https://held-equilibrium-sealed-sunrise.trycloudflare.com/api/v1`

* **How to run**:
  1. On your laptop, boot your local Django backend server:
     ```bash
     python manage.py runserver
     ```
  2. Open a separate terminal and start your Cloudflare tunnel pointing to local port `8000`:
     ```bash
     cloudflared tunnel --url http://localhost:8000
     ```
  3. Ensure your phone has active mobile data or WiFi. The APK will instantly communicate with your laptop backend across the internet without any firewall issues!

##### Option B: Direct Local WiFi IP (Offline-Ready)
To test purely over a private local network:
* **How to run**:
  1. Find your laptop's IPv4 address via command line:
     ```powershell
     ipconfig
     ```
     *(e.g., `192.168.1.50`)*
  2. Open [android-app/frontend-pwa/.env](file:///d:/BBMC%20DAM%20WATER%20LEVEL%20MONITORING%20SYSTEM/android-app/frontend-pwa/.env) and change the base API URL to point directly to your laptop's WiFi IP address:
     ```properties
     VITE_API_BASE_URL=http://192.168.1.50:8000/api/v1
     ```
  3. Recompile the APK so the hardcoded API address updates inside the bundle:
     ```bash
     npm run build:apk-debug
     ```
  4. Copy and reinstall the new `app-debug.apk` to your phone.
  5. Start your Django backend bound to all interfaces on port `8000`:
     ```bash
     python manage.py runserver 0.0.0.0:8000
     ```
  6. Ensure both your phone and laptop are connected to the exact same WiFi network. The phone will connect directly to your laptop's IP!
