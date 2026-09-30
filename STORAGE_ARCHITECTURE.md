# VANVAS Production Storage Architecture & Persistence Strategy

## 1. Executive Summary

Render's native container filesystem is ephemeral; files written to local ephemeral disk are destroyed on new deployments, redeploys, service restarts, or scaling events.

To guarantee that user profile avatars, custom uploads, and Copilot private conversation images persist permanently across restarts and deployments, VANVAS implements a tiered, production-hardened storage strategy.

---

## 2. Storage Strategy & Provider Hierarchy

VANVAS `StorageService` (`backend/app/services/storage_service.py`) supports pluggable backends selected via `STORAGE_PROVIDER` configuration:

```
                  ┌─────────────────────────────────┐
                  │          StorageService         │
                  └────────────────┬────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           ▼                       ▼                       ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Cloudinary (Media)  │ │   AWS S3 / R2 /     │ │ Persistent Disk     │
│                     │ │   MinIO (Object)    │ │ (/var/data/uploads) │
│ - Avatars & Media   │ │ - Full Persistence  │ │ - Single Instance   │
│ - CDN Optimized     │ │ - Private Chat Auth │ │ - Zero Egress Cost  │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

### Preferred Strategy: External Object Storage (S3 / Cloudflare R2 / Cloudinary)

1. **Cloudflare R2 / AWS S3 (Recommended for Scale)**
   - S3-compatible object storage configured via:
     - `S3_BUCKET_NAME`
     - `S3_ACCESS_KEY_ID`
     - `S3_SECRET_ACCESS_KEY`
     - `S3_REGION_NAME`
     - `S3_ENDPOINT_URL` (for Cloudflare R2 / MinIO)
   - Guarantees multi-instance scalability, zero data loss during rolling deployments, and zero egress fees when using Cloudflare R2.

2. **Cloudinary (Optimized Media Asset Pipeline)**
   - Configured via:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
   - High-performance delivery for public avatars with automated format optimization (`.webp`), responsive scaling, and CDN edge caching.

### Single-Instance Operational Fallback: Persistent Render Disk

For single-instance deployments where external cloud buckets are not yet provisioned:
- Mount a persistent Render disk at `/var/data/vanvas_uploads` (or configurable path via `STORAGE_UPLOAD_DIR`).
- Set environment variable:
  ```env
  STORAGE_PROVIDER=local
  STORAGE_UPLOAD_DIR=/var/data/vanvas_uploads
  ```
- All files written to `STORAGE_UPLOAD_DIR` persist across service restarts and Git pushes.

---

## 3. Privacy and Access Control

1. **Public Profile Avatars (`/api/v1/auth/profile/avatar/file/{clean_key}`)**
   - Publicly accessible with HTTP caching headers (`Cache-Control: public, max-age=86400`).
   - Content-type sniffing protection (`X-Content-Type-Options: nosniff`).

2. **Private Copilot Conversation Images (`/api/v1/copilot/image/{key_path}`)**
   - **Authenticated & Owner-Restricted**: Requires Bearer JWT token or authenticated session.
   - **Owner Validation**: Extracts owner ID from `chat/{user_id}/...` path and validates that `current_user.id == owner_id` (or user is system admin).
   - **Private Cache Headers**: `Cache-Control: private, max-age=3600`.
