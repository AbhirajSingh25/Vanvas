# VANVAS Android Release Pipeline & Signing Strategy

This document outlines the production release and signing architecture for the VANVAS Android application (`ai.vanvas.app`).

---

## 1. Application Identity & Versioning

| Field | Value | Notes |
| :--- | :--- | :--- |
| **Package Name** | `ai.vanvas.app` | Unique Android application ID |
| **Version Name** | `0.1.0` | Semantic versioning (`major.minor.patch`) |
| **Version Code** | `1` | Strictly monotonically increasing integer |
| **Min SDK** | `24` (Android 7.0) | High compatibility across target hardware |
| **Target SDK** | `35` (Android 15) | Modern Android standards compliant |
| **Capacitor Core** | `8.x` | Modern WebView wrapper |

---

## 2. Safe Signing Architecture (Zero Secret Commits)

VANVAS follows industry best practices: **No keystores (`.jks` / `.keystore`) or passwords are ever committed to version control.**

### Environment Variables for CI / Release Builds

When generating production artifacts (`app-release.aab` or signed APKs), Gradle reads signing parameters from the environment:

| Secret / Environment Variable | Description | Example / Notes |
| :--- | :--- | :--- |
| `ANDROID_KEYSTORE_PATH` | Absolute path to the release upload keystore file | `/path/to/vanvas-release-upload.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | Passphrase protecting the keystore | Stored in GitHub Actions Secrets |
| `ANDROID_KEY_ALIAS` | Key alias within the keystore | `vanvas-upload-key` |
| `ANDROID_KEY_PASSWORD` | Passphrase protecting the key alias | Stored in GitHub Actions Secrets |

### Gradle Configuration (`frontend/android/app/build.gradle`)

```groovy
signingConfigs {
    release {
        if (System.getenv("ANDROID_KEYSTORE_PATH") && file(System.getenv("ANDROID_KEYSTORE_PATH")).exists()) {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
}
buildTypes {
    release {
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        if (System.getenv("ANDROID_KEYSTORE_PATH") && file(System.getenv("ANDROID_KEYSTORE_PATH")).exists()) {
            signingConfig signingConfigs.release
        }
    }
}
```

---

## 3. Play App Signing vs. Upload Key Separation

1. **Google Play App Signing**:
   - Google maintains and protects the **App Signing Key** used to deliver optimized APKs to end-user devices.
   - The developer retains the **Upload Key** used to sign `.aab` bundles uploaded to the Google Play Console.
2. **Key Rotation & Recovery**:
   - If an upload key is lost, a replacement upload key can be registered with Google Play Support without changing the application package name or invalidating user installations.

---

## 4. Generating an Upload Keystore (For Maintainers)

```bash
keytool -genkey -v -keystore vanvas-release-upload.jks \
  -alias vanvas-upload-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=VANVAS Release, OU=Mobile Engineering, O=VANVAS AI, L=Bengaluru, ST=Karnataka, C=IN"
```

*Note: Save `vanvas-release-upload.jks` securely in a hardware security key / password manager vault. Never commit to Git.*

---

## 5. Local Build Commands

```bash
# Sync web build to Android assets
cd frontend
npm run build
npx cap sync android

# Build Debug APK (for USB testing)
cd android
./gradlew assembleDebug

# Build Unsigned / Test Release APK
./gradlew assembleRelease

# Build Production Android App Bundle (AAB) for Play Console
./gradlew bundleRelease
```

Target Artifacts:
- **Debug APK**: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk` (or signed if env set)
- **Production AAB**: `frontend/android/app/build/outputs/bundle/release/app-release.aab`
