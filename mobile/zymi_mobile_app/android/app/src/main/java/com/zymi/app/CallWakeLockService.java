package com.zymi.app;

import android.content.Context;
import android.content.Intent;
import android.os.IBinder;
import android.os.PowerManager;
import android.app.Service;
import android.util.Log;
import com.example.zymi_mobile_app.MainActivity;

/**
 * CallWakeLockService — Android WakeLock Manager
 *
 * Acquires a PARTIAL_WAKE_LOCK | ACQUIRE_CAUSES_WAKEUP when an incoming call
 * is signaled from the Background Isolate. The lock is held for the duration
 * of the 30-second ring timeout, and released explicitly when:
 *   1. The call is answered (CALL_ANSWERED intent)
 *   2. The call is ignored/missed (CALL_IGNORED intent)
 *   3. The 30s timeout elapses (fail-safe auto-release)
 *
 * This ensures the CPU wakes from deep sleep to deliver the ringtone and
 * render the incoming call UI, without permanently draining the battery.
 *
 * Validation: adb shell dumpsys power | grep "ZYMI:CallWakeLock"
 */
public class CallWakeLockService extends Service {

    private static final String TAG = "ZYMI:CallWakeLock";
    private static final int RING_TIMEOUT_MS = 30_000; // 30s ring window

    public static final String ACTION_ACQUIRE  = "com.zymi.app.ACQUIRE_WAKELOCK";
    public static final String ACTION_RELEASE  = "com.zymi.app.RELEASE_WAKELOCK";

    private PowerManager.WakeLock wakeLock;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        final String action = intent.getAction();
        if (ACTION_ACQUIRE.equals(action)) {
            acquireWakeLock();
        } else if (ACTION_RELEASE.equals(action)) {
            releaseWakeLock();
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    private void acquireWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            Log.d(TAG, "WakeLock already held, skipping acquire");
            return;
        }
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                TAG
            );
            // Acquire with timeout: auto-releases after RING_TIMEOUT_MS as a fail-safe
            wakeLock.acquire(RING_TIMEOUT_MS);
            Log.d(TAG, "WakeLock acquired for " + RING_TIMEOUT_MS + "ms");
        } catch (Exception e) {
            Log.e(TAG, "WakeLock denied by OS. Branch Fallback: Triggering Full-Screen Intent.");
            try {
                // Assuming there's a MainActivity or CallActivity configured for full-screen
                Intent fullScreenIntent = new Intent(this, MainActivity.class);
                fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
                startActivity(fullScreenIntent);
            } catch (Exception innerE) {
                Log.e(TAG, "Fallback Intent failed", innerE);
            }
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            wakeLock = null;
            Log.d(TAG, "WakeLock released");
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not a bound service
    }

    @Override
    public void onDestroy() {
        releaseWakeLock(); // Safety net: ensure lock is never leaked
        super.onDestroy();
    }

    /** Convenience factory: start from Flutter via MethodChannel or from BG service */
    public static void acquire(Context context) {
        Intent intent = new Intent(context, CallWakeLockService.class);
        intent.setAction(ACTION_ACQUIRE);
        context.startService(intent);
    }

    public static void release(Context context) {
        Intent intent = new Intent(context, CallWakeLockService.class);
        intent.setAction(ACTION_RELEASE);
        context.startService(intent);
    }
}
