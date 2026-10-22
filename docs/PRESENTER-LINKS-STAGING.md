# Presenter access and real-upload staging rollout
This implementation is intentionally **disabled** by default. Set flags only after admin authorization, storage ownership and cleanup behavior have been tested.

## Security design
- Presenter link tokens are 32–128 URL-safe characters, stored only as SHA-256 hashes in `presenter_links.token_hash`.
- Never store or log plaintext tokens in the database or source control. The intended private link is `/presenter#token=<random-token>` (fragment avoids token reaching app server through normal page request). Presenter exchanges token via Authorization header; immediately removes hash from displayed URL. This is a convenience protection, not a substitute for HTTPS or token revocation.
- A token must be generated using cryptographically secure randomness and provisioned **through an authorized Admin operation**. No public self-service minting endpoint exists.
- Staging API is hard-bound to Vercel project ID `prj_TX0ZefGHlJUidnjfSMYCXIjm6NuZ`. Its sole key is stored server-side in `SUPABASE_SERVICE_ROLE_KEY`; URL in `SUPABASE_URL`.
- Flag `ENABLE_STAGING_PRESENTER_API=true` allows lookup only. `ENABLE_STAGING_PRESENTER_UPLOADS=true` allows upload reservations, but must not be set until upload lifecycle and atomic cleanup are complete.
- Upload uses Supabase signed upload URLs for bucket `presentation-originals` with file paths scoped to the reserved presentation UUID.
- The current database schema enforces one occupied presentation slot globally, including ended-but-not-cleared sessions.

## Before live upload is enabled
- Confirm staging key is separate from production and no production keys are present.
- Implement and test a secure Admin-only presenter-link creation/revocation UI.
- Handle partial uploads, stuck reservations, file signature validation, file ownership, delete/clear and all failure states.
- Implement reliable slide conversion / private notes extraction (Windows and Mac), then approved PDF fallback.
- Update `/api/presenter/session` capability flags only when real upload behavior and permissions are supported.
- Reject client-supplied content and storage paths outside allocated scope; rate-limit token checks and uploads.

## Test page
`/presenter` is linked only via a private generated link after Admin functionality exists. `/presenter-demo` is visual-only. Do not make staging presenter-link tokens public or place them in a screenshot.
