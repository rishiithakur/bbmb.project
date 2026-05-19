# 🛡️ Access Control & Security Guidelines - SECURITY DOCUMENTATION

This document outlines the security architecture and defensive mechanisms implemented in the **BBMB Dam Water Level Monitoring System (DWLMS)** to protect data integrity, manage access roles, and secure the hosting environment.

---

## 🔒 Security Architecture Model

```
                    [Client Device]
                           │
                           ▼
             [HTTPS / TLS Layer (TLS 1.3)]
                           │
                           ▼
          [Allowed Hosts & CORS Filters]  ── (Blocks unauthorized domains)
                           │
                           ▼
        [JWT (JSON Web Token) Gateway]    ── (Verifies cryptographic signatures)
                           │
                           ▼
     [Role-Based Authorization Policies]  ── (Locks admin views to admins)
                           │
                           ▼
               [BCrypt Hashed Database]
```

---

## 🛡️ Key Security Features

### 1. Token-Based Authentication (JWT)
* **What it is**: The system uses JSON Web Tokens (JWT) instead of session cookies to authenticate users.
* **Why it exists**: Prevents Cross-Site Request Forgery (CSRF) vulnerabilities by storing sessions in JavaScript context rather than automatically-submitted cookies.
* **Key Settings**:
  * **Access Token Lifespan**: 1 Day (short-lived for security, customizable to minutes).
  * **Refresh Token Lifespan**: 7 Days (long-lived, stored securely to request fresh access tokens).
  * **Signing Mechanism**: HMAC-SHA256 signature signed using the backend's secret `SECRET_KEY`.

### 2. Password Hashing (BCrypt)
* **What it is**: Passwords are never saved in plain text. The database only stores cryptographic hashes generated using the BCrypt algorithm.
* **Why it exists**: If the database is compromised, attackers cannot read user passwords.
* **Key Settings**:
  * **Algorithm**: `BCryptSHA256PasswordHasher`
  * **Cost factor**: 12 computational rounds (slows down brute-force attacks while maintaining fast login speeds).

### 3. Role-Based Access Control (RBAC)
User permissions are strictly validated before processing any requests:

```
[Supreme Admin]  ──> Access to all sites, user creations, audit logs, and settings.
[Local Admin]    ──> Access to assigned site observations and local site operators.
[Operator]       ──> Access is strictly restricted to logging water levels for
                     their assigned station. Cannot access admin views.
```

* **How we handle this**: Custom permission classes (like `IsAdminUserOrReadOnly` in `accounts/permissions.py`) validate user roles directly inside Django views before executing database read/write queries.

### 4. Cross-Origin Resource Sharing (CORS) Protection
* **What it is**: Prevents other websites from making requests to the Django backend on behalf of a user.
* **How we handle this**: In production (`DEBUG=False`), we restrict API requests exclusively to a whitelisted frontend URL using `CORS_ALLOWED_ORIGINS` inside `settings.py`. All other domains are blocked.

### 5. Secure Host Filtering (`ALLOWED_HOSTS`)
* **What it is**: Blocks host header attacks by preventing Django from serving requests addressed to unexpected hostnames.
* **How we handle this**: `ALLOWED_HOSTS` is configured in production to explicitly accept only your designated backend domain (e.g. `*.onrender.com` or custom domains), blocking all other request hostnames.

---

## 🚀 Production Deployment Checklist

Before deploying the system to production, ensure these security configurations are set:

| Security Parameter | Production Setting | Purpose |
| :--- | :--- | :--- |
| **`DEBUG`** | `False` | Disables debug screens, which could expose source code or passwords on error. |
| **`SECURE_SSL_REDIRECT`** | `True` | Forces all connections to use secure HTTPS encryption. |
| **`SESSION_COOKIE_SECURE`** | `True` | Instructs browsers to send session cookies only over encrypted HTTPS connections. |
| **`CSRF_COOKIE_SECURE`** | `True` | Instructs browsers to send CSRF tokens only over encrypted HTTPS connections. |
| **`SECURE_HSTS_SECONDS`** | `31536000` | Tells browsers to remember to use HTTPS for at least one year. |
| **`SECRET_KEY`** | A strong, random string | Used to sign JWT sessions. Keep this secret. |

---

## 🔐 Environment Variables Blueprint
To keep secrets safe, all keys are loaded from system environment variables rather than hardcoded in the codebase:

```bash
# Example Production .env configuration
SECRET_KEY="production-only-long-cryptographic-hash-here"
DEBUG=False
DATABASE_URL="postgres://user:password@cloud-database-address:5432/db_name"
ALLOWED_HOSTS="bbmb-backend.onrender.com"
CORS_ALLOWED_ORIGINS="https://bbmb-monitoring.vercel.app"
```
