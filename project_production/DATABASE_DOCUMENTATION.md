# 🗄️ PostgreSQL Schema Design - DATABASE DOCUMENTATION

This document defines the database architecture, table relationships, schemas, and relational constraints of the **BBMB Dam Water Level Monitoring System (DWLMS)** production database.

---

## 🗺️ Entity Relationship (ER) Structural Map

```
             ┌─────────────────────────┐
             │      accounts_user      │
             ├─────────────────────────┤
             │ PK: id                  │
             │ username                │
             │ password                │
             │ role (admin/operator)   │
             │ FK: assigned_site_id    │ ──┐
             └─────────────────────────┘   │
                          │                │
                          │                │ (Assigned to Site)
                          │ (Logs Data)    │
                          ▼                ▼
┌─────────────────────────┐   ┌───────────────────────────┐
│observations_observation │   │ sites_master_sitemaster   │
├─────────────────────────┤   ├───────────────────────────┤
│ PK: id                  │   │ PK: id                    │
│ FK: site_id             │──>│ name                      │
│ water_level (decimal)   │   │ crest_elevation           │
│ inflow (decimal)        │   │ warning_level             │
│ outflow (decimal)       │   │ danger_level              │
│ FK: logged_by_id        │   │ latitude / longitude      │
└─────────────────────────┘   └───────────────────────────┘
```

---

## 🗂️ Database Tables & Field Specifications

### 1. User Profiles & Sessions Table (`accounts_user`)
* **Purpose**: Extends Django's default user model to manage roles and map operators to specific dam sites.
* **Fields**:
  * `id` (`BIGINT`, Primary Key, Auto-Increment)
  * `username` (`VARCHAR(150)`, Unique, Indexed)
  * `password` (`VARCHAR(128)`, Hashed via BCrypt)
  * `email` (`VARCHAR(254)`)
  * `role` (`VARCHAR(20)`, Options: `supreme_admin`, `admin`, `operator`)
  * `assigned_site_id` (`INTEGER`, Foreign Key referencing `sites_master_sitemaster`, Nullable)
  * `is_active` (`BOOLEAN`, Defaults to `TRUE`. Enables locking/unlocking accounts)
  * `is_staff` (`BOOLEAN`, Defaults to `FALSE`. Controls Django admin panel access)

### 2. Monitored Dam Stations Table (`sites_master_sitemaster`)
* **Purpose**: Holds information for all registered BBMB stations.
* **Fields**:
  * `id` (`INTEGER`, Primary Key, Auto-Increment)
  * `name` (`VARCHAR(100)`, Unique, Indexed)
  * `district` (`VARCHAR(100)`)
  * `basin` (`VARCHAR(100)`)
  * `latitude` (`DECIMAL(9, 6)`)
  * `longitude` (`DECIMAL(9, 6)`)
  * `crest_elevation` (`DECIMAL(7, 3)`, Units: Meters)
  * `warning_level` (`DECIMAL(7, 3)`, Units: Meters)
  * `danger_level` (`DECIMAL(7, 3)`, Units: Meters)

### 3. Water Telemetry Observations Table (`observations_observation`)
* **Purpose**: Stores historical observation data submitted by operators.
* **Fields**:
  * `id` (`BIGINT`, Primary Key, Auto-Increment)
  * `site_id` (`INTEGER`, Foreign Key referencing `sites_master_sitemaster`, `ON DELETE CASCADE`)
  * `water_level` (`DECIMAL(7, 3)`, Units: Meters)
  * `inflow` (`DECIMAL(10, 3)`, Units: Cusecs)
  * `outflow` (`DECIMAL(10, 3)`, Units: Cusecs)
  * `weather_condition` (`VARCHAR(20)`, Default: `SUNNY`)
  * `remarks` (`TEXT`, Nullable)
  * `logged_by_id` (`BIGINT`, Foreign Key referencing `accounts_user`, `ON DELETE SET_NULL`, Nullable)
  * `status` (`VARCHAR(20)`, Defaults to `SUBMITTED`, Options: `DRAFT`, `SUBMITTED`, `VERIFIED`)
  * `timestamp` (`TIMESTAMP WITH TIME ZONE`, Auto-generated on insertion, Indexed)

### 4. Administrative Security Trails Table (`audit_auditlog`)
* **Purpose**: Logs system administrative changes for security audit compliance.
* **Fields**:
  * `id` (`BIGINT`, Primary Key, Auto-Increment)
  * `action` (`VARCHAR(100)`)
  * `performed_by_id` (`BIGINT`, Foreign Key referencing `accounts_user`, `ON DELETE SET_NULL`, Nullable)
  * `details` (`JSONB`, Key-value store of modified attributes and differences)
  * `ip_address` (`VARCHAR(45)`, Supports IPv4 and IPv6)
  * `timestamp` (`TIMESTAMP WITH TIME ZONE`, Auto-generated on insertion)

---

## 🔒 Constraints, Cascades, & Data Integrity Rules

To keep database records clean and consistent, we enforce standard relational rules:

1. **Station Lockout (Foreign Key `ON DELETE CASCADE`)**:
   * If a station record is deleted from the `SiteMaster` table, all associated observations for that station are automatically deleted to prevent orphaned records.
2. **Operator Deletion Integrity (Foreign Key `ON DELETE SET_NULL`)**:
   * If an operator user account is deleted, their associated observation entries remain intact for historical records, with the logger field set to `NULL`.
3. **Decimal Field Precision Constraints**:
   * Measurements are stored with high precision (`decimal_places=3`) to record values down to single-millimeter accuracies. This is critical for assessing warning states.
4. **Active Indexed Lookups**:
   * The `timestamp` column on observations is indexed (`db_index=True`) to ensure historical records load quickly as database sizes scale up.
