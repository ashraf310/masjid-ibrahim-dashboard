# Masjid Ibrahim TV — STAGING Android APK

This is an **isolated home-TV pilot**, not the production Masjid TV application.

- Android application ID: `org.masjidibrahim.tv.staging` (does not replace your installed production APK).
- Normal screen (v0.2 D04 test): `https://masjid-ibrahim-staging.vercel.app/d04`
- When a live staging presentation starts: automatically switches to `https://masjid-ibrahim-staging.vercel.app/audience-live`
- When presentation ends or is cleared: switches back to D04 Salah Timings.
- Refreshes the active presentation state approximately every 1.5 seconds; holds the current display through temporary network errors.
- Uses immersive Android fullscreen and Android TV launcher support.
- Only the staging URLs are allowed inside the app.

## Build an installable test APK
The GitHub Actions workflow `.github/workflows/android-staging-apk.yml` builds a **debug-signed** APK on an Android SDK runner. The workflow artifact is called `masjid-ibrahim-tv-staging-apk` and contains `app-debug.apk`.

Open the repository's **Actions** tab and select **Build staging Android TV APK**. Download the artifact from a successful workflow run. Extract the ZIP and install `app-debug.apk` using your normal sideload process.

A GitHub Actions build must succeed before the APK can be tested or distributed. **Do not install production app binaries under this test name.**

## Pilot test
1. Install the staging APK on the home Android TV alongside the existing production app.
2. Open staging APK: normal staging dashboard should load.
3. On speaker laptop, open a valid private staging presenter link, prepare slides, and click Start staging presentation.
4. Home TV should switch to audience slides. Navigate slides from laptop and verify changes.
5. End the presentation: TV should return to staging dashboard.
6. Check return from TV standby and after launching the staging app again.

## Installing v0.2 over an older debug build
GitHub-hosted builds may use a different temporary debug signing certificate between runs. If Android reports a signature or package conflict, uninstall ONLY **Masjid Ibrahim TV STAGING** (not the production app), then install the new APK. The production package has a different ID and must remain untouched.

## Deliberate staging limitations
- This first pilot APK uses the fixed live-only staging audience feed; **Admin TV pairing and assigned default dashboards are not implemented in this APK yet**.
- It follows any staging presentation, so install it ONLY on your home test TV.
- No boot autostart or periodic background service is implemented; the app must be running in the foreground.
- End-to-end Android hardware testing and production APK update are pending.
- Do not install at the Masjid or connect PRISM production until device pairing and admin assignment are built and approved.
