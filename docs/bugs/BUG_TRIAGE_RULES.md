# ZYMI Bug Triage Rules

## Severity Definitions

### P0 — Critical
- Complete loss of service (all users affected)
- Data loss or corruption
- Security vulnerability (unauthorized access, data leak)
- Payment/billing issues
- **Action:** Immediate fix required. Stop all other work.

### P1 — High
- Major feature broken (e.g., messaging, calls, login)
- Significant performance degradation
- Issue affects many users (≥25%)
- **Action:** Fix within 24 hours. Include in next hotfix.

### P2 — Medium
- Non-critical feature broken (e.g., profile photo, settings)
- Minor performance issue
- Issue affects some users (<25%)
- UI/UX inconsistency
- **Action:** Fix within current sprint or next release.

### P3 — Low
- Cosmetic issue (e.g., typo, alignment)
- Edge case under rare conditions
- Enhancement request
- **Action:** Add to backlog. Fix when resources available.

## Bug Status Definitions

| Status | Definition |
|--------|------------|
| New | Bug filed, not yet reviewed |
| Confirmed | Triaged and reproduced |
| In Progress | Developer actively working on fix |
| Fixed | Code change committed, awaiting retest |
| Retest | QA is verifying the fix |
| Closed | Fix verified and deployed |
| Won't Fix | Accepted as known limitation or intentional design choice |

## Triage Process

1. **Daily triage** — New bugs reviewed within 24 hours
2. **Severity assignment** — Based on impact × frequency
3. **Owner assignment** — Based on component expertise
4. **P0/P1 escalation** — Notify on-call engineer immediately
5. **Regression check** — Verify fix doesn't break related features

## SLA Targets

| Severity | First Response | Fix Deadline |
|----------|---------------|--------------|
| P0 | 1 hour | 8 hours |
| P1 | 4 hours | 24 hours |
| P2 | 24 hours | Next sprint |
| P3 | 1 week | Backlog |
