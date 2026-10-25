# Masjid Ibrahim — expansion development baseline
Status: Phase 1 implementation in **development/multiscreen-presenter-v1**. Production main branch and existing outdoor TV APK are unchanged.

## Boundaries
- Separate Vercel staging project and Supabase staging project are required before enabling integrations. Never point staging at production Supabase.
- Do not connect this development branch to production deployments. Do not modify the existing `/` dashboard.
- Target $0 recurring expense; provider eligibility, quotas and actual free-tier suitability require validation before activation.

## Confirmed product behavior
- One Android TV APK, device registration by expiring six-digit pairing code (admin approval required).
- Admin-assigned default display per TV; temporary remote selection expires on app restart or Admin override. Wake from standby resumes and synchronizes.
- Attempt TV auto-launch at full boot, subject to device/OS testing.
- Admin selects TVs for live presentations; these switch automatically and revert to assigned defaults at session end.
- Individual revocable presenter links, one presentation **in the entire system** at a time. Authorized presenter or Admin can clear after confirmation.
- PPTX/PDF up to 50 MiB; render static high-resolution slide images locally on presenter's Windows or Mac laptop. PPTX requires optional helper for reliable conversion and note extraction; PDF is browser-rendered fallback without notes.
- Preserve original slide aspect ratio, navy margins; notes never included in public audience data.
- Presenter controls from laptop keyboard/buttons only. Current slide, next slide and private notes; 30-minute disconnection grace.
- Audience Q&A at permanent /ask URL when enabled on active presentation, sent directly to presenter without moderation; no attendee account; optional name. Rate limiting is required.
- Speaker-controlled bottom QR banner that scales whole slide to fit; questions and presentation assets deleted on clear.
- Unstarted presentations clear 24 hours after upload; ended presentations clear after configurable retention (default 7 days), active sessions protected.
- Existing PRISM Windows 11 livestream captures permanent audience view. Internet outage recovery is not required for presentation.

## Staging-first execution order
1. Models, database schema, security policies, UI previews, validation tests.
2. Set up separate Supabase and Vercel staging, with secrets; test basic authentication and permission boundaries.
3. Implement secure upload, one-presentation transaction lock, conversion pipeline, private notes and presenter controls.
4. Implement authenticated live session state, attendee Q&A, public audience view, cleanup and Windows/Mac conversion helper.
5. Implement device pairing, Admin TV assignment, Android selector/remote support, and OS-dependent boot behavior.
6. Validate on one inside-hall TV, PRISM, and test laptop. Deploy to Masjid devices only after explicit approval.

## Critical unresolved engineering details
- Reliable browser-to-local-converter handoff and signed/notarized Windows/macOS installers; PDF.js rendering approach.
- Backend-authorized presenter token exchange, rotation and immediate revocation, without leaking presenter secret in storage or logs.
- Atomic one-presentation gate (not a frontend-only check).
- Staging Supabase and Vercel project availability, platform terms, budgets and alerts.
- Staging test device registration and Android TV manufacturer boot limitations.

## Safety rules
Never use production Supabase project keys for development. Never ship public presenter notes or allow an unauthenticated browser to write presentation/TV state. API routes must fail closed until staging configuration and database policies are verified.
