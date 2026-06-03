# ZYMI Beta Bug Tracker

**Status**: Draft — For use during PHASE 27 Closed Beta

## Bug Report Template

Use the following template for every bug report during closed beta. Each bug must be filed in a markdown file under `docs/bugs/` with the naming convention `BUG-<NUMBER>.md`.

```markdown
# BUG-<NUMBER>: <Short Descriptive Title>

## Reporter Information
- **Reporter**: <name or username>
- **Date Reported**: <YYYY-MM-DD>
- **Contact**: <email or handle>

## Environment
- **Device**: <e.g., Samsung Galaxy S22, iPhone 14, Custom Desktop>
- **OS Version**: <e.g., Android 14, iOS 17.4, Windows 11, macOS 14.3>
- **App Version**: <e.g., ZYMI Web v1.0.0, ZYMI Mobile v1.0.0>
- **Browser** (if web): <e.g., Chrome 124, Safari 17.4>
- **Network Type**: <WiFi / Mobile Data 4G/5G / Slow Network / Wired>

## Feature Details
- **Feature**: <e.g., Private Chat, 1:1 Video Call, Group Call, Registration>
- **Endpoint/Event**: <e.g., POST /api/messages, socket.io private-message event>

## Steps to Reproduce
1. <Step 1>
2. <Step 2>
3. <Step 3>
...

## Expected Result
<What should happen>

## Actual Result
<What actually happened>

## Evidence
- **Screenshot/Video**: <link or file path>
- **Console Logs**: <relevant logs>
- **Network Tab**: <request/response payloads>

## Severity
- [ ] **Critical** — Blocks core flow, no workaround
- [ ] **High** — Major feature broken, workaround exists
- [ ] **Medium** — Non-core feature broken
- [ ] **Low** — Cosmetic/UX issue, minor annoyance
- [ ] **Suggestion** — Enhancement request

## Priority
- [ ] **P0** — Must fix before next release
- [ ] **P1** — Must fix before public launch
- [ ] **P2** — Fix in current milestone
- [ ] **P3** — Fix in future milestone
- [ ] **P4** — Deferred / Won't fix

## Assigned To
- **Owner**: <name>
- **Fix Version**: <e.g., v1.0.1, v1.1.0>

## Status
- [ ] **New** — Reported, not yet triaged
- [ ] **Triaged** — Confirmed and assigned
- [ ] **In Progress** — Being worked on
- [ ] **Fixed** — Code change committed
- [ ] **Verified** — QA confirmed fix
- [ ] **Closed** — Fix deployed and accepted
- [ ] **Won't Fix** — Decision to not address

## Resolution Notes
<How the bug was resolved, what changed, affected files>
```

---

## Bug List (Master Index)

| Bug ID | Reporter | Feature | Severity | Priority | Status | Date |
|--------|----------|---------|----------|----------|--------|------|
| | | | | | | |
| | | | | | | |

---

## Severity Definitions

| Level | Definition | SLA |
|-------|------------|-----|
| **Critical** | Core flow completely blocked (cannot register, cannot send messages, cannot make calls). No workaround exists. | Fix within 24 hours |
| **High** | Major feature broken but workaround exists (e.g., group call fails but 1:1 call works) | Fix within 72 hours |
| **Medium** | Feature partially broken or degraded (e.g., typing indicator not showing) | Fix within 1 week |
| **Low** | Cosmetic issue, typo, minor alignment, performance nit | Fix within 2 weeks |
| **Suggestion** | Feature enhancement, not a bug | Schedule for future milestone |

## Priority Definitions

| Priority | Meaning | Action |
|----------|---------|--------|
| **P0** | Blocks release | Must be fixed before next build goes out |
| **P1** | Blocks launch | Must be fixed before public beta |
| **P2** | Current milestone | Targeted for current development cycle |
| **P3** | Future milestone | Scheduled but not urgent |
| **P4** | Deferred | No current plan to address |

---

## Bug Triage Process

```
1. RECEIVE
   - Bug filed via email, test session, or automated report
   - Verify the bug is NOT a duplicate (search master index)
   - Assign BUG-<NEXT NUMBER> ID

2. TRIAGE (within 24 hours)
   - Reproduce the bug in test environment
   - Confirm severity and priority
   - Assign owner
   - Add to master index

3. FIX
   - Owner implements fix
   - Owner adds resolution notes
   - Move status to "Fixed"

4. VERIFY
   - QA or reporter tests the fix
   - If fixed: move to "Verified"
   - If not fixed: move back to "In Progress" with notes

5. CLOSE
   - Fix is deployed to production
   - Move to "Closed"
   - Notify reporter
```

---

## Bug Filing Rules

1. **One bug per report** — Do not combine multiple issues in one file
2. **Reproduce first** — Verify the bug exists before filing
3. **Include evidence** — Screenshots and logs are required for critical/high bugs
4. **No duplicates** — Search the master index before filing
5. **No feature requests as bugs** — Use the Suggestion severity for enhancements
6. **No blame** — Bug reports are about the code, not the author
