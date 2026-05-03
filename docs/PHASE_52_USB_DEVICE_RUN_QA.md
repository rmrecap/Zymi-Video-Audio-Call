# PHASE 52 — USB DEVICE RUN QA

## 1. Prerequisites
- USB Debugging enabled on Android device (Settings → Developer Options → USB Debugging)
- Android device connected via USB cable
- Flutter SDK installed and in PATH

## 2. Check Connected Devices
```powershell
flutter devices
```
You should see your device listed (e.g., `MGA LX3 (mobile) • 48ZYD25511402050 • android-arm64`).

## 3. Run on Physical Device
```powershell
cd mobile\zymi_mobile_app
flutter run -d 48ZYD25511402050
```
Replace the device ID with your actual device ID from `flutter devices`.

## 4. CRITICAL: API Base URL Fix
When running on a physical phone, `localhost` refers to the phone itself, NOT your PC. You must use your PC's LAN IP address.

### Find Your PC LAN IP:
```powershell
ipconfig
```
Look for `IPv4 Address` under your active network adapter (e.g., `192.168.1.100`).

### Update Flutter Config:
In `lib/services/realtime/zymi_socket_config.dart`, change:
```dart
// WRONG for physical device:
static const String baseUrl = 'http://localhost:5000';

// CORRECT for physical device:
static const String baseUrl = 'http://192.168.1.100:5000';
```

## 5. ADB Logcat Filtering
To see only ZYMI logs from the connected device:
```powershell
adb logcat -s flutter
```

## 6. Clear App Data
If the app is in a broken state:
```powershell
adb shell pm clear com.example.zymi_mobile_app
```

## 7. Android Internet Permission
Ensure `AndroidManifest.xml` includes:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```
This is required for ALL network communication (Socket.io, HTTP API, WebRTC).
