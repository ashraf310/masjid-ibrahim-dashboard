# MI-ENH-007 — Mobile / Tablet Presenter Screen Sharing

Status: **Backlog / deferred — requirements only, not approved for implementation**
Recorded: 2026-10-26

## Goal
Enable a presenter to use an **iPad, iPhone, or Android phone/tablet** to share their **entire device screen or another app** (examples: PowerPoint, Safari/Chrome, Quran app) during a Masjid Ibrahim D03 presentation.

## Desired experience
- Presenter opens the existing `/live` portal, authenticates with their reusable presenter PIN, and starts screen/app sharing from the mobile/tablet device.
- The screen is displayed in the existing `/public` receiver, PRISM Live Studio (for YouTube), and hall Android TVs with the same D03 priority/session lifecycle, if technically feasible.
- Desktop presenter screen sharing continues to work unchanged.
- Avoid repetitive back-office setup; maintain the existing clean PRISM Browser source when possible.

## Feasibility constraints and discovery
- Current desktop implementation uses browser `navigator.mediaDevices.getDisplayMedia()`, which may be missing or constrained in iPadOS/iOS and Android mobile browsers; do not assume it works.
- Verify on actual iPadOS/iOS and Android versions and in the intended apps. Backgrounding the browser or switching apps may interrupt the broadcast.
- Evaluate native OS capture (iOS ReplayKit, Android MediaProjection), or a vetted mobile broadcasting approach. VDO.Ninja is an option to assess, **not an approved architecture**.
- Verify screen and system audio permissions, capture reliability, legibility, stream security, and D03 authorization/session integration.
- If native/mobile streaming cannot integrate directly with `/public`, document the gap and propose alternatives before coding.

## Acceptance criteria (provisional)
1. Presenter can share a supported app or device screen from an iPad, iPhone, and Android device.
2. Live content is readable in PRISM and on hall TVs, without browser chrome.
3. Session starts/stops predictably and follows emergency-stop and presenter-code revocation behavior.
4. Desktop `/live`, D02, D04, and production remain unaffected.

## Deferred next steps
Confirm device versions, conduct feasibility proof-of-concept, compare implementation options and costs, obtain explicit approval before coding/build/deployment.

No application code, APK, database, or Vercel changes are part of this requirement.
