# 🌐 REST API Gateway - API DOCUMENTATION

This document defines the complete REST API specification for the **BBMB Dam Water Level Monitoring System (DWLMS)** version `v1` endpoint cluster. 

Developers building companion clients, custom integrations, or mobile Android apps must conform to these schemas.

---

## 🔒 Security & Request Headers

All request bodies must be sent as `application/json`.
Every protected API endpoint requires the client to inject an active JWT access token in the HTTP Request Headers:

```http
Authorization: Bearer <Your_JWT_Access_Token>
Content-Type: application/json
```

---

## 📦 API Endpoints Directory

### 1. Authentication Endpoints (`/api/v1/auth/`)

Used for logging in, refreshing access tokens, and retrieving active session profiles.

#### 📝 A. Request Login Token
* **Endpoint**: `/api/v1/auth/token/`
* **HTTP Method**: `POST`
* **Description**: Exchanges user credentials for a JWT access token and refresh token.
* **JSON Request Payload**:
  ```json
  {
    "username": "pandoh_op",
    "password": "Operator@2024"
  }
  ```
* **JSON Response Output (200 OK)**:
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJyb2xlIjoib3BlcmF0b3IiLCJleHAiOjE3NzkxNzk2MDB9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJyb2xlIjoib3BlcmF0b3IiLCJleHAiOjE3NzkyNjYwMDB9..."
  }
  ```

#### 📝 B. Refresh Expired Access Token
* **Endpoint**: `/api/v1/auth/token/refresh/`
* **HTTP Method**: `POST`
* **Description**: Submits a saved refresh token to receive a fresh short-lived access token, avoiding the need for users to re-enter their passwords.
* **JSON Request Payload**:
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJyb2xlIjoib3BlcmF0b3IiLCJleHAi..."
  }
  ```
* **JSON Response Output (200 OK)**:
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fresh_access_token_payload..."
  }
  ```

#### 📝 C. Retrieve User Session Details
* **Endpoint**: `/api/v1/auth/me/`
* **HTTP Method**: `GET`
* **Description**: Fetches the profile and site authorization boundaries of the logged-in user.
* **JSON Response Output (200 OK)**:
  ```json
  {
    "id": 2,
    "username": "pandoh_op",
    "email": "pandoh@bbmb.gov.in",
    "role": "operator",
    "assigned_site": {
      "id": 3,
      "name": "Pandoh Dam",
      "district": "Mandi"
    }
  }
  ```

---

### 2. Dam Stations Master (`/api/v1/sites/`)

Enables client dashboards to retrieve locations, warning levels, and historical data.

#### 📝 A. Retrieve Stations List
* **Endpoint**: `/api/v1/sites/`
* **HTTP Method**: `GET`
* **Description**: Returns all five registered BBMB stations along with their coordinates and telemetry configurations.
* **JSON Response Output (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "name": "Bhakra Dam",
      "district": "Bilaspur",
      "basin": "Sutlej",
      "latitude": "31.41000",
      "longitude": "76.43500",
      "crest_elevation": 515.110,
      "warning_level": 500.000,
      "danger_level": 512.000,
      "latest_water_level": 489.550,
      "latest_inflow": 28400.00,
      "latest_outflow": 25100.00,
      "status": "NORMAL"
    }
  ]
  ```

---

### 3. Water Observations Log (`/api/v1/observations/`)

Handles logging and validating water level telemetry data.

#### 📝 A. Submit a Water Observation Log
* **Endpoint**: `/api/v1/observations/`
* **HTTP Method**: `POST`
* **Description**: Enables authenticated operators to submit fresh telemetry logs.
* **JSON Request Payload**:
  ```json
  {
    "site": 3,
    "water_level": 491.250,
    "inflow": 12500.00,
    "outflow": 11800.00,
    "weather_condition": "RAINY",
    "remarks": "Inflow rising slowly due to catchment precipitation."
  }
  ```
* **JSON Response Output (210 Created)**:
  ```json
  {
    "id": 142,
    "site": 3,
    "water_level": "491.250",
    "inflow": "12500.000",
    "outflow": "11800.000",
    "weather_condition": "RAINY",
    "logged_by": "pandoh_op",
    "status": "SUBMITTED",
    "timestamp": "2026-05-19T13:20:00Z"
  }
  ```

#### 📝 B. Retrieve Observations List
* **Endpoint**: `/api/v1/observations/`
* **HTTP Method**: `GET`
* **Description**: Returns all historical observations, with options to filter by `site` or `status`.
* **URL Filter Query Scheme**: `/api/v1/observations/?site=3&status=SUBMITTED`

---

## 📱 Android App Integration Guideline

To connect a companion Android application to the backend API:

1. **Use Retrofit / OkHttp Client**: Build API connections using secure networking clients in Kotlin/Java.
2. **Handle Bearer Token Interceptor**: Store access and refresh tokens locally in encrypted Android storage (`EncryptedSharedPreferences`). Use an interceptor to automatically attach `Authorization: Bearer <Token>` headers to all API calls.
3. **Endpoint URLs Configuration**: Ensure the Android app points to the production server URL (e.g. `https://bbmb-backend.onrender.com`) instead of local address references.
4. **Offline Caching**: If network signals are weak at remote dam sites, queue observations in a local Android database (like SQLite/Room) and auto-sync them to `/api/v1/observations/` once a connection is re-established.
