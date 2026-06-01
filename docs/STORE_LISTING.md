# Chrome Web Store submission kit

Copy/paste content for the Web Store developer dashboard. Keep this in sync with
`public/manifest.json`.

## Basics

- **Name:** Cocoon Beta
- **Version:** 0.2.0 (must match `public/manifest.json`)
- **Category:** Accessibility (alt: Productivity)
- **Language:** English

## Summary (≤132 chars)

> Privacy-first browsing support for neurodivergent and mental-health needs — calm feeds, sensory controls, and a grounding tool.

## Detailed description

> Cocoon helps reduce online overwhelm. It runs entirely on your device — no
> accounts, no analytics, no cloud transmission of browsing content.
>
> Features:
> • Profile presets — ADHD, Autism, Anxiety, and Custom
> • Sensory controls — dark mode and reduced motion
> • Feed cleaner — hides algorithmic feed surfaces on supported social platforms
> • Per-site overrides — turn the feed cleaner on/off per supported domain
> • Grounding overlay — a quick breathing + 5-4-3-2-1 grounding flow
>
> Supported sites: x.com / twitter.com, facebook.com, instagram.com,
> youtube.com, reddit.com, tiktok.com.
>
> All settings are stored locally with chrome.storage.local and never leave your
> browser.

## Single purpose (required)

> Cocoon reduces sensory and algorithmic overwhelm while browsing supported
> social websites, by applying user-controlled visual adaptations (dark mode,
> reduced motion, feed hiding) and offering an on-demand grounding exercise.

## Permission justifications (required)

- **storage** — Persist the user's own settings (profile, toggles, per-site
  overrides) locally on the device. No data leaves the browser.
- **activeTab** — When the user opens the popup, read only the active tab's
  hostname to show the correct per-site feed-cleaner control.
- **host permissions (the 7 supported social domains)** — Inject the content
  script that applies the selected visual adaptations on those sites only. No
  `<all_urls>`; the extension does nothing on other sites.

## Data usage disclosures (Privacy practices tab)

- Does it collect user data? **No** personally identifiable data, no analytics,
  no remote transmission.
- Stored locally only: user-configured settings.
- Check the certifications: not sold to third parties; not used for unrelated
  purposes; not used for creditworthiness/lending.

## Privacy policy URL (required)

Host `docs/PRIVACY.md` at a public URL and paste it here, e.g.
`https://github.com/<owner>/<repo>/blob/main/docs/PRIVACY.md`.

## Assets to upload (you must create these)

- **Store icon:** 128×128 — use `public/icons/icon-128.png`.
- **Screenshots:** at least one, 1280×800 or 640×400 PNG/JPEG. Suggested shots:
  the popup controls, the options page, and a before/after of a cleaned feed.
- **Small promo tile (optional):** 440×280.

## Pre-upload checklist

1. `npm run check` is green.
2. `npm run package:extension` → upload `artifacts/cocoon-v<version>.zip`.
3. Load `dist/` unpacked and smoke-test each supported domain (feed cleaner,
   dark mode, reduced motion, grounding overlay) and the popup's current-site
   control — see `docs/RELEASE.md`.
4. Confirm the toolbar icon renders (icons present in the zip).
