# 🚀 BBMB Dam Water Level Monitoring System (DWLMS) - START HERE

Welcome to the **Bhakra Beas Management Board (BBMB) Dam Water Level Monitoring System (DWLMS)** production documentation. This is the master entry point for developers, DevOps engineers, and clients. 

This guide will explain how to set up the system locally, where to deploy it in production, and how to avoid common pitfalls.

---

## 🏗️ What is the BBMB Dam Monitoring System?
The BBMB DWLMS is a modern, enterprise-grade telemetry and visualization platform. It allows operators at physical dam sites (like Bhakra, Pong, and Pandoh) to log water level measurements, inflow/outflow telemetry, and weather conditions. This data is instantly synchronized with a central administrative dashboard where engineers can monitor live statuses on a **Leaflet GIS Map**, configure alerts, audit data entry, and manage user roles.

---

## 📂 The Most Important Directories

The project is structured logically into three separate components:

```
d:\BBMC DAM WATER LEVEL MONITORING SYSTEM\
├── frontend/             # The interactive React GIS dashboard (Vite-powered SPA)
├── backend/              # The Django REST Framework API, handling logic and auth
├── android_app/          # The mobile PWA/Android wrapper for operators in the field
└── project_production/   # 📍 YOU ARE HERE - Comprehensive system documentation
```

### 1. `frontend/` (Frontend Application)
* **What it is**: The user interface (UI) that users see in their web browsers.
* **Why it exists**: To render the interactive map, show statistics, process operator entries, and manage administrative settings.
* **Main Tech**: React.js, TypeScript, Vite, Tailwind CSS, Leaflet Maps.

### 2. `backend/` (Backend API Server)
* **What it is**: The central database communicator, brain, and security controller of the system.
* **Why it exists**: It exposes secure endpoints (APIs) for the frontend and mobile apps, authenticates logins, saves observations, and logs audit logs.
* **Main Tech**: Python 3, Django, Django REST Framework, PostgreSQL.

### 3. `android_app/` (Mobile Companion App)
* **What it is**: The lightweight field application designed for mobile devices.
* **Why it exists**: Allows physical dam operators to submit water levels directly from the site without using a desktop.

---

## 🛠️ Required Third-Party Services
To run the production stack, you need accounts/instances on the following cloud providers:

1. **GitHub**: For storing and version-controlling the source code.
2. **Vercel**: For hosting the compiled React Frontend (includes static global CDN).
3. **Render**: For hosting the live Django REST API backend service.
4. **Hosted PostgreSQL Database**: (e.g., Render PostgreSQL, Supabase, Neon, or AWS RDS) to store dam observations, telemetry logs, and user profiles.

---

## 💻 Running the System Locally

Follow these instructions to run the entire system on your development machine:

### Step 1: Clone & Configure Backend (Django)
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\activate

   # macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment configuration template:
   ```bash
   cp .env.example .env
   ```
   *Note: In local development, the fallback database configuration is automatically routed to PostgreSQL port `5433` (Db: `bbmc_dam_monitoring`, User: `bbmc_user`, Password: `StrongPass@2024`). Make sure your local Postgres database is running.*
5. Run database migrations to construct the tables:
   ```bash
   python manage.py migrate
   ```
6. Seed the official Bhakra Beas dam stations into your local database:
   ```bash
   python manage.py runscript seed_production_data
   ```
7. Reset the master administrator password:
   ```bash
   python manage.py runscript reset_admin
   ```
   *This ensures `admin_master` has the password `DamAdmin@2026`.*
8. Start the local server:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

---

### Step 2: Configure & Launch Frontend (React/Vite)
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the necessary node modules:
   ```bash
   npm install
   ```
3. Copy the frontend environment variables template:
   ```bash
   cp .env.example .env
   ```
   *By default, `VITE_API_URL` is left empty `''` in development. This automatically triggers Vite's integrated server proxy to route all `/api/v1` traffic to `http://localhost:8000` locally, completely avoiding CORS issues.*
4. Start the Vite hot-reloading development server:
   ```bash
   npm run dev
   ```
5. Open your web browser and navigate to the local portal:
   `http://localhost:5173/`

---

## 🚫 Common Mistakes to Avoid (Troubleshooting)

### 1. Database Port Conflict (`5432` vs `5433`)
* **Problem**: Standard PostgreSQL installs default to port `5432`. However, the BBMB local development cluster is configured to communicate over port `5433` to prevent conflicts with other local databases.
* **Solution**: Ensure your local Postgres service is listening on port `5433` or edit your local backend `.env` file to set `DATABASE_URL=postgres://bbmc_user:StrongPass@2024@localhost:5432/bbmc_dam_monitoring`.

### 2. Missing Virtual Environment
* **Problem**: Installing requirements directly on your system Python instead of activating the local virtual environment. This leads to module resolution errors.
* **Solution**: Always activate the virtual environment (`.\venv\Scripts\activate`) before running any `manage.py` commands.

### 3. Login Failure on First Attempt
* **Problem**: Trying to log in with fake operator names or unhashed passwords.
* **Solution**: Use the verified developer credentials configured in the database:
  * **Master Admin Username**: `admin_master`
  * **Password**: `DamAdmin@2026`
  * **Operator Username**: `pandoh_op` (or `pong_op`, `rishii_op`, `moin_op`, `dubbling_op`)
  * **Operator Password**: `Operator@2024`

### 4. Direct API Path Hardcoding in Frontend
* **Problem**: Writing `http://localhost:8000/api/v1/...` inside frontend code. When deployed to Vercel, this makes requests fail because the user's browser cannot find `localhost` over the internet.
* **Solution**: Always use the relative proxy URL `/api/v1/...` in frontend requests, or use the dynamic `VITE_API_URL` environment variable which is fetched dynamically via the `client.ts` hook.

---

## 🚀 Quick Deployment Reference
* **Backend**: Push to GitHub, hook up **Render.com** to the `/backend` folder, and configure static file bundling via `whitenoise`.
* **Frontend**: Hook up **Vercel.com** to the `/frontend` directory, set target framework to Vite, and configure `VITE_API_URL` pointing to your Render server.

*Refer to `DEPLOYMENT_GUIDE.md` for a comprehensive step-by-step walkthrough.*
