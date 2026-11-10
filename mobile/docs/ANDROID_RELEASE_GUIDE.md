# VANVAS Android Release & Production Guide

**Application ID:** `ai.vanvas.app`  
**Version:** `0.4.0`  
**Version Code:** `4`  
**Expo SDK:** `58.0.23`  
**React Native:** `0.88.1`  
**Target Android SDK:** `36` (Android 16+ Play Store 2026 Mandate)  
**Compile Android SDK:** `37`  
**Minimum Android SDK:** `24` (Android 7.0+)

---

## 1. Overview of Android Release Artifacts

The VANVAS Android release pipeline (`.github/workflows/android-apk.yml`) separates validation packaging from official Play Store signing to prevent unverified debug bundles from ever masquerading as production uploads:

1. **Standalone Debug APK (`VANVAS-Android-v0.4.0-code4-debug.apk`):**
   - Assembled via `./gradlew assembleDebug`.
   - Built unconditionally on every push to `main` and downloadable as a GitHub Actions artifact.
   - Sideloadable on any physical Android device for real-world field verification in Himachal/Uttarakhand without Google Play distribution.

2. **Validation App Bundle (`VANVAS-Android-v0.4.0-code4-validation.aab`):**
   - Assembled via `./gradlew bundleDebug` when production release signing secrets are not yet configured in GitHub Secrets.
   - Verifies packaging integrity, Hermes bytecode compilation, 64-bit ABI slicing, and resource bundling.
   - Labeled clearly as **Validation**; CI explicitly marks Google Play upload gate as `🟡 OWNER BLOCKED`.

3. **Signed Production App Bundle (`VANVAS-Android-v0.4.0-code4-production.aab`):**
   - Assembled via `./gradlew bundleRelease` when repository release keystore secrets are present.
   - Cryptographically inspected in CI via `keytool -printcert -jarfile`. The pipeline strictly fails if signed by `CN=Android Debug`.
   - Upload-ready for Google Play Console Internal, Closed, or Production tracks.

4. **Signed Release APK (`VANVAS-Android-v0.4.0-code4-release-signed.apk`):**
   - Generated alongside production AAB when keystore secrets are present for direct testing of the release build flavor.

---

## 2. Production Keystore Generation & GitHub Actions Configuration

To enable upload-signed production AAB generation in CI, the repository owner generates a dedicated upload keystore and stores it as GitHub Actions secrets.

### Step 1: Generate Upload Keystore
Run the following standard JDK command in your terminal:

```bash
keytool -genkeypair -v -keystore vanvas-upload-keystore.jks \
  -alias vanvas-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=VANVAS Upload, OU=Mobile Engineering, O=The Sorted Club, L=Kaza, ST=Himachal Pradesh, C=IN"
```

> [!WARNING]
> Keep your password secure and back up `vanvas-upload-keystore.jks` in a secure password manager.
> Both `*.jks` and `*.keystore` are strictly ignored in `.gitignore` and must never be committed to Git.

### Step 2: Convert Keystore to Base64

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\vanvas-upload-keystore.jks")) | Set-Clipboard
```
*(The Base64 string is now copied to your clipboard)*

**On macOS / Linux:**
```bash
base64 -w 0 vanvas-upload-keystore.jks | pbcopy # macOS: pbcopy; Linux: xclip -selection clipboard
```

### Step 3: Add Secrets to GitHub Repository
Navigate to:  
**Repository Settings** &rarr; **Secrets and variables** &rarr; **Actions** &rarr; **New repository secret**

Add the following 4 secrets:

| Secret Name | Value | Purpose |
|:---|:---|:---|
| `ANDROID_KEYSTORE_BASE64` | Paste the Base64 string from Step 2 | Decoded into temporary runner file during release build |
| `ANDROID_KEYSTORE_PASSWORD` | The password chosen during `keytool` generation | Unlocks keystore container |
| `ANDROID_KEY_ALIAS` | `vanvas-upload` | Identifies signing key inside keystore |
| `ANDROID_KEY_PASSWORD` | The key password chosen during generation | Unlocks the private key entry |

Once these 4 secrets are saved, the next GitHub Actions run will automatically assemble `VANVAS-Android-v0.4.0-code4-production.aab`, verify the certificate, and upload it as a release artifact.

---

## 3. Physical Android Device Sideloading & QA

To test `VANVAS-Android-v0.4.0-code4-debug.apk` directly on physical Android phones:

### Method A: ADB Command Line (Recommended)
1. Enable **Developer Options** and **USB Debugging** on the Android device.
2. Connect phone via USB.
3. Download the debug APK artifact from GitHub Actions or build locally (`cd mobile/android && ./gradlew assembleDebug`).
4. Install or reinstall:
   ```bash
   adb install -r VANVAS-Android-v0.4.0-code4-debug.apk
   ```
5. Launch app:
   ```bash
   adb shell monkey -p ai.vanvas.app -c android.intent.category.LAUNCHER 1
   ```

### Method B: Mobile Browser Direct Download
1. Download `VANVAS-Android-v0.4.0-code4-debug.apk` from the GitHub Actions run onto the device.
2. Open Files app, tap the APK, and enable **Install Unknown Apps** for the browser or file manager when prompted.
3. Tap **Install** and open VANVAS.

### Physical Device Verification Checklist:
- [ ] App launches smoothly with warm saffron splash screen and loads cached offline theme.
- [ ] Foreground location request triggers native Android runtime dialog for Nearby Radar.
- [ ] Offline travel ledger persists expenses into SQLite with airplane mode enabled.
- [ ] Spiti motorcycle wizard computes rental and fuel buffers correctly.
- [ ] Account profile settings open cleanly without crashes.

---

## 4. Standalone Public Account Deletion Portal Deployment

Google Play policy requires a publicly accessible web portal where users can request or execute account deletion without installing the mobile app.

The portal is completely implemented in `account-deletion-site/`:
- **Architecture:** Zero-dependency static client (HTML5 / Vanilla CSS / ES6 JavaScript).
- **Backend Auth API:** Authenticates user via `POST https://vanvas-api.onrender.com/api/v1/auth/login`.
- **Backend Erasure API:** Dispatches `DELETE https://vanvas-api.onrender.com/api/v1/auth/account`.
- **CORS Compatibility:** The backend regex `r"https://vanvas[a-z0-9-]*\.vercel\.app"` in `backend/app/main.py` explicitly allows any `vanvas*.vercel.app` subdomain.

### Deploying to Vercel (Repository Owner):
```bash
cd account-deletion-site
vercel login
vercel --prod
```
When prompted for project name, enter: `vanvas-account-deletion`.  
The resulting live URL will be `https://vanvas-account-deletion.vercel.app`, fully authorized by backend CORS.

---

## 5. Play Store Tracks Workflow

1. **Internal Testing Track:** Upload `VANVAS-Android-v0.4.0-code4-production.aab` to verify startup, SQLite schema migration, and foreground location permission flow on at least 2 real devices.
2. **Closed Testing Track (14-Day 12-Tester Requirement):** For Google Play accounts created after Nov 13, 2023, invite 12 testers to continuously opt in for 14 days.
3. **Open Beta / Production Track:** Submit for standard Google Play policy review with the Data Safety declarations documented in `mobile/docs/PLAY_STORE_RELEASE_CHECKLIST.md`.
