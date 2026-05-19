# BBMC Dam Monitoring System — Credentials & Links

This project consists of a Django backend and a React (Vite) frontend.

## 🔗 Running Links
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Django Admin Panel**: [http://localhost:8000/admin](http://localhost:8000/admin)
- **API Root**: [http://localhost:8000/api/v1](http://localhost:8000/api/v1)

## 🔑 User Credentials

### 1. System Administrator
- **Username**: `admin_master`
- **Password**: `DamAdmin@2026`
- **Role**: Full access to site management, user management, and audit logs.

### 2. System User (Site Operator)
- **Username**: `system_user`
- **Password**: `systempassword`
- **Role**: Assigned to **Pong Dam**. Can submit new observations.

## 🛠️ Project Management

### Database Access
- **Type**: PostgreSQL
- **Host**: `127.0.0.1`
- **Port**: `5433`
- **DB Name**: `bbmc_dam_monitoring`
- **User**: `bbmc_user`
- **Pass**: `StrongPass@2024`

### Commands
- **Run Backend**: `python manage.py runserver` (within `backend` directory)
- **Run Frontend**: `npm run dev` (within `frontend` directory)
- **Reseed Data**: `python seed_production_data.py` (within `backend` directory)

---
*Note: This file was automatically generated for documentation purposes.*
