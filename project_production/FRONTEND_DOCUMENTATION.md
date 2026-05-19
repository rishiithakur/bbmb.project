# 💻 React SPA Dashboard - FRONTEND DOCUMENTATION

This document provides a comprehensive architectural guide to the **BBMB Dam Water Level Monitoring System** React/Vite frontend. It details the build system, directory architecture, styling design variables, GIS maps, and local hot-reloading configurations.

---

## 🏗️ High-Level Frontend Architecture

```
                       [Index.html (SPA Root File)]
                                    │
                                    ▼
                         [Main.tsx (Entry Script)]
                                    │
                                    ▼
                        [App.tsx (Root View Container)]
                                    │
                                    ▼
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
  [Global Stores] (Zustand)                            [Router (routes/)]
   ├── Auth Store (Session token)                       ├── Protected Routes (Users)
   └── Map Store (Coordinates)                          └── Public Routes (Login)
                                                               │
                                                               ▼
                                                      [Pages & Components]
                                                       ├── Dashboard (GIS Map)
                                                       ├── User Management
                                                       └── Site Form Logs
```

---

## 📂 Framework & Core Libraries

The frontend is built as a highly responsive, animated Single Page Application (SPA):

* **Vite**: The ultra-fast local bundler and HMR (Hot Module Replacement) compile manager.
* **React**: For modular, component-based view rendering.
* **TypeScript**: Provides static type safety and autocomplete definitions to prevent runtime UI crashes.
* **Zustand**: A lightweight, high-performance state manager that retains active user login profiles and map selection contexts across different page views.
* **React Leaflet (GIS Map)**: Directly binds Leaflet maps inside React to plot geographic stations, overlay colored ranges, and query spatial markers.
* **CSS Variable Styling**: Vanilla CSS theme engine featuring professional dark-mode variables, smooth animations, glassmorphism containers, and reactive site states.

---

## 📂 Structural Layout and Pages

### 1. `src/routes/` (Routing Gatekeepers)
File Location: [routes/](file:///d:/BBMC%20DAM%20WATER%20LEVEL%20MONITORING%20SYSTEM/frontend/src/routes/)
* **`ProtectedRoute.tsx`**: Checks if the user has a valid login session (token). If not, it redirects the browser to the `/login` portal.
* **`RoleRoute.tsx`**: Ensures only users with appropriate roles (e.g. administrative roles) can view management panels, routing unauthorized operators back to the main GIS map.

### 2. `src/pages/` (Visual Screens)
File Location: [pages/](file:///d:/BBMC%20DAM%20WATER%20LEVEL%20MONITORING%20SYSTEM/frontend/src/pages/)
* **`Login.tsx`**: Secure portal incorporating visual logo parameters, loading animations, and dynamic error prompts.
* **`Dashboard.tsx`**: The main monitor displaying the **GIS Map**, current observation status summary cards, system statistics, and active alarms.
* **`UserManagement.tsx`**: An administrative dashboard enabling admins to register operators, change user passwords, lock/unlock accounts, and assign operators to specific dam sites.
* **`AuditLogPage.tsx`**: Displays the active system changelog, tracking username, modified entity, timestamps, and network IP addresses.

### 3. `src/gis/` (Interactive GIS Leaflet Integration)
File Location: [gis/](file:///d:/BBMC%20DAM%20WATER%20LEVEL%20MONITORING%20SYSTEM/frontend/src/gis/)
* **`MapContainer.tsx`**: Initializes the base Leaflet map (centered over the BBMB region in Punjab/Himachal Pradesh) using high-resolution OpenStreetMap satellite/terrain tiling.
* **`SiteMarker.tsx`**: Renders custom SVG markers for each physical dam.
  * **Dynamic Color-Coding**:
    * **Normal Status (Blue)**: Water level is safely below warning levels.
    * **Warning Status (Orange)**: Water level has breached the site's Warning Elevation threshold.
    * **Danger Status (Red)**: Water level has breached the site's Danger Elevation threshold.
  * **Interactive Popup**: Clicking a station marker opens a styled popup displaying current crest status, warning thresholds, water levels, weather states, and an "Add Log" shortcut.

---

## ⚡ API Service Layer & Session Management

All backend communications are routed through a central helper client:

* **File Location**: [client.ts](file:///d:/BBMC%20DAM%20WATER%20LEVEL%20MONITORING%20SYSTEM/frontend/src/api/client.ts)
* **Bearer Authorization Injector**: An Axios interceptor automatically checks the local Zustand state. If an active session token exists, it attaches `Authorization: Bearer <JWT_Token>` to all outgoing API headers.
* **Authentication Flow**:
  1. A user enters their username and password in `Login.tsx`.
  2. The page posts these credentials to `/api/v1/auth/token/`.
  3. On success, the backend returns a JSON payload containing `access` (short-lived access token) and `refresh` (long-lived refresh token).
  4. The frontend saves these tokens in the global `auth.store.ts` (persisted in the browser's `localStorage` space).
  5. The router detects the saved session state and unlocks access to the private pages.

---

## 🎨 Premium Theme Variables & Glassmorphism Styling

All CSS styles originate from [index.css](file:///d:/BBMC%20DAM%20WATER%20LEVEL%20MONITORING%20SYSTEM/frontend/src/index.css). The system utilizes clean variables for quick rebranding:

```css
:root {
  --primary-color: #0c4a6e;      /* Deep Oceanic Navy */
  --primary-hover: #075985;
  --success-color: #059669;      /* Emerald Green */
  --warning-color: #d97706;      /* Amber Orange */
  --danger-color: #dc2626;       /* Warning Red */
  --bg-dark: #0f172a;            /* Slate Dark Background */
  --card-glass: rgba(30, 41, 59, 0.7); /* Translucent Backdrop */
  --border-glass: rgba(255, 255, 255, 0.08);
}
```

* **Micro-Animations**: All interactive buttons, sidebar links, and map markers feature smooth transitions (`transition: all 0.3s cubic-bezier(...)`) to give the interface a fluid, premium feel.
* **Responsive Layouts**: Grids are built using flexboxes and dynamic query calculations (`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`) to adapt seamlessly across diverse mobile screens, field tablets, and giant monitoring control room displays.
