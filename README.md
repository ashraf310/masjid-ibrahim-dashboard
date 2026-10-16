# Masjid Ibrahim Digital Signage

Next.js dashboard intended for a TCL Android TV at 1920×1080. Includes a single-account admin portal, draft/preview/publish, flyer upload and order, optional urgent banner, current time, weather, and a manually verified emergency prayer schedule. **MasjidAl automatic integration is not yet implemented or authorized. Never present the prayer feed as live until validated.**

## Local run

```bash
npm install
cp .env.example .env.local
npm run dev
```

- TV: http://localhost:3000/
- Admin: http://localhost:3000/admin
- Draft preview (authenticated): http://localhost:3000/preview

Without Supabase env variables, the TV shows safe design defaults (no invented prayer times) and the admin portal shows a setup message.

## Supabase setup

1. Create a Supabase project and turn on email/password login.
2. Run `sql/setup.sql` in SQL editor **after replacing** `REPLACE_WITH_ADMIN_EMAIL` with your actual dedicated administrator email. Do not add passwords to source files.
3. In Supabase Auth, create/invite the intended single administrator. If possible, disable public self-signup and enforce a strong password.
4. Copy Supabase URL and publishable/anon key to `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Copy the **service role** secret as `SUPABASE_SERVICE_ROLE_KEY` and dedicated email as `ADMIN_EMAIL`. Keep these server-only and NEVER commit them.
6. Deploy and create the same variables in Vercel's project settings.
7. Log in to `/admin`, configure your first draft, then click **Save Draft → Preview Draft → Publish to TV**.

**Security note:** Public Storage bucket allows anyone with a flyer URL to read the flyer. Do not upload private content. Uploaded files remain in storage if removed from the slideshow; periodically clean orphan files from Supabase Storage. The Supabase bucket upload policy checks the single admin email, and the API independently checks login identity before saving/publishing.

## Prayer data / important

Current browser page does **not** scrape Masjid Ibrahim's website. No structured API has been confirmed. Until an approved data integration is available, enter a **verified schedule for today's date** in Admin → Salah. Today's prayer values disappear automatically the next day if there is no verified matching schedule; they are never inferred or fabricated. Jumu'ah 1 and 2 show Khutbah start time with blank Iqamah cells. Friday countdown uses Khutbah start values, skipping Dhuhr. Friday Jumu'ah rows stay below Isha seven days a week. If connectivity fails, TV will attempt to show the last published cached page data, but will not display an expired prayer schedule.

## Vercel

Connect repository at https://vercel.com/new, select Next.js, add env variables above, deploy. The Vercel preview URL is suitable for testing. Use the root URL in your Android TV browser/app wrapper when ready. No native APK has been created in this milestone.

## Known production tasks

- Validate the custom layout physically on 1920×1080 TCL TV; adjust font sizes if necessary.
- Confirm MasjidAl allowed integration; implement server-side parser/API with monitoring and error safeguards.
- Validate weather API free/noncommercial usage.
- Replace external QR generator for any customized donation URL with a local QR generator before production.
- Implement media cleanup, version history/revert, additional rate limiting and audit logs.
- Create/test Android TV APK wrapper, including back button behavior and screen-awake function.
