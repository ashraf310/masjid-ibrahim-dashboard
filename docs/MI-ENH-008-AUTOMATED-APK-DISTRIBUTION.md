# MI-ENH-008 — Automated APK Distribution

**Status:** Backlog / deferred — requirements only. **Not approved for implementation or deployment.**
**Recorded:** 2026-10-26
**Motivation:** Uploading a replacement APK under `public/downloads` on GitHub does not automatically replace the static APK included in the latest Vercel deployment. Manually redeploying, troubleshooting caches, and mixing production and staging APKs is error-prone.

## Goal
Provide a reliable, stable download link that always resolves to the **latest approved release** of the appropriate Android TV APK, without requiring a separate Vercel redeployment whenever an APK is published.

## Proposed design (subject to technical validation)
- Prefer **GitHub Releases** as the source for downloadable versioned APK assets, rather than serving binary files from Next.js `public/downloads`.
- Maintain independent staging and production release channels, package identifiers and link targets.
- GitHub Actions builds APK artifacts; validate completion, application ID, embedded version/versionCode, signing/certificate continuity, SHA-256 checksum, and intended backend/domain before publishing.
- Publish immutable, versioned APK assets as release artifacts. Mark production as the latest approved production release only after explicit owner approval; staging can use separate prereleases/tags.
- The Vercel Downloads page uses stable environment-specific paths that resolve the latest **approved** matching GitHub release asset (not simply the newest GitHub commit or potentially untested build).
- Resolve dynamically (server-side redirect or API) with controlled no-store/short TTL and cache-safe semantics. Validate GitHub API limits, release access/public availability, asset delivery and potential download redirects before choosing the final mechanism.
- Display release version, release timestamp, checksum and available/released status. Fail safely when release metadata or asset is missing; never silently substitute staging for production.
- Preserve legacy download URLs by redirecting to the correct versioned asset only after end-to-end verification; maintain an explicit rollback path.
- Do not require users to upload binaries manually into `public/downloads`, commit them to Git, or trigger a separate Vercel deployment after each future APK release.

## Workflow
1. Code is developed and verified in the appropriate environment.
2. GitHub Actions builds the staging or production Android APK.
3. The pipeline validates and publishes the versioned APK in its isolated release channel.
4. After owner approval, the release channel's stable Download link points to the new approved APK, without deploying the website again.
5. Record release version, originating Git SHA, workflow run, download URL, and rollback tag in `docs/BUILD-RELEASE-LOG.md`.

## Acceptance criteria
1. Uploading or publishing a newly approved production APK changes the production download target without a Vercel redeployment.
2. Staging links never serve production APKs, and production links never serve staging APKs.
3. Stable Downloads page URL and a direct APK download work on desktop and Android TV; the file is an installable APK, not an HTML error page.
4. The displayed version, Android embedded version, SHA-256, source commit, and GitHub release tag agree.
5. Pipeline failures or unapproved artifacts do not replace the latest working production release.
6. Rollback to the previous approved APK is documented, tested, and does not require manually editing the Vercel application.
7. GitHub API rate limits, asset download sizes, caching, permissions, and release retention are validated before production cutover.

## Scope and safeguards
Requirements only at this stage. No APK rebuild, GitHub workflow change, runtime routing change, Vercel deployment or database migration is authorized by this backlog entry.
