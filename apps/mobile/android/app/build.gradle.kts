import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

fun releaseSigningFromEnvironment(): Map<String, String>? {
    val storePath = System.getenv("KEYSTORE_PATH")?.trim().orEmpty()
    val keyAlias = System.getenv("KEY_ALIAS")?.trim().orEmpty()
    val storePassword = System.getenv("STORE_PASSWORD")?.trim().orEmpty()
    val keyPassword = System.getenv("KEY_PASSWORD")?.trim().orEmpty().ifEmpty { storePassword }
    if (storePath.isEmpty() || keyAlias.isEmpty() || storePassword.isEmpty()) {
        return null
    }
    return mapOf(
        "storeFile" to storePath,
        "keyAlias" to keyAlias,
        "storePassword" to storePassword,
        "keyPassword" to keyPassword,
    )
}

val releaseSigningFromFile: Map<String, String>? =
    if (keystorePropertiesFile.exists()) {
        val storeFile = keystoreProperties.getProperty("storeFile")?.trim().orEmpty()
        val keyAlias = keystoreProperties.getProperty("keyAlias")?.trim().orEmpty()
        val storePassword = keystoreProperties.getProperty("storePassword")?.trim().orEmpty()
        val keyPassword =
            keystoreProperties.getProperty("keyPassword")?.trim().orEmpty().ifEmpty {
                storePassword
            }
        if (storeFile.isNotEmpty() && keyAlias.isNotEmpty() && storePassword.isNotEmpty()) {
            mapOf(
                "storeFile" to storeFile,
                "keyAlias" to keyAlias,
                "storePassword" to storePassword,
                "keyPassword" to keyPassword,
            )
        } else {
            null
        }
    } else {
        null
    }

val releaseSigning = releaseSigningFromEnvironment() ?: releaseSigningFromFile

android {
    namespace = "com.studyzhouse.app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.studyzhouse.app"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            releaseSigning?.let { signing ->
                val storePath = signing["storeFile"]!!
                storeFile =
                    if (storePath.startsWith("/") || storePath.contains(":")) {
                        file(storePath)
                    } else {
                        rootProject.file(storePath)
                    }
                keyAlias = signing["keyAlias"]
                storePassword = signing["storePassword"]
                keyPassword = signing["keyPassword"]
            }
        }
    }

    buildTypes {
        release {
            signingConfig =
                if (releaseSigning != null) {
                    signingConfigs.getByName("release")
                } else {
                    // Local builds without upload keystore still work (debug signing).
                    signingConfigs.getByName("debug")
                }
        }
    }
}

flutter {
    source = "../.."
}
