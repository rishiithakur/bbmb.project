# 🚀 Cloud Deployment Manual - DEPLOYMENT GUIDE

This document provides step-by-step instructions for deploying the **BBMB Dam Water Level Monitoring System (DWLMS)** to production. 

It explains how to configure **Render** (backend), **Vercel** (frontend), and a hosted **PostgreSQL database**.

---

## 🏗️ Production Deployment Pipeline

```
 [Local Machine] ──(Push Code)──> [GitHub Repository]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     [Vercel Cloud Platform]                          [Render Cloud Platform]
   (Hosts the React SPA Frontend)                 (Hosts the Django REST API Backend)
                 │                                               │
                 ▼                                               ▼
         [Users' Browsers] <───────(HTTPS Rest APIs)───────> [PostgreSQL DB]
```

---

## 🗄️ Step 1: Hosted PostgreSQL Database Setup

The backend requires an external PostgreSQL database. You can host this on services like **Render (PostgreSQL)**, **Supabase**, **Neon**, or **AWS RDS**.

1. Create a new PostgreSQL database instance on your chosen host.
2. Select your hosting region (e.g. `ap-south-1` / Mumbai for optimal speeds in India).
3. Copy the **External Connection String**. It should look like this:
   `postgres://username:password@hostname:5432/database_name?sslmode=require`

---

## ⚙️ Step 2: Backend Deployment on Render

Render will host the Django REST API backend and execute migrations on every git push.

### 1. Create a Web Service
1. Log in to **Render.com** and click **New > Web Service**.
2. Connect your **GitHub Repository**.
3. Configure these settings:
   * **Name**: `bbmb-backend`
   * **Region**: `Singapore` or `Mumbai` (close to India for low latency).
   * **Root Directory**: `backend` (Points Render directly to the Django sub-directory).
   * **Environment**: `Python 3`
   * **Build Command**:
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --no-input
     ```
   * **Start Command**:
     ```bash
     gunicorn bbmc_backend.wsgi:application
     ```

### 2. Configure Environment Variables
Navigate to the **Environment** tab on Render and add the following keys:

| Key | Value | Notes |
| :--- | :--- | :--- |
| **`SECRET_KEY`** | `A-Long-Cryptographic-Secret-Key` | Keep this secure. |
| **`DEBUG`** | `False` | Disables debug mode for safety in production. |
| **`DATABASE_URL`** | `postgres://your_postgresql_connection_string` | Copy this from Step 1. |
| **`ALLOWED_HOSTS`** | `bbmb-backend.onrender.com` | Your Render service domain. |
| **`CORS_ALLOWED_ORIGINS`**| `https://bbmb-monitoring.vercel.app` | Your Vercel frontend domain (from Step 3). |

---

## 💻 Step 3: Frontend Deployment on Vercel

Vercel will compile and host the React single-page frontend.

### 1. Import Project
1. Log in to **Vercel.com** and click **Add New > Project**.
2. Connect your **GitHub Repository**.
3. Configure these settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend` (Points Vercel directly to the React sub-directory).
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`

### 2. Configure Environment Variables
Add the following key under the Project Settings variables tab:

| Key | Value | Notes |
| :--- | :--- | :--- |
| **`VITE_API_URL`** | `https://bbmb-backend.onrender.com` | Points the React client to your deployed Render backend API. |

Click **Deploy**! Vercel will compile the React code and host the SPA on a global CDN.

---

## 🚚 Post-Deployment Database Initialization

Once the Render backend is live, run these commands to set up the database:

### 1. Execute Database Migrations
On the **Render Dashboard**, open the Web Service **Shell** tab and run:
```bash
python manage.py migrate
```

### 2. Seed Official Station Directories
Populate the database with the five official BBMB dam stations:
```bash
python manage.py runscript seed_production_data
```

### 3. Create Administrator Credentials
Seed the master administrator credentials:
```bash
python manage.py runscript reset_admin
```
* **Master Admin Username**: `admin_master`
* **Password**: `DamAdmin@2026`

---

## 📈 Continuous Integration & Continuous Deployment (CI/CD)

The system is configured with an automated CI/CD pipeline:
* **Render Auto-Deploy**: Render monitors your connected GitHub repository. Pushing changes to the `main` branch triggers Render to fetch the updates, compile assets, and deploy the new version without downtime.
* **Vercel Auto-Deploy**: Pushing changes to the `main` branch triggers Vercel to automatically rebuild and deploy the React frontend.
