# ZRCS Policy Safety Checklist

The purpose of this checklist is to ensure the complete safety of users and compliance with Google Play / Apple App Store policies regarding ad placements and data privacy.

## Policy Controls

- [ ] **No forced clicks:** Ads must be skippable or dismissible where appropriate. Users must never be forced or tricked into clicking ads.
- [ ] **No ads near keyboard send button:** Banners and native ads must maintain a safe distance from interactive UI elements, particularly the keyboard and the "send message" button.
- [ ] **No ads during live communication:** Interstitials, banners, or rewarded ads are strictly blocked during active WebRTC calls (ringing, connecting, connected, or reconnecting states).
- [ ] **No misleading native ad design:** Native ads must be distinct from application content. They must not mimic chat bubbles or system notifications.
- [ ] **Visible "Sponsored" label:** All native and banner ads must clearly feature an "Ad" or "Sponsored" tag as mandated by network guidelines.
- [ ] **Frequency capping:** Interstitial ads must respect the `interstitial_gap_seconds` configuration to prevent ad fatigue and policy violations regarding ad frequency.
- [ ] **Child/sensitive region controls:** App should defer to network-level COPPA/GDPR compliance SDK wrappers, and we can disable regions proactively via Country Rules.
- [ ] **Country-level disable:** The `ad_country_rules` can immediately kill ad serving in jurisdictions with active policy disputes or compliance issues.
- [ ] **App version targeting:** Faulty mobile releases with policy-violating ad layouts can be specifically targeted and disabled using `ad_version_rules`.
- [ ] **Emergency kill switch:** The master `ads_enabled` switch must instantly propagate to disable all network initializations globally.

## Implementation Guidelines
Any code touching the `MobileConversationScreen`, `CallScreen`, or `KeyboardManager` must pass the QA Gate ensuring these safety checks remain functional.
