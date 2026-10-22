# Masjid Ibrahim automatic PowerPoint conversion (staging)

The presenter uploads a **PPTX containing speaker notes** to the staging Presenter Portal. The portal reads notes directly from the PPTX in the speaker's browser. A small helper on the speaker's own Windows/Mac laptop creates a PDF of its slide graphics locally, without a cloud conversion service.

## Requirements (Windows or Mac)
1. Python 3 installed (run `python --version`, `py -3 --version`, or `python3 --version`).
2. LibreOffice installed: https://www.libreoffice.org/download/download-libreoffice/
3. Download `tools/presenter_helper.py` from the **staging development GitHub branch**, not the production branch.

## Start helper on Windows
Open Terminal (PowerShell) in the folder containing `presenter_helper.py`:
```powershell
py -3 .\presenter_helper.py
```
If `py` is unavailable, try `python presenter_helper.py`.

## Start helper on Mac
Open Terminal in the directory containing `presenter_helper.py`:
```sh
python3 ./presenter_helper.py
```

A successful start prints: `Masjid Ibrahim local presenter helper active on 127.0.0.1:43871`. Leave the Terminal open during presentation preparation.

## Speaker's steps
1. Open their **full private presenter link** at https://masjid-ibrahim-staging.vercel.app/presenter
2. Choose a PPTX and scroll down to **PowerPoint Presenter View**. Its private notes are extracted automatically.
3. Click **Convert PPTX automatically**. The browser sends the chosen PPTX only to the local helper at 127.0.0.1; the helper returns a PDF locally.
4. Preview slides and notes; the PDF is not uploaded by this feature. The existing **Upload presentation** button stores the original PPTX privately, separately.

## Current limitations
- This is the first local-conversion integration and requires the helper to be started manually. The browser cannot install or launch a local program without user consent.
- Embedded browser PDF preview may ignore page selectors. Full-fidelity, deterministic slide images and local page count verification are still pending.
- Hall-TV/PRISM synchronization and publishing are **not enabled**. Do not use for a live event yet.
- Source PPTX and conversion outputs are not persisted by the local helper (temporary files are removed after each conversion). The browser holds the resulting PDF in memory.
- The helper only accepts requests originating from `https://masjid-ibrahim-staging.vercel.app` and binds to `127.0.0.1`.
- If your company browser blocks requests to local services or private network access, allow access only if you trust this locally running helper.
