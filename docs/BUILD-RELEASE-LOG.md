# Masjid Ibrahim — Build & Release Register

This file records **verified** build and deployment state. Update it in the same pull request as each release; never mark a deployment successful until Vercel / GitHub Actions confirms it.

## Release policy (APPROVED by project owner — October 25, 2026)
- **Local workspace:** edit and run checks locally; not a deployment or source of truth.
- **Development:** `development/multiscreen-presenter-v1` is current development branch; sync it with `main` before new work.
- **Staging:** deploy a tested development commit to the separate staging Vercel project and staging Supabase; install staging Android APK for device testing.
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

## Template for future entry

`MI-### | date | description | files/modules | local commit/test | staging deployment/test | production approval | production deployment | Android APK version/build | verified/rollback`

## Current acceptance queue

- [ ] Full D02 slide publish, start, advance, Q&A, end, standby.
- [ ] Production Android TV pairing on one physical TV.
- [ ] TV profile D01/D04, switching D04 ↔ D02 on live session.
- [ ] Cold reboot / app autostart and connectivity recovery.
- [ ] Guest portal link access and presenter revocation test.
- [ ] Verify production downloads page and APK installation end to end.
