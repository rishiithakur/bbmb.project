# 📂 BBMB Dam Monitoring System - PROJECT STRUCTURE

This document provides a highly detailed, beginner-friendly traversal of the **BBMB Dam Water Level Monitoring System** workspace. It explains exactly what each directory and critical file contains, why it exists, and how they connect.

---

## 🗺️ High-Level Directory Overview

```
d:\BBMC DAM WATER LEVEL MONITORING SYSTEM\
├── frontend/             # 💻 Frontend: React (Vite) Single Page Web Application
├── backend/              # ⚙️ Backend: Django REST Framework API Engine
├── android_app/          # 📱 Mobile: Companion Android application structure
└── project_production/   # 📘 Documentation: Professional developer & client guides
```

---

## 💻 1. Frontend Workspace Directory (`frontend/`)

The `frontend/` folder contains the interactive single-page application (SPA) loaded by users in their web browsers.

| Directory / File | Type | Purpose & Description |
| :--- | :--- | :--- |
| **`frontend/src/`** | Frontend | **Core Source Folder**: Houses all React code, styling, pages, state files, and components. |
| **`frontend/src/api/`** | Frontend | **API Service Layer**: Contains code that communicates with the Django backend. If modified incorrectly, the frontend won't be able to fetch telemetry data or log in users. |
| **`frontend/src/api/client.ts`** | Frontend | **API Base Client**: Initiates connection parameters and reads `VITE_API_URL`. If modified incorrectly, all frontend-to-backend API calls will fail. Dependents: All specific API modules. |
| **`frontend/src/components/`** | Frontend | **Reusable Components**: Houses UI elements used across multiple pages (e.g. `Navbar.tsx`, `Sidebar.tsx`, `ObservationViewerModal.tsx`). |
| **`frontend/src/features/`** | Frontend | **Functional Core Modules**: Contains UI sections dedicated to specific workflows, such as water level forms (`ObservationForm.tsx`) and historical logs. |
| **`frontend/src/gis/`** | Frontend | **Geographical Information Layer**: Contains `MapContainer.tsx` and `SiteMarker.tsx` which load the Leaflet GIS interactive map and plot dam coordinates. |
| **`frontend/src/pages/`** | Frontend | **Visual Screens**: Contains major user views like `Dashboard.tsx` (GIS monitoring), `Login.tsx`, `UserManagement.tsx`, `AuditLogPage.tsx`. Dependents: Router (`routes/index.tsx`). |
| **`frontend/src/routes/`** | Frontend | **System Router**: Configures routing paths and page locks. `ProtectedRoute.tsx` prevents anonymous users from viewing pages. `RoleRoute.tsx` locks operator controls to active operators only. |
| **`frontend/src/store/`** | Frontend | **State Management**: Uses Zustand to manage global states like user session status (`auth.store.ts`) and active map positions (`map.store.ts`). |
| **`frontend/src/types/`** | Frontend | **TypeScript Data Models**: Defines clear interfaces (`index.ts`) representing User roles, site structures, observations, and audit trails. |
| **`frontend/package.json`** | Frontend | **Dependencies & Build Scripts**: Defines required node modules and compilation tasks (`build`, `dev`). |
| **`frontend/vite.config.ts`** | Frontend | **Build & Proxy Settings**: Tells Vite how to compile code and proxies local `/api` paths to `http://localhost:8000`. |

---

## ⚙️ 2. Backend Workspace Directory (`backend/`)

The `backend/` folder contains the secure API backend server which interfaces with the database.

| Directory / File | Type | Purpose & Description |
| :--- | :--- | :--- |
| **`backend/bbmc_backend/`** | Backend | **Core Django Package**: Houses settings, root routing URLs, and gateway setups. |
| **`backend/bbmc_backend/settings.py`** | Backend | **System Configuration**: Controls security, allowed hosts, Postgres configurations, CORS, and middleware. *CRITICAL: If broken, the database will disconnect or the server will fail to start.* |
| **`backend/bbmc_backend/urls.py`** | Backend | **Root API Gateway**: Directs incoming requests to the appropriate Django apps (e.g. routing `/api/v1/auth/` to the accounts app). |
| **`backend/accounts/`** | Backend | **Authentication & Security App**: Manages users, permissions, JWT tokens, and branding images. |
| **`backend/accounts/models.py`** | Backend | **User Profiles & Roles**: Extends Django's system to define roles (`supreme_admin`, `admin`, `operator`). |
| **`backend/sites_master/`** | Backend | **Master Dam Site Catalog**: Holds database maps of physical dams, district names, coordinates, crest elevations, and warning/danger levels. |
| **`backend/observations/`** | Backend | **Observations Telemetry App**: Manages logged water level entries, weather conditions, inflow/outflow records, and validation states. |
| **`backend/audit/`** | Backend | **Audit Log Engine**: Automatically tracks all administrative changes (e.g. operator creation, site updates, password modifications) to comply with industrial safety standards. |
| **`backend/manage.py`** | Backend | **Django CLI Utility**: Standard executable script used to run migrations, seed data, and start the local API engine. |
| **`backend/requirements.txt`** | Backend | **Production Dependencies**: Lists all libraries needed for deployment (Django, Gunicorn, WhiteNoise, psycopg2, etc.). |

---

## 📱 3. Android Companion App Directory (`android_app/`)

This directory houses the mobile framework designed to let field operators log data directly from remote sites.

| Directory / File | Type | Purpose & Description |
| :--- | :--- | :--- |
| **`android_app/frontend-pwa/`** | Mobile | **Progressive Web App**: A mobile-optimized React client that can be installed directly on Android devices as a lightweight application. |
| **`android_app/builds/`** | Mobile | **Compiled APK Packages**: Pre-built Android debug executable files used for testing installations on Android emulators or physical mobile units. |
| **`android_app/docs/`** | Mobile | **Mobile Guidelines**: Guides developers on configuring system endpoints inside the mobile client for seamless synchronization. |

---

## 📘 4. Handover Documentation Directory (`project_production/`)

A centralized documentation folder housing client guides, architectural walkthroughs, and deployment blueprints.

| File | Type | Purpose & Description |
| :--- | :--- | :--- |
| **`START_HERE.md`** | Shared | **Universal Getting Started**: Local launch guides, dependency setup, and rapid system configuration. |
| **`PROJECT_STRUCTURE.md`** | Shared | **Workspace Directory Guide**: Detailed descriptions of core files and architectural layers. |
| **`BACKEND_DOCUMENTATION.md`**| Backend | **Django Core Blueprint**: Comprehensive explanation of settings, APIs, routing, and serializers. |
| **`FRONTEND_DOCUMENTATION.md`**| Frontend | **React SPA & Map Telemetry**: Walkthrough of page views, Leaflet GIS layers, and UI state models. |
| **`API_DOCUMENTATION.md`** | Shared | **Gateway Specification**: Full documentation of endpoints, parameters, and authentication tokens. |
| **`DATABASE_DOCUMENTATION.md`** | Backend | **PostgreSQL Relational Map**: Database schemas, foreign keys, and audit triggers. |
| **`SECURITY_DOCUMENTATION.md`** | Shared | **Encryption & Access Hardening**: Walkthrough of JWT tokens, password hashing, CORS, and SSL. |
| **`DEPLOYMENT_GUIDE.md`** | Shared | **Cloud DevOps Playbook**: Step-by-step launch instructions for Render, Vercel, and cloud databases. |
| **`CLIENT_HANDOVER_GUIDE.md`** | Shared | **Maintenance & Operations**: Maintenance guides, server costs, credentials logs, and handbook. |

---

## ⚠️ Safe Development Practices & Warnings

> [!CAUTION]
> * **Do NOT delete `__init__.py` files**: These are empty files in backend folders. They tell Python that the folder contains a package. If removed, Django will fail to resolve imports.
> * **Do NOT change variable names in `settings.py`**: Values like `ALLOWED_HOSTS` or `DATABASES` are parsed by Django core. Spelling errors will crash the entire environment.
> * **Keep `import.meta.env.VITE_API_URL` intact**: This handles dynamic backend switching between local development and cloud production. Modifying this directly inside React code will break Vercel client builds.
