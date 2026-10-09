# VANVAS Phase 6: Production Activation, Consumer Beta & Release Readiness

## 1. System Overview & Baseline Architecture
VANVAS is the Indian mountain and slow-travel companion built under **The Sorted Club**.
- **Frontend Target**: [https://vanvasai.vercel.app](https://vanvasai.vercel.app) (Next.js 16.3.5, React 19, Vanilla CSS Design System, PWA Service Worker)
- **Backend Target**: [https://vanvas-api.onrender.com](https://vanvas-api.onrender.com) (FastAPI, SQLAlchemy, PostgreSQL on production, additive Alembic migrations)
- **Android Package**: `ai.vanvas.app` (Capacitor 7 Native Shell, Gradle 8.11.1, Android SDK 35)
- **Verified Commit Baseline**: `089d37542066c45a693877161272b2ac70460e70`

```mermaid
flowchart TD
    subgraph Client Layer
        Web[Next.js Web / Desktop]
        PWA[PWA Offline Service Worker]
        Android[Android Capacitor ai.vanvas.app]
    end

    subgraph API & Services
        FastAPI[FastAPI Gateway on Render]
        Auth[JWT HS256 Session Engine]
        MemoryEngine[Traveller Memory Engine]
        IntelEngine[Proactive Intelligence Engine]
        CommerceEngine[Travel Commerce & Payments]
    end

    subgraph External Integrations
        Postgres[(Managed PostgreSQL)]
        Brevo[Brevo / Resend Email Engine]
        Razorpay[Razorpay / Stripe Payments]
        Amadeus[Amadeus / StayingAPI Stays]
        FCM[Firebase Cloud Messaging]
        Sentry[Sentry Observability]
    end

    Client Layer -->|HTTPS / WSS| FastAPI
    FastAPI --> Auth
    FastAPI --> MemoryEngine
    FastAPI --> IntelEngine
    FastAPI --> CommerceEngine
    FastAPI --> Postgres
    FastAPI --> Brevo
    FastAPI --> Razorpay
    FastAPI --> Amadeus
    FastAPI --> FCM
    FastAPI --> Sentry
```

---

## 2. Release-Readiness Capability Matrix

| Capability | Target Environment | Status | Verification Reference | Owner Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Core & Health** | Render / Production | `PRODUCTION_VERIFIED` | `/health`, `/health/ready` HTTP 200 | None. Live and operational. |
| **Frontend Web & PWA** | Vercel / Production | `PRODUCTION_VERIFIED` | `vanvasai.vercel.app` HTTP 200, PWA manifest | None. Deployed and verified. |
| **Relational Database** | Managed PostgreSQL | `PRODUCTION_VERIFIED` | `engine: postgresql`, 27 destinations, 237 places | Continuous automated backups on Render/Neon. |
| **Authentication & Sessions** | Production & Local | `PRODUCTION_VERIFIED` | JWT HS256, 7-day token expiry | Set custom `SECRET_KEY` in environment. |
| **Canonical Mountain Inventory** | Database Seed | `PRODUCTION_VERIFIED` | 26 canonical Himalayan destinations, 208+ places, 104+ hotels | None. Seeded and verified. |
| **Traveller Memory Engine** | Database & Scorer | `PRODUCTION_VERIFIED` | Deterministic evidence $\ge 2$, explicit precedence | None. Full privacy and deletion verified. |
| **Proactive Intelligence** | Signal & Replan Engine | `PRODUCTION_VERIFIED` | Weather, transport, road signals & batch evaluator | Configure periodic cron for `/evaluate-active-batch`. |
| **Travel Commerce & Bookings** | Commerce Gateway | `SANDBOX_VERIFIED` | Server-side amount derivation, signature check | Add live `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` for live beta. |
| **Stay Commerce (Amadeus/StayingAPI)** | Provider Adapters | `SANDBOX_VERIFIED` | Fallback to verified curated mountain inventory | Add live Amadeus credentials when approved. |
| **Email & Verification** | Brevo HTTPS Engine | `PRODUCTION_VERIFIED` | Transactional OTP and verification links | Configure `BREVO_API_KEY` in Render environment. |
| **Push Notifications (FCM)** | Firebase Android | `SANDBOX_VERIFIED` | In-app notifications durable; FCM client ready | Upload `google-services.json` and service account for native push. |
| **Observability & Error Sanitization** | Client & Backend | `PRODUCTION_VERIFIED` | PII scrubber active; Sentry integration ready | Add `SENTRY_DSN` in Render and Vercel environments. |
| **Android APK / AAB Build** | Gradle Release Shell | `AUTOMATED_TESTED` | `app-debug.apk`, `app-release.aab` generated | Sign AAB with Google Play App Signing key. |
| **Privacy & GDPR Rights** | Auth API | `PRODUCTION_VERIFIED` | Full data export & instant cascading deletion | None. Verified in test suite. |

---

## 3. Environment Variable Inventory (Keys Only)

### Backend (Render Environment)
```bash
# Core Runtime
ENVIRONMENT=production
PROJECT_NAME="VANVAS API"
SECRET_KEY=<generate_secure_32_byte_secret>
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>
BACKEND_CORS_ORIGINS=["https://vanvasai.vercel.app","https://vanvas.in"]

# AI Providers
AI_PROVIDER=gemini
GEMINI_API_KEY=<google_gemini_api_key>
GEMINI_MODEL=gemini-3.5-flash-lite

# Email Delivery (Brevo Transactional API)
EMAIL_PROVIDER=brevo
BREVO_API_KEY=<brevo_api_key>
EMAIL_FROM=thesortedclub@gmail.com
EMAIL_FROM_NAME="VANVAS"
APP_PUBLIC_URL=https://vanvasai.vercel.app

# Payments (Razorpay / Stripe)
PROVIDER_ENV=production
PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID=<razorpay_live_key_id>
RAZORPAY_KEY_SECRET=<razorpay_live_key_secret>
RAZORPAY_WEBHOOK_SECRET=<razorpay_webhook_secret>

# Travel Providers (Optional Live Overlays)
AMADEUS_CLIENT_ID=<amadeus_api_key>
AMADEUS_CLIENT_SECRET=<amadeus_api_secret>
AMADEUS_ENV=production
STAYINGAPI_KEY=<stayingapi_key>

# Observability & Push Notifications
SENTRY_DSN=<sentry_backend_dsn>
FCM_SERVER_KEY=<firebase_server_key>
FIREBASE_PROJECT_ID=vanvas-app
```

### Frontend (Vercel Environment)
```bash
NEXT_PUBLIC_API_URL=https://vanvas-api.onrender.com
NEXT_PUBLIC_APP_URL=https://vanvasai.vercel.app
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_DSN=<sentry_frontend_dsn>
```

---

## 4. Operational Runbooks

### A. Database Durability & Schema Migrations
1. **Engine**: Production strictly runs on managed PostgreSQL (`psycopg2-binary` connection pooling).
2. **Migrations**:
   ```bash
   cd backend
   alembic upgrade head
   ```
3. **Additive Safety Check**: `ensure_database_schema(engine)` checks all tables, indices, and constraints on startup without dropping user data.
4. **Backup & Restore**:
   - Automated continuous daily snapshots on Render / Neon.
   - Manual snapshot before major upgrades:
     ```bash
     pg_dump -h <host> -U <user> -d <dbname> -F c -b -v -f vanvas_backup_$(date +%Y%m%d).dump
     ```

### B. Proactive Intelligence Background Evaluation
To evaluate active trips on an ongoing schedule without client polling loops:
1. **Cron Schedule**: Run every 30 minutes via Render Cron Job or GitHub Actions workflow.
2. **Trigger**:
   ```bash
   curl -X POST "https://vanvas-api.onrender.com/api/v1/intelligence/evaluate-active-batch?max_trips=50" \
        -H "Authorization: Bearer <ADMIN_SERVICE_TOKEN>"
   ```

### C. Android Release Signing & Play Store Submission
1. **Build Outputs**:
   - Debug APK: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
   - Release AAB: `frontend/android/app/build/outputs/bundle/release/app-release.aab`
2. **Signing with Release Keystore**:
   ```bash
   export ANDROID_KEYSTORE_PATH="/path/to/vanvas-release-key.jks"
   export ANDROID_KEYSTORE_PASSWORD="<store_password>"
   export ANDROID_KEY_ALIAS="vanvas"
   export ANDROID_KEY_PASSWORD="<key_password>"
   cd frontend/android
   ./gradlew bundleRelease
   ```
3. **Google Play Console**:
   - Upload `app-release.aab` under Closed Testing (Alpha/Beta track).
   - Ensure App Integrity (Play App Signing) is enabled with SHA-256 fingerprint matching the Digital Asset Links for App Links (`https://vanvasai.vercel.app/.well-known/assetlinks.json`).

---

## 5. Beta Rollout Strategy & Launch Checklist

### Controlled Beta Phase (50-100 Travellers)
- [x] **Zero Fake Confirmation Invariant**: Authoritative server validation for all stays and payments.
- [x] **Traveller Memory & Consent**: Inferred preferences require $\ge 2$ observations; instant deletion and export.
- [x] **Graceful Fallbacks**: Keyless map rendering, curated Himalayan destination fallback, durable in-app notifications.
- [ ] **Owner Action 1**: Set live `SECRET_KEY` and `BREVO_API_KEY` on Render dashboard.
- [ ] **Owner Action 2**: Link Razorpay production webhooks to `https://vanvas-api.onrender.com/api/v1/bookings/webhooks/razorpay`.
- [ ] **Owner Action 3**: Upload `google-services.json` to `frontend/android/app/` for native push notifications.
- [ ] **Owner Action 4**: Upload `app-release.aab` to Google Play Console Internal / Closed Testing.
