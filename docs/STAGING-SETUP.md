# Dedicated staging setup — pending access
Do not connect staging to production Supabase, do not alter `main`, and do not test live TV pairing using production credentials.

## Current blocker
Vercel integration can list the existing project but its POST create-project operation returns 403 for team `ashraf310s-projects`. Grant the Vercel connector access to this team or create a separate staging Vercel project directly in the Vercel dashboard. Do not set its production branch to `main`; connect it to `development/multiscreen-presenter-v1` only.
No staging Supabase project has been created or configured.

## Human staging setup checklist
1. Vercel: create `masjid-ibrahim-staging` and connect the repo with the development branch selected as the production branch **of the staging project**, not production project.
2. Supabase: create a completely separate free staging project, where eligible. Do not reuse any production keys.
3. In staging Supabase SQL editor, review and run the migration `supabase/migrations/20261020_live_presentations_initial.sql`.
4. Configure secrets in the staging Vercel project only, after API authorization is implemented and validated. Avoid placing service-role secrets in `NEXT_PUBLIC_*`.
5. Keep live presenter and device APIs disabled by default until access checks and migrations are tested.
6. Verify both environment URLs and billing limits before enabling test uploads.

## Working preview
The existing repo's development preview build passed. The preview page `/expansion-preview` needs `NEXT_PUBLIC_ENABLE_EXPANSION_PREVIEW=true` to show the screen selector. The new `/presenter-demo` is visual-only and must not be treated as an authenticated presenter portal.

## Acceptance gates
- Test PDF & PPTX with Mac and Windows, preserve aspect ratios.
- Security: signed presenter links, token revocation, public Q&A rate limits, private notes.
- Unique presentation-slot enforcement; atomic cleanup and retry.
- Device pairing and Admin registration; monitor stale/offline.
- PRISM permanent browser source, browser compatibility.
- Testing and approval before any changes to existing outdoor TV.
