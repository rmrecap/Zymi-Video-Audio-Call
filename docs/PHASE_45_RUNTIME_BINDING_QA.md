# PHASE 45 — RUNTIME BINDING QA MATRIX

| # | Scenario | App State Simulation | Expected Ad Behavior | Actual Result |
|---|---|---|---|---|
| 1 | Idle / Safe | All false | Banner visible, Interstitial allowed | PASS |
| 2 | Typing in Chat | `isTyping = true` | **BLOCKED** (Banner hidden) | PASS |
| 3 | Chat Input Focused | `isComposerFocused = true` | **BLOCKED** | PASS |
| 4 | Incoming Call | `isRinging = true` | **BLOCKED** | PASS |
| 5 | Call Connecting | `isConnectingCall = true` | **BLOCKED** | PASS |
| 6 | Active Call | `isInCall = true` | **BLOCKED** | PASS |
| 7 | Camera Active | `isCameraActive = true` | **BLOCKED** | PASS |
| 8 | Mic Active | `isMicActive = true` | **BLOCKED** | PASS |
| 9 | Call Just Ended | `isInGracePeriod = true` | **BLOCKED** (for 10s) | PASS |
| 10 | Post-Grace Period | `isInGracePeriod = false` | **ALLOWED** | PASS |

## Verification Notes:
- States are bound via `RuntimeStateBinder`.
- `SafeBannerAd` widget rebuilds automatically on state changes.
- `InterstitialAdManager` and `RewardedAdManager` verify `appRuntimeState.canShowAds` before loading/showing.
- `AdBlockedNotice` displays real-time reason for blocking in Debug Screen.
