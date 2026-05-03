# Phase 60: Relay Usage & Cost Guard QA Report

## Objective
Verify that WebRTC relay usage is correctly tracked and that bandwidth/duration limits are enforced per user/country.

## Data Points Verified
- `bytes_estimated`: Bandwidth utilization per session.
- `duration_seconds`: Session length for billing/cost estimation.
- `country_iso`: Regional traffic distribution.

## Test Matrix

| Case ID | Test Description | Expected Result | Result |
|---------|------------------|-----------------|--------|
| CG-01 | Usage Logging | API /api/connectivity/relay-usage saves data to DB | PASS |
| CG-02 | Bandwidth Tracking | Media DataChannel reports estimated bytes | PASS |
| CG-03 | Duration Tracking | Call service reports active relay duration | PASS |
| CG-04 | Cost Guard Limits | Users exceeding daily limits are flagged in Admin | PASS |
| CG-05 | Anomaly Detection | High usage sessions appear in anomaly table | PASS |
| CG-06 | Admin Config | Cost guard rules can be updated via UI | PASS |

## Privacy Audit
- **No Media Storage**: Verified that `relay_usage_stats` does not store filenames or content.
- **No IP Leakage**: Verified that raw ICE candidates are not stored in usage logs.
- **Anonymization**: Usage is linked to `user_id` but no PII is exposed in statistics.

## Conclusion
The relay cost guard system is operational and provides the necessary controls to prevent infrastructure abuse and manage bandwidth costs effectively.
