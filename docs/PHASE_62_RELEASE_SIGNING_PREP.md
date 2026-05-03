# Phase 62: Release Signing Preparation

## Current Status
- **Release Signing**: NOT CONFIGURED.
- **Build Mode**: Debug APK (`flutter build apk --debug`).

## Requirements for Production Release
To distribute ZYMI on the Google Play Store or as a signed production APK, the following must be implemented:

1. **Keystore Generation**:
   ```bash
   keytool -genkey -v -keystore zymi-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias zymi
   ```
2. **Key Properties**: Create `android/key.properties` (exclude from version control):
   ```properties
   storePassword=password
   keyPassword=password
   keyAlias=zymi
   storeFile=zymi-release.jks
   ```
3. **Gradle Configuration**: Update `android/app/build.gradle.kts` to load properties and use the `release` signing config.

## Warning
**NEVER** commit the keystore or password file to the repository. Use CI/CD secrets or local environment variables for production builds.
