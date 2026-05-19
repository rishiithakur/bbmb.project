# 📘 Executive Operations & Handover Manual - CLIENT HANDOVER GUIDE

This document serves as the executive handover guide for the **Bhakra Beas Management Board (BBMB)** directors, administrative officers, and IT personnel. 

It explains how to manage, maintain, and support the system in production.

---

## 📋 Executive Project Summary

The **BBMB Dam Water Level Monitoring System (DWLMS)** modernizes water resource management by replacing manual paper logs with an instant telemetry reporting pipeline. 

### Key Features Delivered:
1. **Interactive GIS Map**: Live mapping of all five BBMB dam stations with dynamic color-coding based on water levels relative to warning thresholds.
2. **Role-Based Workflows**: Restricts operator access to data entry for their assigned station, while giving administrators centralized oversight.
3. **Robust Security**: Uses industry-standard JWT sessions, secure password hashing, and active CORS firewalls.
4. **Complete Audit Trails**: Automatically logs administrative changes to meet compliance and safety standards.

---

## ⚙️ Daily System Administration Guide

Administrators can manage the system through either the React dashboard or the Django admin panel:

### 1. Registering New Operators
1. Log in to the React portal using admin credentials.
2. Navigate to **User Management** in the sidebar.
3. Click **Add User**, enter their credentials, set their role to `operator`, and assign them to their designated dam site.
4. Click **Save**.

### 2. Lock/Unlock an Operator's Account
* If an operator leaves or loses their device, administrators can toggle the **Active Status** in the User Management list. Setting status to `Disabled` blocks all login attempts and invalidates current session tokens immediately.

### 3. Modifying Warning & Danger Elevation Levels
* If crest guidelines change:
  1. Log in to the Django admin panel (`https://bbmb-backend.onrender.com/admin/`).
  2. Navigate to **SiteMasters** and select the station (e.g. Bhakra Dam).
  3. Update the **Warning Level** or **Danger Level** decimal values.
  4. Save. The React GIS map updates instantly with the new thresholds.

---

## 🛠️ Routine Maintenance Schedule

To keep the system running reliably, your IT department should follow this maintenance checklist:

### 1. Weekly Database Backups
* **Action**: Configure daily or weekly automated database backups on your database provider dashboard (e.g., Supabase or Render DB).
* **Retention Policy**: Retain weekly database backups for at least 3 months to safeguard against accidental deletions or data loss.

### 2. Quarterly Security & Audit Log Reviews
* **Action**: Navigate to the **Audit Logs** view to review administrative changes, monitoring for unauthorized logins, password modifications, or site adjustments.

### 3. Annual Session Token Key Rotations
* **Action**: Change the backend `SECRET_KEY` once a year.
* **Effect**: Rotating this key invalidates all current session tokens, requiring all active users to log in again. This protects against long-term token leaks.

---

## 💸 Expected Hosting Cost Projections

The system is optimized to operate efficiently on cost-effective cloud infrastructure. Below is a budget breakdown:

| Cloud Service | Infrastructure Role | Estimated Monthly Cost | Purpose |
| :--- | :--- | :--- | :--- |
| **Vercel** | React SPA Frontend Hosting | **$0.00** (Hobby Tier) | Hosts static compiled React assets on a global CDN. |
| **Render** | Django Python Web Service | **$7.00** (Starter Tier) | Keeps the API server active 24/7. |
| **Supabase / Neon** | Managed PostgreSQL Database | **$0.00 - $15.00** (Starter) | Secure hosted relational database with automated backups. |
| **Total Estimated Budget** | **Entire System Operations** | **~$7.00 - $22.00 / Month** | High-performance, secure production hosting. |

---

## 🔐 Credentials Handover Log (Placeholders)

Fill in your deployed production access details below:

```yaml
Production React Portal: "https://your-domain.vercel.app/"
Production API Endpoint: "https://your-domain.onrender.com/"
Django Admin URL:        "https://your-domain.onrender.com/admin/"

Master Admin Username:  "admin_master"
Master Admin Password:  "DamAdmin@2026"

PostgreSQL Console URL:  "https://your-database-provider-dashboard.com"
Database Port:           5432
Database Name:           "bbmc_dam_monitoring"
```
> [!WARNING]
> Keep this document secure and never commit actual production passwords to public GitHub repositories. Use the Render and Vercel environment variables managers to handle credentials securely.
