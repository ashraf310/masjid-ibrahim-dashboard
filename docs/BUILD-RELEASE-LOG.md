# Masjid Ibrahim — Build & Release Register

This file records **verified** build and deployment state. Update it in the same pull request as each release; never mark a deployment successful until Vercel / GitHub Actions confirms it.

## Release policy (APPROVED by project owner — October 25, 2026)
- **Local workspace:** edit and run checks locally; not a deployment or source of truth.
- **Development:** `development/multiscreen-presenter-v1` is current development branch; sync it with `main` before new work.
- **Staging:** local-first workflow: commit development changes to GitHub, pull/test locally, and only trigger a staging build/deployment after the owner explicitly requests it. Do not automatically deploy from chat. Install staging Android APK only when a specific build is approved.
- **Production:** only after owner explicitly approves each specific release; merge through a PR to `main`, build separate production Android APK if Android code changed, deploy production Vercel explicitly, verify, then update this register.
- **Never** copy production secrets/data to staging or point staging devices at production.
- Each change should have an ID, summary, affected modules, commit, test result, environment, APK version (if relevant), approval, deployment ID, rollback.
- A code commit is **not** evidence of a deployment. A READY deploy is **not** proof of full end-to-end device testing.
- No silent production deploys. Urgent production hotfixes require explicit approval too.
- Download APKs remain manually tested before wider TV installation.

## Verified baseline — October 25, 2026 (America/Chicago)

| Environment / asset | State | Verified reference | Notes |
|---|---|---|---|
| GitHub production branch | main at `6d395caea6d3c3da76df8556b1c154349533a140` | GitHub branch check | Includes full web app, APK upload, production Downloads page |
| Production web app | Vercel READY | `dpl_8b3UBATdf6CsFGiQHQz2Dfee1XXd`, commit `6d395ca...` | Domain: https://masjid-ibrahim-dashboard.vercel.app |
| Full application web release | Merged PR #2 | `f0b58936493f3526cf7445058b69eefe38bbe88c` | D01, D02, D04, Admin, Presenter, TV management |
| Production Android APK | GitHub Actions SUCCESS | Run `40260009498`, artifact `12623607460` | Debug-signed v1.0-production, package `org.masjidibrahim.tv.production`; file `public/downloads/masjid-ibrahim-tv-production.apk` |
| Production APK downloads page | Code & APK present in main | Downloads page updated `f9a06ac6`; file present on `main` | URL: https://masjid-ibrahim-dashboard.vercel.app/downloads |
| Development branch | Exists at `a9ff2baa82ac2d23d9e13b23fe90d47471879d7c` | GitHub branch check | Diverged from main; re-sync prior to starting the next feature |
| Staging Vercel app | Separate project exists | Project `masjid-ibrahim-staging` | Current deployed commit **not verified in this baseline** |
| Local workspace | Not verified | — | No assumption that local files match GitHub |
| Production PowerPoint conversion | User tested SUCCESS | Local helper origin update `278180d8` | Browser helper is local; test on other PCs not yet performed |
| Production presenter / TV admin | User tested partial flows | User confirmed login, presenter PIN, pairing-code generation | D02 full broadcast and physical production pairing **not yet verified** |

## Change log

| ID | Date | Change | Source commit / build | Staging test | Production deploy | Acceptance |
|---|---|---|---|---|---|---|
| MI-REL-001 | 2026-10-25 | Full web release with presenter, TV management, D01/D02/D04 | PR #2 / `f0b58936` | Preview admin/PIN tests | `dpl_4TGgUiv2VjppfW1ymvgkq3g3wfbj` READY | Partial, TV end-to-end pending |
| MI-FIX-001 | 2026-10-25 | Permit official production domain for local PPTX conversion helper | `278180d8` | N/A | Local helper file must be replaced per PC | User confirmed working |
| MI-APK-001 | 2026-10-25 | Separate production Android APK v1.0 | Workflow run `40260009498` SUCCESS | N/A | APK uploaded to main, published via `dpl_8b3UBATdf6CsFGiQHQz2Dfee1XXd` | Physical TV pairing and reboot tests pending |
| MI-WEB-001 | 2026-10-25 | Production Downloads page points to production APK | `f9a06ac6` | Not tested | `dpl_8b3UBATdf6CsFGiQHQz2Dfee1XXd` READY | End-user download/install pending |

| MI-OPS-001 | 2026-10-25 | Synchronize development with approved main baseline | PR #3 / `a3f5dee52ced954b696c8cc4df436f634b692bc7` | Not required — source sync only | None | GitHub compare verified `behind_by=0`; development ready for next change |

| MI-FIX-002 | 2026-10-25 | Reduce Maghrib-only countdown label size and add separator spacing in D04 Premium (`components/D04Premium.tsx`); D01 variant validation pending | `084467e2fa748ed372d3322a86ecb69c6e1f1497` | Local test pending; no staging deployment requested | Not approved / not deployed | Awaiting local validation; no APK build |

| MI-ENH-001 | 2026-10-25 | Integrate TV Management into authenticated Admin as TV MANAGEMENT tab; legacy `/tv-management` redirects to `/admin?tab=tvs`; existing TV controls preserved | `daaceccb`, `6ca4772`, `bf40211` | Local build/UI test pending; no staging deployment authorized | Not approved / not deployed | No Android change; rollback: revert listed commits |

| MI-ENH-002 | 2026-10-25 | D03 live screen sharing prototype: authenticated presenter code, screen selection/Go Live, WebRTC receiver, `/live` D03 > D02 fallback, staging Android TV priority, SQL state migration | `4d03003`, `e7f6eca`, `895a666`, `a559294`, `8812ae3`, `7a106bf`, `a2ef023` | NOT TESTED; run SQL migration on isolated local/staging test database before attempting; requires multi-device/WebRTC security review | NOT APPROVED / NOT DEPLOYED | Staging Android source changed; APK not built. Existing production APK v1.0 unchanged |

| MI-ENH-003 | 2026-10-26 | PRISM automation requirements: auto select camera/presentation scene and start stream with D02/D03; D03 priority; auto stop after final session | Requirements: `docs/MI-ENH-003-PRISM-AUTOMATION.md` | Feasibility and local test NOT STARTED | NOT APPROVED / NOT DEPLOYED | Requirements only; code/build unchanged |

| MI-FIX-003 | 2026-10-26 | Replace fragile exact updated_at comparison with atomic idle/expired-heartbeat condition for D03 session start (`app/api/d03/route.ts`); no SQL migration required | `4598f85d8abd1d136481a8f9f58a3a0417da48d0` | Local retest pending; concurrent start test pending | Not approved / not deployed | No APK change; rollback: revert `4598f85d` |

| MI-ENH-004 | 2026-10-26 | Admin emergency reset ends D03 and active D02 states; Admin can generate or choose 4-digit reusable presenter PIN, list and revoke codes; D03 heartbeat detects forced reset | `3ffe29e1`, `5fcf2788`, `3de8f5af` | Local validation pending (emergency reset, PIN collisions/revocation, live recovery) | Not approved / not deployed | No APK changes; development only |

| MI-ENH-005 | 2026-10-26 | Simplify presenter route to `/live`, PRISM/TV receiver route to `/public`, redirect old `/live-presenter` to `/live`; staging Android D03 address updated; D02 `/audience-live` unchanged | `b0daca8`, `4acf482`, `12e0adc`, `75ece5a`, `37d54f6`, `a5b1bde` | Local browser route and D03 streaming retest pending | Not approved / not deployed | Staging Android source only, no APK built; production unchanged |

| MI-FIX-004 | 2026-10-26 | D04 full-screen flicker mitigation: retain last confirmed D03 status on transient API errors, require two consistent screen-change polls before staging TV WebView navigation, isolate premium D04 ticker paint | `ca40dede8`, `3190e113` | NOT TESTED locally/physical TV; actual flicker root cause not proven | Not approved / not deployed | Staging Android source requires rebuilt APK; currently installed APK unchanged |

| MI-UI-001 | 2026-10-26 | Increase D04 Premium NEXT IQAMAH countdown font from `clamp(24px,3.2vw,67px)` to `clamp(28px,3.8vw,78px)` to visually match prayer name on large TVs; no other layout changes | `f5209c44` | Awaiting local display validation at target TV size | Not approved / not deployed | No APK source change |

| MI-ENH-006 | 2026-10-26 | Add TV registration in Admin → TV Management, auto assign TV07–TV99, extend API pairing and staging Android TV ID validation; existing TV04/TV06 exclusions retained | `b4d81362`, `3c6ae7cd`, `f83c3e15`, `0e0b0672` | Untested; confirm `tv_devices` database constraints permit new IDs; staging APK rebuild required to pair new TVs | Not approved / not deployed | Production unaffected |

| MI-FIX-005 | 2026-10-26 | Fix incorrect four-digit custom presenter PIN regex; clarify saved presenter list (names/status/dates only; PIN hashes are unrecoverable); move optional D02 presentation-slot cleanup under Advanced troubleshooting | `690f4cdf`, `6d1a328a`, `391635f5` | Local validation pending | Not approved / not deployed | No schema or APK changes |

| MI-FIX-006 | 2026-10-26 | TV Management: editable location/name on all TVs, Delete TV for newly added TV07+, preserve TV04 camera-only and TV06 unassigned, improve add failure diagnostic; staging SQL migration for legacy TV ID check | `ea95eb79`, `4a073fd1`, `6a8f3a98` | UNTESTED; migration requires explicit run in staging Supabase SQL Editor; do not run on production | Not approved / not deployed | No APK changes this fix; expanded ID support still needs staging APK build |

| MI-FIX-007 | 2026-10-26 | Make TV04 and TV06 removable/re-registerable, unlock fixed-ID dashboard/activation restrictions, allow deletion of any TV with confirmation; expand staging pairing/APK ID rules | `5fa8ca6d`, `3092bdff`, `cf88434d`, `afc80a09`, `363e5600`, `0c8549b1` | NOT TESTED; existing TV04/TV06 database rows NOT deleted by code commit; delete through admin UI after local pull or staging SQL | NOT DEPLOYED | New staging APK required before reassigned TV04/TV06 can pair; production unchanged |

| MI-UI-002 | 2026-10-26 | Update D03 `/live` title to 'Masjid Ibrahim - Live Presentation' and show 'Welcome, {presenter name}' after access-code authentication; name comes from authenticated presenter label | `b9ae5ade` | Local UI check pending | Not approved / not deployed | No API, database, or APK changes |

| MI-UI-003 | 2026-10-26 | D03 `/live` presenter PIN field: discourage browser password-manager autofill, limit to four digits and retain empty initial state | `365b8794` | Local browser verification pending; password-manager behavior can vary | Not approved / not deployed | No APK changes |

| MI-UI-004 | 2026-10-26 | Separate Android launcher icons: production manifest references official Masjid Ibrahim white logo on navy vector background; staging retains the platform's default icon and STAGING app label | `fb53ab71`, `da998ba5` | Production Android build/icon on device NOT TESTED; production APK unchanged | Not approved / not deployed | Included only in a FUTURE production APK build from approved code; staging APK unaffected |

## Template for future entry

`MI-### | date | description | files/modules | local commit/test | staging deployment/test | production approval | production deployment | Android APK version/build | verified/rollback`

## Current acceptance queue

- [ ] Full D02 slide publish, start, advance, Q&A, end, standby.
- [ ] Production Android TV pairing on one physical TV.
- [ ] TV profile D01/D04, switching D04 ↔ D02 on live session.
- [ ] Cold reboot / app autostart and connectivity recovery.
- [ ] Guest portal link access and presenter revocation test.
- [ ] Verify production downloads page and APK installation end to end.
