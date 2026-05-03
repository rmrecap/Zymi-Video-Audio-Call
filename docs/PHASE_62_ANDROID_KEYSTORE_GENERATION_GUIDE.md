# Phase 62: Android Keystore Generation Guide

## Prerequisites
- Java JDK 17+ installed (bundled with Android Studio or standalone)
- `keytool` available in PATH

## Step 1: Generate Production Keystore

```bash
keytool -genkey -v \
  -keystore zymi-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias zymi
```

You will be prompted for:
- Keystore password (min 6 characters, use a strong password)
- Key password (can be the same as keystore password)
- Your name, organization, country, etc.

## Step 2: Store the Keystore Securely

Place the generated `zymi-release.jks` file in a secure location:

```
mobile/zymi_mobile_app/android/keystore/zymi-release.jks
```

> **WARNING**: NEVER commit the keystore file to Git. The `.gitignore` already excludes `*.jks` and `*.keystore` files.

For backup:
- Store a copy in a password-protected cloud vault (Google Drive encrypted, 1Password, etc.)
- If the keystore is lost, you cannot update the app on the Play Store

## Step 3: Create key.properties

Copy the example file:
```bash
cp android/key.properties.example android/key.properties
```

Fill in your actual values:
```properties
storePassword=your_actual_keystore_password
keyPassword=your_actual_key_password
keyAlias=zymi
storeFile=../keystore/zymi-release.jks
```

## Step 4: Build Signed Release AAB

```bash
flutter build appbundle --release
```

Output will be at:
```
build/app/outputs/bundle/release/app-release.aab
```

## Step 5: Build Signed Release APK (for sideloading)

```bash
flutter build apk --release
```

Output will be at:
```
build/app/outputs/flutter-apk/app-release.apk
```

## Play Store Upload

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing
3. Go to **Production** > **Create new release**
4. Upload the `.aab` file (NOT the `.apk`)
5. Google Play requires AAB format for new apps since August 2021

## Security Checklist
- [ ] Keystore file is NOT in version control
- [ ] key.properties is NOT in version control
- [ ] Keystore is backed up in a secure location
- [ ] Keystore password is stored in a password manager
- [ ] Only authorized team members have access to the keystore
