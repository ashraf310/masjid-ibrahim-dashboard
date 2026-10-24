plugins { id("com.android.application") }
android {
 namespace = "org.masjidibrahim.tv.staging"
 compileSdk = 35
 defaultConfig {
  applicationId = "org.masjidibrahim.tv.staging"
  minSdk = 23
  targetSdk = 28
  versionCode = 2
  versionName = "0.2-d04-staging"
 }
 buildTypes { getByName("release") { isMinifyEnabled = false } }
 compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
