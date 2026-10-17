plugins { id("com.android.application") }
android {
    namespace = "org.masjidibrahim.tv"
    compileSdk = 35
    defaultConfig {
        applicationId = "org.masjidibrahim.tv"
        minSdk = 23
        targetSdk = 28
        versionCode = 1
        versionName = "1.0"
    }
    buildTypes {
        release { isMinifyEnabled = false }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
