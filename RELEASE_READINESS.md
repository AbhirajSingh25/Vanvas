# VANVAS Phase 6.1: Final Production Release Gate & Activation Matrix

## 1. System Overview & Baseline Architecture
VANVAS is the Indian mountain and slow-travel companion application developed under **The Sorted Club**.

- **Frontend Production URL**: [https://vanvasai.vercel.app](https://vanvasai.vercel.app) (Next.js 16.3.5, React 19, Vanilla CSS Design System, PWA Service Worker)
- **Backend Production URL**: [https://vanvas-api.onrender.com](https://vanvas-api.onrender.com) (FastAPI 0.136.3, SQLAlchemy 2.0.52, PostgreSQL on Render, Additive Alembic Migrations)
- **Android Application ID**: `ai.vanvas.app` (Capacitor 7 Native Shell, Gradle 8.11.1, Android SDK 35)
- **Git Baseline Revision**: `4ac8e1fccd44375a90dcb48e4349b6ed9d78572a` (CI Run #59, ID `37945026655`, Status: `completed/success`)
- **API Version**: `1.0.0`

```mermaid
flowchart TD
    subgraph Client Layer [Client & Interface Tier]
        Web[Next.js Web / Desktop App]
        PWA[PWA Offline Service Worker]
        Android[Android Capacitor ai.vanvas.app]
    end

    subgraph API Gateway [FastAPI Production Core - Render]
        Health[Health & Readiness Probes /health /ready /readiness-audit]
        Auth[JWT HS256 & Session Lifecycle Engine]
        Memory[Traveller Memory & Personalization Engine]
        Intel[Proactive Travel Intelligence & Replan Engine]
        Commerce[Travel Commerce, Stays & Payments Gateway]
    end

    subgraph Persistent Storage [Relational & Object Durability]
        Postgres[(Managed PostgreSQL Database)]
        Cloudinary[Cloudinary / Local Avatar Storage]
    end

    subgraph External Integrations [Integrations & Provider Governance]
        Brevo[Brevo Transactional Email Engine]
        Razorpay[Razorpay / Stripe Payment Gateways]
        Amadeus[Amadeus / StayingAPI Stays]
        FCM[Firebase Cloud Messaging Admin SDK]
        Sentry[Sentry Crash & Observability Engine]
    end

    Client Layer -->|HTTPS / WSS| API Gateway
    API Gateway --> Persistent Storage
    API Gateway --> External Integrations
```

---

## 2. Release Gate Status Taxonomy

Every capability in the VANVAS platform is evaluated and classified according to the following strict release taxonomy:

| Status Code | Meaning & Criteria |
| :--- | :--- |
| `PRODUCTION_VERIFIED` | Verified operational in the live production deployment or against live provider infrastructure. |
| `SANDBOX_VERIFIED` | Fully implemented, tested, and validated against sandbox/mock providers or simulation environments. |
| `IMPLEMENTED` | Code-complete and covered by unit/integration tests, awaiting environment provisioning. |
| `CONFIGURATION_REQUIRED` | Feature complete but requires production environment keys/secrets to be supplied by the owner. |
| `EXTERNAL_APPROVAL_REQUIRED`| Integration implemented but pending external account verification, KYC, or merchant approval. |
| `DEGRADED` | Operating with functional fallback (e.g., curated Himalayan dataset active when live API is unconfigured). |
| `BLOCKED` | Release gate item cannot proceed until a prerequisite action (such as signing key generation) is completed. |
| `FAILED` | Implementation or probe failed validation checks. |

---

## 3. Comprehensive Capability Matrix

| Capability / Subsystem | Environment | Status | Verification Reference | Notes & Fallback State |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Core Liveness** | Render Production | `PRODUCTION_VERIFIED` | `GET /health` -> HTTP 200 | `git_revision: 4ac8e1fccd44375a90dcb48e4349b6ed9d78572a`, `status: healthy` |
| **Backend Readiness Probe** | Render Production | `PRODUCTION_VERIFIED` | `GET /health/ready` -> HTTP 200 | DB connected; 26 canonical + 1 dynamic destinations, 237 places, 118 hotels, 72 rentals |
| **Readiness Audit Endpoint** | Render Production | `PRODUCTION_VERIFIED` | `GET /health/readiness-audit` | Complete capability matrix returned; zero secret leakage |
| **Frontend Web & PWA** | Vercel Production | `PRODUCTION_VERIFIED` | `https://vanvasai.vercel.app` -> HTTP 200 | Next.js 16.3.5 Turbopack build passed; PWA manifest and service worker active |
| **Database Durability** | Managed PostgreSQL | `PRODUCTION_VERIFIED` | Render PostgreSQL Pool | Engine: `postgresql`; additive idempotent Alembic migrations; zero data wipe |
| **Auth & Session Security** | Production & Local | `PRODUCTION_VERIFIED` | JWT HS256, 7-Day Expire | Strict production validator rejects default dev secrets and SQLite in production |
| **Canonical Himalayan Data** | Relational Database | `PRODUCTION_VERIFIED` | 26 Canonical Destinations | 208+ verified places, 104+ hotels, 53+ mobility options; authentic Himalayan visuals |
| **Traveller Memory Engine** | Core API & Scorer | `PRODUCTION_VERIFIED` | Inferred Evidence $\ge 2$ | Explicit preference precedence; sensitive trait exclusion; instant user deletion |
| **Proactive Intelligence** | Evaluator & Replan | `PRODUCTION_VERIFIED` | `/intelligence/evaluate-active-batch` | 5 signals (Weather, Transport, Traffic, Hours, Budget); zero unsolicited mutation |
| **Payment Gateway (Razorpay)**| Live & Sandbox | `CONFIGURATION_REQUIRED` | Signature & Webhook Engine | Fails closed in production without live keys; Sandbox mode verified with HMAC check |
| **Stay Providers (Amadeus)** | Live & Curated | `CONFIGURATION_REQUIRED` | GDS / Hotel Offers Adapter | Fallback to verified curated Himalayan stays active; zero fake confirmations |
| **Transactional Email (Brevo)**| Brevo HTTPS API | `CONFIGURATION_REQUIRED` | HTTPS Dispatch Abstraction | OTP generation, rate limiting, and hashing verified; requires `BREVO_API_KEY` |
| **Push Notifications (FCM)** | Firebase Android | `CONFIGURATION_REQUIRED` | NotificationService & Tokens | In-app notification queue durable; native FCM dispatch pending service account JSON |
| **Observability (Sentry)** | Client & Backend | `CONFIGURATION_REQUIRED` | PII Scrubber & Error Handlers| Scrubbing verified; remote transport activates when `SENTRY_DSN` is set |
| **Android Artifact Signing** | Gradle / Android SDK| `BLOCKED` (By Signing Config) | `jarsigner` / `apksigner` | Debug APK signed with debug key; Release APK & AAB unsigned pending upload key |
| **Privacy & Data Rights** | Auth API | `PRODUCTION_VERIFIED` | `GET /api/v1/auth/export` | Complete personal data export (JSON) and cascading account purge verified |

---

## 4. Android Artifact Signing Status & Verification Report

Verification performed using Java SDK `jarsigner` (v18.0.2) and Android SDK `apksigner` (Build-Tools v34.0.0 / 36.0.0):

| Artifact | Path | Signature Status | Signer Identity | Play Store Upload Status |
| :--- | :--- | :--- | :--- | :--- |
| **Debug APK** | `frontend/android/app/build/outputs/apk/debug/app-debug.apk` | **SIGNED** (Debug Key) | `CN=Android Debug, O=Android, C=US` (SHA256withRSA, 2048-bit) | *Not for Play Store (USB / Local Dev only)* |
| **Release APK** | `frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk` | **UNSIGNED** | None (`Missing META-INF/MANIFEST.MF`) | *Unsigned test build* |
| **Release AAB** | `frontend/android/app/build/outputs/bundle/release/app-release.aab` | **UNSIGNED** | None (`jar is unsigned`) | `BLOCKED BY SIGNING CONFIGURATION` |

### Play App Signing Architecture & Developer Upload Key Separation
1. **Google Play App Signing**: Google manages the master app-signing key in secure infrastructure.
2. **Developer Upload Key**: Used strictly by the project owner to sign `.aab` bundles uploaded to Google Play Console.
3. **Upload Key Protection**: Keystores (`.jks`) and passphrases are strictly excluded from version control and must be supplied via secure CI secrets.

---

## 5. Production Environment Variable Governance

### Backend Environment Variables (Render Dashboard)
*Do not print or commit actual secret values.*

| Variable | Required In Prod | Purpose / Description | Expected Format |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | **Yes** | Runtime environment switch | `production` |
| `PROVIDER_ENV` | **Yes** | Travel & payment provider operational mode | `production` (or `sandbox` during pre-launch testing) |
| `SECRET_KEY` | **Yes** | Cryptographic key for signing HS256 JWT sessions | 32+ character high-entropy hex/base64 string |
| `DATABASE_URL` | **Yes** | Managed PostgreSQL connection string | `postgresql://<user>:<pwd>@<host>:<port>/<dbname>` |
| `BACKEND_CORS_ORIGINS` | **Yes** | Explicit allowed frontend origins (No wildcards) | `["https://vanvasai.vercel.app","https://vanvas.in"]` |
| `AI_PROVIDER` | **Yes** | AI intelligence and LLM backend | `gemini` |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API Key | `AIzaSy...` |
| `GEMINI_MODEL` | **Yes** | Gemini model identifier | `gemini-3.5-flash-lite` |
| `EMAIL_PROVIDER` | **Yes** | Transactional email provider | `brevo` |
| `BREVO_API_KEY` | **Yes** | Brevo Transactional Email API Key | `xkeysib-...` |
| `EMAIL_FROM` | **Yes** | Sender email address | `thesortedclub@gmail.com` |
| `APP_PUBLIC_URL` | **Yes** | Public frontend application URL | `https://vanvasai.vercel.app` |
| `PAYMENT_PROVIDER` | Optional | Live payment gateway | `razorpay` or `stripe` |
| `RAZORPAY_KEY_ID` | When live | Razorpay Key ID | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | When live | Razorpay Key Secret | High-entropy secret string |
| `RAZORPAY_WEBHOOK_SECRET` | When live | Razorpay Webhook Secret | High-entropy webhook secret |
| `AMADEUS_CLIENT_ID` | When live | Amadeus Self-Service API Key | 32-char alphanumeric key |
| `AMADEUS_CLIENT_SECRET` | When live | Amadeus API Secret | API secret string |
| `AMADEUS_ENV` | When live | Amadeus target environment | `production` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | When push | Firebase Admin SDK service account key | Full JSON string of service account credentials |
| `SENTRY_DSN` | Optional | Backend Sentry DSN for crash observability | `https://<key>@<host>/<project_id>` |

### Frontend Environment Variables (Vercel Dashboard)
| Variable | Required In Prod | Purpose / Description | Expected Format |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Yes** | Backend API base URL | `https://vanvas-api.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Frontend canonical application URL | `https://vanvasai.vercel.app` |
| `NEXT_PUBLIC_ENVIRONMENT` | **Yes** | Frontend runtime environment | `production` |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Frontend Sentry DSN | `https://<key>@<host>/<project_id>` |

---

## 6. Operational Procedures & Runbooks

### A. Database Durability, Migrations & Backup Verification
1. **Engine Verification**:
   - Production strictly requires PostgreSQL. The server validates that `DATABASE_URL` does not start with `sqlite` when `ENVIRONMENT=production`.
2. **Executing Migrations**:
   ```bash
   cd backend
   alembic upgrade head
   ```
3. **Additive Startup Guard**: `ensure_database_schema(engine)` checks all tables, indices, and constraints on application boot without destructive resets.
4. **Backup & Restore Procedure**:
   - Automated daily snapshots are managed by Render / PostgreSQL provider.
   - To take a manual snapshot before schema changes:
     ```bash
     pg_dump -h <host> -U <user> -d <dbname> -F c -b -v -f vanvas_backup_$(date +%Y%m%d).dump
     ```
   - Restoration tests must only be performed against a dedicated staging/local database copy.

### B. Proactive Intelligence Background Evaluation
1. **Schedule**: Run every 30 minutes to evaluate active trips against real-time signals (weather, road status, operating hours).
2. **Trigger Command**:
   ```bash
   curl -X POST "https://vanvas-api.onrender.com/api/v1/intelligence/evaluate-active-batch?max_trips=50" \
        -H "Authorization: Bearer <ADMIN_SERVICE_TOKEN>"
   ```

### C. Android Release Signing & Play Store Upload
1. **Generate Upload Keystore (One-Time by Project Owner)**:
   ```bash
   keytool -genkey -v -keystore vanvas-release-upload.jks \
     -alias vanvas-upload-key \
     -keyalg RSA \
     -keysize 2048 \
     -validity 10000 \
     -dname "CN=VANVAS Release, OU=Mobile Engineering, O=VANVAS AI, L=Bengaluru, ST=Karnataka, C=IN"
   ```
2. **Build and Sign Release Bundle**:
   ```bash
   export ANDROID_KEYSTORE_PATH="/secure/path/to/vanvas-release-upload.jks"
   export ANDROID_KEYSTORE_PASSWORD="<store_password>"
   export ANDROID_KEY_ALIAS="vanvas-upload-key"
   export ANDROID_KEY_PASSWORD="<key_password>"

   cd frontend
   npm run build
   npx cap sync android

   cd android
   ./gradlew bundleRelease
   ```
3. **Verify Bundle Signature**:
   ```bash
   jarsigner -verify -verbose -certs frontend/android/app/build/outputs/bundle/release/app-release.aab
   ```
4. **Google Play Console Upload**:
   - Upload `app-release.aab` to Closed Testing track.
   - Digital Asset Links: Ensure SHA-256 fingerprint matches `https://vanvasai.vercel.app/.well-known/assetlinks.json`.

---

## 7. Owner Action Checklist (Separated by Responsibility)

### Category A: Code-Complete & Verified (No Action Needed)
- [x] **Backend Health & Diagnostics**: `/health`, `/health/ready`, `/health/diagnostics`, `/health/readiness-audit` operational.
- [x] **Frontend Web & PWA**: Next.js 16.3.5 Turbopack build, TypeScript checks, and service worker verified.
- [x] **PostgreSQL Durability**: Live Render PostgreSQL active with 27 destinations, 237 places, 118 hotels, 72 rentals.
- [x] **Zero Fake Confirmation Invariant**: Authoritative server amount calculation and cryptographic verification.
- [x] **Traveller Memory & Consent**: Deterministic preference inference, explicit precedence, instant deletion.
- [x] **Proactive Intelligence**: 5 signal adapters and batch trip evaluation engine tested.
- [x] **Privacy & User Rights**: Complete data export and cascade deletion endpoints verified.

### Category B: External Configuration (Owner Dashboard Access Required)
- [ ] **Action B1 (Render)**: Set production `SECRET_KEY` (32+ byte secure secret) on Render environment.
- [ ] **Action B2 (Brevo)**: Set `BREVO_API_KEY` on Render environment for live OTP delivery.
- [ ] **Action B3 (Sentry)**: Add `SENTRY_DSN` to Render and Vercel environments for production telemetry.
- [ ] **Action B4 (Firebase)**: Provide Firebase service account JSON in `FIREBASE_SERVICE_ACCOUNT_JSON` on Render for native push.

### Category C: External Provider Approval & Keys (Pending Partner Onboarding)
- [ ] **Action C1 (Razorpay)**: Submit KYC and merchant account verification to obtain live `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- [ ] **Action C2 (Razorpay Webhooks)**: Register webhook endpoint `https://vanvas-api.onrender.com/api/v1/bookings/webhooks/razorpay` with `payment.captured` and `payment.failed` events.
- [ ] **Action C3 (Amadeus)**: Upgrade Amadeus account from Self-Service Test to Enterprise/Production for live hotel offers.

### Category D: Release Signing & App Store Publishing
- [ ] **Action D1 (Upload Keystore)**: Generate `vanvas-release-upload.jks` and store securely in a password manager.
- [ ] **Action D2 (CI Secrets)**: Add `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` to GitHub Actions secrets.
- [ ] **Action D3 (Play Console)**: Enroll in Google Play App Signing and upload signed `app-release.aab` to Internal/Closed Testing.
