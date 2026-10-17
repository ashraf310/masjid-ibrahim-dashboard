# Masjid Ibrahim Android TV (private APK)

The TV app opens https://masjid-ibrahim-dashboard.vercel.app/ inside an immersive Android WebView. It is not published on Google Play and does not require a subscription.

## Get the APK
Open the repository's **Actions** tab, select **Android TV APK**, open the latest successful run, and download the **Masjid-Ibrahim-TV-APK** artifact. Unzip it to obtain `app-debug.apk`.

## Install
Copy APK to a USB drive; connect it to the TCL Android TV; install using the TV's file manager after permitting installs from that source. Or use ADB with `adb install -r app-debug.apk`.

## Important
- This is a development/debug-signed package for private testing, **not** a Play Store release.
- TV requires Wi-Fi/Internet for live data. Existing web dashboard manages content in Supabase.
- Keep the same APK signature for future upgrades; rebuilding debug APKs on different runner machines can change the debug signature, requiring reinstall.
- If Wi-Fi is unavailable during initial load, press OK to retry.
- The app requests no admin credentials or permissions beyond Internet/network state.
