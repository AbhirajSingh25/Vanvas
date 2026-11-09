# VANVAS Mobile Next Steps & Engineering Handoff

**Current Status:** Production-Ready Android Native Application (0.3.0, versionCode 3)  
**Next Development Phase:** Store Submission & Production Monitoring  

---

## 1. Remaining Release Actions for Google Play

1. **Sign Release AAB:**
   - Compile production AAB via `eas build --platform android --profile production` or local Gradle `./gradlew bundleRelease`.
   - Sign with the organization upload keystore.
2. **Google Play Console Setup:**
   - Link `ai.vanvas.app` package.
   - Complete the Data Safety Questionnaire using `mobile/docs/PLAY_STORE_RELEASE_CHECKLIST.md`.
   - Upload app screenshots from modern 1080p+ Android device.
3. **Internal Testing Track:**
   - Invite 5-10 team members to verify offline storage, push notifications, and Spiti motorcycle planner on physical Samsung/Pixel/OnePlus devices.

---

## 2. Post-Quota Reset Roadmap (Post November 13, 2026)

- **Remaining Artwork Generation:**
  - After the Gemini/Imagen quota resets on November 13, 2026, generate the remaining clean painterly gouache artwork files (with zero embedded text) for any secondary POIs.
  - Run the established mapping reconcilers (`scripts/generate_missing_artwork.py`) without incurring paid overages.
- **Push Notification Trigger Service:**
  - Connect Expo Push notifications for high-altitude weather and road status alerts (Rohtang Pass & Kunzum Pass status).
- **Background Sync Workers:**
  - Implement optional background sync worker using `expo-background-fetch` to update destination weather snapshots while device is charging.
