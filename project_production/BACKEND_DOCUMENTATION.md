# ⚙️ Django API Server - BACKEND DOCUMENTATION

This document provides a comprehensive architectural guide to the **BBMB Dam Water Level Monitoring System** Django backend. It explains the structure, configuration files, internal app flow, and integration processes.

---

## 🏗️ High-Level Backend Flow Diagram

```
[Incoming Request]
        │
        ▼
 [WSGI / Gunicorn]  ── (Handles HTTP Web Gateway Requests)
        │
        ▼
   [Middleware]     ── (Enforces CORS, Parses Cookies & Security Settings)
        │
        ▼
   [API Router]     ── (Resolves URL paths like '/api/v1/observations/')
        │
        ▼
     [Views]        ── (Contains business logic & enforces Active User Permissions)
        │
        ▼
  [Serializers]     ── (Validates incoming JSON and converts models to JSON outputs)
        │
        ▼
     [Models]       ── (Communicates with local/hosted PostgreSQL database)
```

---

## 📂 Core Configuration Files

### 1. `settings.py` (The Backend Brain)
File Location: [settings.py](file:///d:/BBMC%20DAM%20WATER%20LEVEL%20MONITORING%20SYSTEM/backend/bbmc_backend/settings.py)
* **What it does**: Controls all configurations, modules, and integrations for the backend server.
* **Key Sections**:
  * **Environment Loader**: Uses `python-dotenv` to read configurations from an `.env` file (e.g. `SECRET_KEY`, `DEBUG`).
  * **Database Integration**: Parses `DATABASE_URL` dynamically using `dj-database-url`. If not present, automatically routes connections to the local PostgreSQL database on port `5433`.
  * **Installed Apps**: Registers Django core modules alongside our custom apps (`accounts`, `sites_master`, `observations`, `audit`).
  * **Middleware Stack**: Registers security headers, session handlers, **CORS headers** (`django-cors-headers`), and **WhiteNoise** for compiled static asset delivery.
  * **BCrypt Password Hasher**: Uses `BCryptSHA256PasswordHasher` (with cost level 12) to ensure high-security credential hashing and avoid system loading delays.

### 2. `urls.py` (The Routing Gateway)
File Location: [urls.py](file:///d:/BBMC%20DAM%20WATER%20LEVEL%20MONITORING%20SYSTEM/backend/bbmc_backend/urls.py)
* **What it does**: Acts as the backend traffic controller. It checks incoming URL paths and routes them to the correct application view.
* **Api Versioning**: All production API endpoints are cleanly versioned under `/api/v1/` (e.g., `/api/v1/auth/token/`, `/api/v1/observations/`).

### 3. `wsgi.py` (Web Server Gateway Interface)
File Location: [wsgi.py](file:///d:/BBMC%20DAM%20WATER%20LEVEL%20MONITORING%20SYSTEM/backend/bbmc_backend/wsgi.py)
* **What it does**: The communication bridge that allows web servers (like Nginx, Apache, or Gunicorn) to serve the Python-based Django application.
* **Why it exists**: Gunicorn uses this file in production (`gunicorn bbmc_backend.wsgi`) to run the backend as a reliable multi-threaded system.

---

## 📂 Django Application Modules

The system's features are broken down into four distinct, self-contained Django apps:

### 1. `accounts` (Authentication & Security)
* **Role**: Handles user registrations, administrative role groups (`supreme_admin`, `admin`, `operator`), password resets, and portal logo/branding assets.
* **Custom Models**: `User` (extends standard Django User), `SystemBranding` (manages local site logo and layout settings).
* **Permissions Hook**: Defines `IsAdminUserOrReadOnly` and `IsOperatorUserOnly` parameters to lock API access.

### 2. `sites_master` (GIS Stations Directory)
* **Role**: The authority catalog of all five BBMB monitored stations (Bhakra, Pong, Pandoh, etc.).
* **Custom Models**: `SiteMaster`.
* **Telemetry Fields**: Latitude, longitude, Crest Elevation (meters), Warning Level (meters), Danger Level (meters), District, and Basin names.

### 3. `observations` (Water Level Telemetry logs)
* **Role**: Tracks and validates dam water logs submitted by operators.
* **Custom Models**: `Observation`, `ObservationPhoto` (binary attachments for site validations).
* **Validation Statuses**: `DRAFT`, `SUBMITTED`, `VERIFIED`.

### 4. `audit` (System Audit Logging)
* **Role**: Automatically records security-relevant operations for regulatory compliance.
* **Custom Models**: `AuditLog`.
* **Data Logged**: Target action, performing user, timestamp, IP address, and details of fields updated.

---

## ⚙️ How Code Layers Interact (Models ➔ Serializers ➔ Views)

To make an API endpoint work, Django links three essential code layers:

### 1. The Model Layer (`models.py`)
* **Purpose**: Defines database tables using Python objects.
* **Example**:
  ```python
  class Observation(models.Model):
      site = models.ForeignKey(SiteMaster, on_delete=models.CASCADE)
      water_level = models.DecimalField(max_digits=7, decimal_places=3)
      logged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
      timestamp = models.DateTimeField(auto_now_add=True)
  ```

### 2. The Serializer Layer (`serializers.py`)
* **Purpose**: Acts as the validator and translator. When data is received, it validates that values are correct (e.g. checks that water level is positive). When sending data, it translates Python database models into JSON text.
* **Example**:
  ```python
  class ObservationSerializer(serializers.ModelSerializer):
      class Meta:
          model = Observation
          fields = ['id', 'site', 'water_level', 'logged_by', 'timestamp']
  ```

### 3. The View Layer (`views.py`)
* **Purpose**: Enforces access permissions (e.g. checks that only authenticated operators can submit new data) and triggers database read/write queries.
* **Example**:
  ```python
  class ObservationViewSet(viewsets.ModelViewSet):
      queryset = Observation.objects.all().order_by('-timestamp')
      serializer_class = ObservationSerializer
      permission_classes = [permissions.IsAuthenticated]
  ```

---

## 🌐 Dynamic Database, CORS, & Asset Collection

### 1. PostgreSQL Integration
To support heavy industrial workloads, the server binds to a PostgreSQL database. In local development, it connects to port `5433`. In production, the system automatically checks for a `DATABASE_URL` environment variable and binds to the cloud database (e.g. hosted on Render or Supabase) seamlessly.

### 2. Cross-Origin Resource Sharing (CORS) Setup
Because the React frontend (`https://your-frontend.vercel.app`) runs on a different domain than the Django API backend (`https://your-backend.onrender.com`), the browser will automatically block API requests due to security protocols.
* **How we handle this**: We installed `django-cors-headers` and configured `CORS_ALLOWED_ORIGINS` dynamically inside `settings.py`. This explicitly tells the browser that requests from your Vercel domain are authorized and secure.

### 3. Static Assets & WhiteNoise
Django does not natively serve static assets (CSS, JS, admin images) in production mode (`DEBUG=False`).
* **How we handle this**: We integrated **WhiteNoise Middleware** immediately following Django's security layer. When you run `python manage.py collectstatic --no-input`, all assets are gathered into `/backend/staticfiles/` and served directly by Python with Gzip compression.
