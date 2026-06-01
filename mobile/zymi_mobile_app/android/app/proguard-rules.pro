-keep class io.socket.** { *; }
-keep class com.google.gson.** { *; }
-keepnames class * extends java.lang.Exception

# Protect ZYMI Signaling logic
-keep class lib.services.realtime.** { *; }
-keep class lib.services.governance.** { *; }
