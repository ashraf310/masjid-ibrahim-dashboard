# MI-ENH-003 — PRISM Live Studio Automation (Requirements)

**Status:** Requirements agreed in conversation; feasibility prototype pending. **No implementation authorized.**
**Tracking correction:** MI-ENH-001 was already assigned to Admin TV Management integration, and MI-ENH-002 to D03. This item is MI-ENH-003.
**Scope:** D02 slides and D03 screen sharing; PRISM on the back-office Windows PC; YouTube streaming; TV transitions. Existing D03 development is not yet accepted for staging or production.

## Approved decisions
- Keep **PRISM Live Studio**, not OBS, for this release.
- Presenters trigger broadcasting indirectly by starting an authorized D02 or D03 session; no back-office visit, manual browser URL opening, PRISM scene selection, or Go Live interaction should be necessary once the system is configured.
- Use a permanent PRISM scene with camera plus a browser source displaying audience-only D02/D03 content. Private presenter notes must never enter this browser source.
- D03 has priority over D02. A change between D02/D03 must not interrupt or restart an ongoing broadcast.
- When the **last active** D02 or D03 ends deliberately, **automatically stop YouTube streaming**. Do not stop when D03 ends while D02 is still active, or vice versa.
- If there is no active session, paired presentation TVs return to configured default dashboards.
- Require no public inbound access to the back-office Windows computer. Use an authenticated outbound connection/polling controller with least-privilege controls.
- Prevent duplicate starts/stops; distinguish requested state from confirmed PRISM/YouTube broadcast state.
- A brief network loss should not be interpreted as an explicit final-session end; bounded grace/reconnect policy to be specified and tested.
- Surface controller online/offline, active mode, requested broadcast state, verified broadcast state, and errors to admin.
- Only authorized, valid presentation sessions may trigger the automation. Browsing a D02/D03 audience URL alone cannot start YouTube.

## State transition acceptance matrix

| Trigger | Audience/browser scene | TV behavior | YouTube |
|---|---|---|---|
| No D02/D03 | Standby | Assigned dashboard | Stopped |
| D02 starts | D02 slides | D02 for configured presentation TVs | Start once |
| D03 starts during D02 | D03 screen share | D03 overrides D02 | Continue, no restart |
| D03 ends and D02 remains | D02 slides | Return to D02 | Continue |
| D02 ends and D03 remains | D03 share | Remain D03 | Continue |
| Last active D02/D03 ends | Standby | Restore assigned dashboards | Stop automatically |
| Back-office controller offline | Independent audience state | TVs still follow cloud state | Mark as unavailable/unknown; no false “live” confirmation |

## Feasibility gates and risks
1. Verify PRISM hotkeys can reliably select a scene and start/stop streaming on the actual back-office Windows session, including window focus and confirmation-dialog behavior; PRISM desktop control API availability is unconfirmed.
2. Verify reliable stream state observation; merely sending keys does not confirm PRISM/YouTube is broadcasting. Do not label start/stop automation as complete without confirmation.
3. Verify a stable browser source URL for D02/D03 and speaker-note isolation; no weekly changing links.
4. Verify behavior with Windows startup, lock, sleep, disconnection, PRISM restart, session concurrency, session expiry, and YouTube encoder settings. Define manual emergency stop for admins.
5. Avoid automatically restarting broadcasts after a deliberate final end or due to stale/cloud replayed state.
6. Test D03 priority only after its underlying feature passes security and multi-device testing.

## Next steps (planning only)
- **Phase A:** Confirm actual PRISM Windows version, scene/hotkey settings, source browser support and start/stop dialog behavior on the back-office PC. Capture feasible control/verification mechanism.
- **Phase B:** Detail authenticated controller protocol, desired/observed state machine, polling interval, offline handling, permissions, health reporting, admin emergency stop, and recovery rules.
- **Phase C:** Implement in development *after separate authorization*, run local/isolated tests, then obtain approval to deploy staging.
- **Phase D:** Test full camera + D02/D03 + Android TV + YouTube workflow in staging; document evidence and user acceptance.
- **Phase E:** Obtain explicit production approval, deploy the exact tested release, verify in production, update build-and-release register.

**Release policy:** No coding, staging, or production deployment under this requirements-only decision.
