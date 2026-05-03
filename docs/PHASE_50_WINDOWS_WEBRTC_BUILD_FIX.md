# PHASE 50 — WINDOWS WEBRTC BUILD FIX

To successfully compile the Flutter APK with `flutter_webrtc` on a Windows host, you must enable **Developer Mode**. This is required because the C++ toolchain for WebRTC needs to create symlinks, which standard Windows user accounts are restricted from doing by default.

## Steps to Enable:

1. Open your terminal (PowerShell/Command Prompt).
2. Run the following command to open the exact settings page:
   ```powershell
   start ms-settings:developers
   ```
3. Toggle **Developer Mode** to ON.
4. Accept the warning prompt from Windows.
5. Restart your terminal (or VS Code) to ensure the permissions propagate.
6. Clean and rebuild the project:
   ```bash
   flutter clean
   flutter pub get
   flutter build apk --debug
   ```

**Note:** You only need to do this once per machine.
