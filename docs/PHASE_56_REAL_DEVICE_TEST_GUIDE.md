# PHASE 56: REAL DEVICE TEST GUIDE

## 1. Environment Setup
- **Network:** Ensure the test Android/iOS device is on the same Wi-Fi network as the server/PC.
- **Server URL:** Identify your PC's LAN IP (e.g., `192.168.1.50`).
- **App Config:** Update `client/src/config/api.js` or mobile `auth_service.dart` to point to the LAN IP.

## 2. Test Execution Steps
### Step 1: Connectivity
- Open the app on the real device.
- Verify the login screen loads.
- Check if the "Offline/Connected" indicator in the app bar turns green.

### Step 2: Authentication
- Register a new account.
- Request an Email OTP.
- Verify the OTP succeeds.
- Request a Phone Verification Link.
- Open the link in the device's browser (e.g., Chrome/Safari).
- Enter the simulation OTP and verify.

### Step 3: Real-time Communication
- Login on a second device (or emulator).
- Send a private message from Device A to Device B.
- Verify receipt and typing indicators.

### Step 4: WebRTC Call
- Initiate a call from Device A to Device B.
- Grant Camera/Mic permissions on the real device.
- Verify local and remote video streams.
- End the call and verify both devices return to the home screen.
- **Critical:** Ensure NO ADS appeared during the call.

### Step 5: Admin Dashboard
- Login as Admin on the Desktop client.
- Verify that the real-device activity (new user, new call) is reflected in the Project Brain Dashboard.

---
*Prepared by: Antigravity*
