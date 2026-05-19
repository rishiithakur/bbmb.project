# BBMB Dam Water Level Monitoring System (DWLMS)

Welcome to the production-ready repository for the **Bhakra Beas Management Board (BBMB) Dam Water Level Monitoring System**. 

This premium, enterprise-grade system provides high-fidelity geographical mapping, real-time water level observations, comprehensive telemetry, audit logs, and roles-based administrative management (Operators and Master Admins).

---

## 🏗️ Project Architecture

The codebase is structured to enforce clean concern separation, preparing both the frontend and backend for immediate cloud hosting:

```
project/
├── frontend/             # React (Vite) Single Page Application (SPA)
├── backend/              # Django REST Framework API
├── android_app/          # Android Mobile Application (PWA wrapper / native API client)
├── README.md             # System Deployment Guide
└── .gitignore            # Production-grade gitignore exclusions
```

---

## 🛠️ Local Development Setup

To spin up the complete development stack locally, follow these steps:

### 1. Backend (Django) Setup
1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```
2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Configure your local environment**:
   Copy `.env.example` to `.env` and configure your credentials:
   ```bash
   cp .env.example .env
   ```
5. **Run migrations & seed production database**:
   ```bash
   python manage.py migrate
   python manage.py runscript seed_production_data
   ```
6. **Start local Django API server**:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

### 2. Frontend (React/Vite) Setup
1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```
2. **Install node packages**:
   ```bash
   npm install
   ```
3. **Configure local environment**:
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   *For local development proxying, set `VITE_API_URL=''` to let Vite proxy requests to `http://localhost:8000` via relative `/api/v1` routes.*
4. **Launch Vite development server**:
   ```bash
   npm run dev
   ```

---

## 🚀 Cloud Deployment Instructions

### 1. Backend (Render Deployment)
To host the Django REST API on **Render.com**:
1. Create a new **Web Service** on Render and connect your GitHub repository.
2. Select environment: **Python 3**.
3. Set the directory path to **`backend`** (Build Root).
4. **Build Command**:
   ```bash
   python -m pip install -r requirements.txt && python manage.py collectstatic --no-input
   ```
5. **Start Command**:
   ```bash
   gunicorn bbmc_backend.wsgi
   ```
6. Under **Advanced Settings**, add the following **Environment Variables**:
   * `SECRET_KEY`: A secure random cryptographic string.
   * `DEBUG`: `False`
   * `ALLOWED_HOSTS`: `your-backend-app.onrender.com,localhost`
   * `CORS_ALLOWED_ORIGINS`: `https://your-frontend-app.vercel.app`
   * `DATABASE_URL`: Your production-grade PostgreSQL Connection URI (e.g. from Render DB, Neon, Supabase).

---

### 2. Frontend (Vercel Deployment)
To host the interactive React GIS dashboard on **Vercel**:
1. Import your repository into **Vercel**.
2. Set the **Root Directory** to `frontend`.
3. Set the **Framework Preset** to **Vite**.
4. In **Environment Variables**, configure:
   * `VITE_API_URL`: `https://your-backend-app.onrender.com/api/v1` (with **no** trailing slash).
5. Deploy. Vercel will automatically compile, optimize, and serve your frontend over a secure CDN.

---

## 📱 Android App Integration
The companion Android app is engineered to communicate with the central cloud database using the configured endpoints. 
* To map the mobile client to the new production system, update the base API target inside the Android app settings / local build configurations to use the production URL:
  `https://your-backend-app.onrender.com/api/v1/`

---

## 📦 Pushing to GitHub (First-time setup)

To push the codebase to your newly created GitHub repository, execute the following commands in the project root:

```bash
# Initialize git repository
git init

# Add all files (respecting .gitignore rules)
git add .

# Create the initial launch commit
git commit -m "feat(deploy): structure project for production-ready Render & Vercel hosting"

# Map to main branch
git branch -M main

# Add your GitHub remote URL
git remote add origin https://github.com/your-username/bbmb-dam-monitoring.git

# Push to GitHub
git push -u origin main
```

---

*© Bhakra Beas Management Board (BBMB) Dam Water Level Monitoring System. All rights reserved.*
