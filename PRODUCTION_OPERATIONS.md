# VANVAS Production Infrastructure & Operations Guide

## 1. Production Topology & Architecture

| Layer | Deployment Platform | Production URL | Branch / Source |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel Edge / Next.js | `https://vanvasai.vercel.app` | `main` (`/frontend`) |
| **Backend API** | Render Web Service | `https://vanvas-api.onrender.com` | `main` (`/backend`) |
| **Primary Database** | Render PostgreSQL | `oregon-postgres.render.com` / `ohio` | Managed PostgreSQL |
| **Source Control** | GitHub | `https://github.com/AbhirajSingh25/Vanvas` | `main` |

### Backend Render Service Configuration
- **Service Name**: `vanvas-api`
- **Environment**: Python 3.11+
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health/ready`
- **Auto Deploy**: Enabled on pushes to `main` branch

---

## 2. Database Persistence & Expiration Lifecycle Risk

### Current Database State
- The production database is **Render Managed PostgreSQL** running on a free-tier instance.
- Connection string is injected via the `DATABASE_URL` environment variable and normalized by `app.database.session.normalize_database_url` to use `postgresql+psycopg2://`.
- **SQLite is strictly prohibited in production** via `@model_validator` in `app.core.config.Settings.validate_production_security`.

### Free-Tier Expiration Risk & Policy
> [!WARNING]
> Render free PostgreSQL instances have an expiration lifecycle (typically 30–90 days from creation). When the instance reaches its lifecycle cutoff, Render automatically suspends and eventually deletes the instance if not upgraded.

### Action Plan Before Expiration:
1. **Durable Database Upgrade**: Migrate the database to a persistent, durable tier (Render Starter PostgreSQL at $7/mo or Neon Serverless PostgreSQL / AWS RDS).
2. **Scheduled Backups**: Execute regular database dumps using `pg_dump` prior to any major upgrade or renewal window.
3. **Connection String Swap**: When provisioning the permanent instance, update `DATABASE_URL` in the Render dashboard. The backend application will automatically execute non-destructive schema migrations and seed canonical datasets on first boot without data loss.

---

## 3. Geographic Region & Database Latency Analysis

### Current Region Layout
- **Backend API Service**: Singapore (`sin`)
- **Managed PostgreSQL Database**: Ohio (`us-east-2`)

### Measured Latency Breakdown
- **In-Memory Process Liveness (`/health`)**: ~1,100ms (Client → Singapore Cloudflare Edge → Render Container)
- **Multi-Query Diagnostics (`/api/v1/health/diagnostics`)**: ~2,750ms (cross-continent SQL query round-trips)
- **Direct Database RTT**: ~210ms per SQL round-trip between Singapore and Ohio.

### Infrastructure Recommendation
- For optimal response times (< 200ms API latency), **collocate both the backend Web Service and PostgreSQL database in the same geographic region** (e.g. both in `singapore` or both in `oregon`/`ohio`).
- Collocation will eliminate over 90% of cross-continental database latency.

---

## 4. Health Checks & Service Readiness Semantics

| Endpoint | Semantic Purpose | Typical Response | HTTP Codes |
| :--- | :--- | :--- | :--- |
| `GET /health` | **Liveness Probe**: Confirms API process is running in memory. | `{"status": "healthy", "service": "vanvas-core-api", "version": "1.0.0", "git_revision": "..."}` | 200 |
| `GET /health/ready` | **Readiness Probe**: Validates DB connection, schema migration status, and canonical inventory baseline (>= 26 destinations, >= 208 places, >= 104 hotels, >= 53 rentals). | `{"status": "ready", "database": "connected", "inventory": {...}}` | 200 (Ready)<br>503 (Not Ready) |
| `GET /api/v1/health/diagnostics` | **Operational Diagnostics**: Safe telemetry verifying table row counts, map provider, auth config without exposing credentials. | `{"status": "operational", "database": {"engine": "postgresql", "counts": {...}}}` | 200 |

### Render Health Check Configuration
Render Web Service Health Check path is set to `/health/ready`.
- If the database is unreachable or table counts fall below canonical baselines, `/health/ready` returns **HTTP 503**, preventing Render from routing live traffic to an unready container.

---

## 5. Startup & Seed Reliability

The application startup lifecycle in `app/main.py` is governed by an asynchronous `lifespan` manager:
1. **Schema Migration (`ensure_database_schema`)**: Executes additive, dialect-agnostic column migrations (`destinations`, `users`, `user_preferences`, `mobility_providers`, and performance indexes) without dropping existing data.
2. **Canonical Seeding (`seed_database`)**:
   - Idempotently verifies the 26 canonical destinations, 208 verified places, 104 hotels, and 53 rentals.
   - Matches records strictly by stable canonical slug/ID.
   - **Never overwrites primary keys** or deletes foreign-key referenced entities.
   - Preserves all user trips, expenses, preferences, reviews, bookings, and invitations.
3. **Readiness Assertion**: The app only marks itself `ready` when startup completes without critical exceptions.

---

## 6. Environment Variables & Security Matrix

| Variable | Requirement | Production Value / Pattern |
| :--- | :--- | :--- |
| `ENVIRONMENT` | **Required** | `production` |
| `DATABASE_URL` | **Required** | `postgresql+psycopg2://user:pass@host:5432/dbname` |
| `SECRET_KEY` | **Required** | High-entropy 64-character secret key (Dev defaults prohibited) |
| `BACKEND_CORS_ORIGINS` | **Required** | `["https://vanvasai.vercel.app","https://vanvas.vercel.app","https://vanvas.in","https://www.vanvas.in"]` |
| `APP_PUBLIC_URL` | **Required** | `https://vanvasai.vercel.app` |
| `AI_PROVIDER` | Optional | `gemini` |
| `EMAIL_PROVIDER` | Optional | `brevo` |
| `STORAGE_PROVIDER` | Optional | `auto` (Cloudinary / S3 / Base64 DB fallback) |
| `PLACE_ARTWORK_PROVIDER`| Optional | `disabled` |
| `IMAGE_PROVIDER` | Optional | `curated` |

### Frontend (`frontend/.env.production`)
- `NEXT_PUBLIC_API_URL`: `https://vanvas-api.onrender.com/api/v1` (Proxied via `next.config.ts` rewrites for same-origin client requests).

---

## 7. Cold Start & Ephemeral Storage Architecture

### Cold Start Management
- Render free instances spin down after 15 minutes of inactivity.
- Frontend API client (`frontend/lib/api.ts`) is configured with a **45,000ms (45-second) timeout** and graceful error detection:
  `"Request timed out while connecting to VANVAS servers. The server might be waking up; please try again in a few moments."`
- No artificial hammering or aggressive polling loops are used.

### Ephemeral Storage & User Uploads
- Render containers have an ephemeral filesystem; local files written to disk are wiped on container restart or redeploy.
- `StorageService` (`app/services/storage_service.py`) provides:
  1. **Preset Avatars**: Stored in static assets and loaded instantly by slug.
  2. **Durable Cloudinary / S3 Storage**: Used when cloud credentials are provided.
  3. **Database-backed / Base64 fallback**: Profile avatars and travel data persist safely in the PostgreSQL database across all redeploys.

---

## 8. Backup, Restore, Rollback & Disaster Recovery

### Creating a Production Database Backup
Run from a machine with PostgreSQL client tools:
```bash
pg_dump -Fc --no-acl --no-owner -d "$DATABASE_URL" -f "vanvas_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Restoring from Backup
```bash
pg_restore --clean --no-acl --no-owner -d "$DATABASE_URL" "vanvas_backup_YYYYMMDD_HHMMSS.dump"
```

### Application Deployment Rollback
1. In the Render Dashboard, navigate to **vanvas-api** > **Deploys**.
2. Select the last known good commit and click **Rollback to this deploy**.
3. In GitHub, revert the offending commit:
   ```bash
   git revert <bad-commit-hash>
   git push origin main
   ```
4. Verify service readiness at `https://vanvas-api.onrender.com/health/ready`.

---

## 9. Production Release Safety Sequence

Prior to declaring any release valid:
1. **Git Checkpoint**: Ensure clean working tree and tag commit (`git status`, `git rev-parse HEAD`).
2. **Automated Backend Tests**: Run full suite (`python -m pytest tests/`).
3. **Frontend Build Verification**: Run `npm run build` in `/frontend`.
4. **Git Push**: Push changes to `origin/main`.
5. **Deployment Health Check**:
   - `GET https://vanvas-api.onrender.com/health` (HTTP 200, matches Git HEAD commit).
   - `GET https://vanvas-api.onrender.com/health/ready` (HTTP 200, inventory >= 26 destinations).
6. **Live Smoke Test**:
   - Verify Destinations Catalogue (`GET /api/v1/destinations`).
   - Verify CORS Preflight (`OPTIONS /api/v1/destinations` with `Origin: https://vanvasai.vercel.app`).
   - Verify user registration, authentication, and persistence across sessions.
7. **Monitor Logs**: Confirm zero 500/502/503 runtime exceptions in Render service logs.
