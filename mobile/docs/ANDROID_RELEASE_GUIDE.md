# VANVAS Android Release & Build Guide

**Application ID:** `ai.vanvas.app`  
**Version:** `0.3.0`  
**Version Code:** `3`  
**Target Android SDK:** `35` (Android 15+)  
**Minimum Android SDK:** `24` (Android 7.0+)

---

## 1. Overview of Release Artifacts

The VANVAS Android project is configured to generate two primary artifacts:

1. **Standalone Preview APK (`.apk`):**
   - Direct manual installation on physical Android phones or test devices without requiring Play Store distribution.
   - Ideal for field testing in Himachal/Uttarakhand off-grid environments.
2. **Production App Bundle (`.aab`):**
   - Optimized, signed Google Play format required for submission to Google Play Console.
   - Play Feature Delivery and dynamic device ABI slicing (`arm64-v8a`, `armeabi-v7a`, `x86_64`).

---

## 2. Building via Expo Application Services (EAS Build)

EAS Build runs in the cloud or locally using the pre-configured build profiles in `mobile/eas.json`:

### Prerequisites
Install EAS CLI globally if not already present:
```bash
npm install -g eas-cli
eas login
```

### Build Standalone Android APK (Preview Profile)
```bash
cd mobile
eas build --platform android --profile preview
```
This produces a downloadable APK URL ready for direct sideloading on any Android device.

### Build Google Play Store AAB (Production Profile)
```bash
cd mobile
eas build --platform android --profile production
```
This produces an `.aab` (Android App Bundle) signed with your production keystore, ready for the Google Play Console internal test track or production release.

---

## 3. Local Offline Gradle Builds

If you prefer building locally using Android Studio or the Android SDK command line tools:

### Step 1: Prebuild (Synchronize Native Project)
```bash
cd mobile
npx expo prebuild --clean
```

### Step 2: Assemble Debug APK
```bash
cd mobile/android
./gradlew assembleDebug
```
Output location:
`mobile/android/app/build/outputs/apk/debug/app-debug.apk`

### Step 3: Bundle Release AAB
```bash
cd mobile/android
./gradlew bundleRelease
```
Output location:
`mobile/android/app/build/outputs/bundle/release/app-release.aab`

---

## 4. Keystore Generation & Security

To generate a new production upload keystore:
```bash
keytool -genkey -v -keystore vanvas-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias vanvas-key-alias
```

### Gradle Release Signing Configuration
Place your keystore in `mobile/android/app/` and configure environment variables in `mobile/android/gradle.properties`:
```properties
VANVAS_UPLOAD_STORE_FILE=vanvas-release-key.jks
VANVAS_UPLOAD_KEY_ALIAS=vanvas-key-alias
VANVAS_UPLOAD_STORE_PASSWORD=your_store_password
VANVAS_UPLOAD_KEY_PASSWORD=your_key_password
```
In `mobile/android/app/build.gradle`:
```groovy
signingConfigs {
    release {
        if (project.hasProperty('VANVAS_UPLOAD_STORE_FILE')) {
            storeFile file(VANVAS_UPLOAD_STORE_FILE)
            storePassword VANVAS_UPLOAD_STORE_PASSWORD
            keyAlias VANVAS_UPLOAD_KEY_ALIAS
            keyPassword VANVAS_UPLOAD_KEY_PASSWORD
        }
    }
}
```

---

## 5. Play Store Release Tracks Workflow

1. **Internal Testing Track:** Upload `app-release.aab` to verify startup, SQLite schema migration, and foreground location permission flow on at least 2 real devices.
2. **Closed Testing (Alpha):** Invite core test group to test offline mode, Spiti motorcycle wizard calculations, and travel ledger expense syncing.
3. **Open Beta / Production Track:** Submit for standard Google Play policy review.

