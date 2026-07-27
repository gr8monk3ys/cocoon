<p align="center">
  <img src="docs/assets/icon-128.png" alt="Cocoon logo" width="96" height="96" />
</p>

<h1 align="center">Cocoon</h1>

<p align="center"><em>Calm, private browsing support for neurodivergent and mental health needs.</em></p>

---

Cocoon is a privacy-first Chrome extension that reduces online overwhelm: it
softens algorithmic feeds, lowers sensory load, and keeps a grounding exercise
one click away. Everything runs on your device — no accounts, no analytics, no
cloud.

## Features

1. **Profile presets** — ADHD, Autism, Anxiety, and Custom starting points you
   fully control (see `docs/PROFILE_RATIONALE.md` for the intent behind each)
2. **Feed cleaner** — hides algorithmic feed surfaces on supported social
   platforms, with three intensities and per-site overrides; warns you if a
   site's layout changes so it never fails silently
3. **Sensory controls** — lightweight dark mode (color inversion; for full
   per-site theming we recommend Dark Reader) and reduced motion
4. **Grounding overlay** — a motion-free guided breathing timer plus a
   5-4-3-2-1 grounding flow
5. **Scenario quick-switches** — Focus, Low stimulation, Calm reset, and
   Social guardrails modes that expire on a timer you choose (15/30/60 min)
   and restore your baseline automatically
6. **Adaptive suggestions** — optional, transparent per-domain and
   per-schedule profile suggestions; suggest-only by default

All settings are stored locally with `chrome.storage.local`.

## Supported domains

- `x.com`, `twitter.com`
- `facebook.com`, `instagram.com`
- `youtube.com`
- `reddit.com`
- `tiktok.com`

Permissions are scoped to exactly these hosts — no `<all_urls>`.

## Install

Until the Chrome Web Store listing is live, load it unpacked:

1. `npm install && npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select `dist/`

## Architecture

- Manifest V3 extension runtime
- React + TypeScript popup and options UIs, themed by `src/ui/theme.css`
- Background service worker for setup, messaging, and scenario expiry alarms
- Content script (built as a self-contained IIFE) for in-page adaptation

### Project structure

- `public/manifest.json` – extension permissions and entrypoints
- `src/background.ts` – install/init behavior and scenario expiry
- `src/content.ts` – page adaptation, feed banner, grounding dialog
- `src/popup/main.tsx` – quick controls + current-site override
- `src/options/main.tsx` – full settings + per-site override management
- `src/lib/settings.ts` – typed settings + per-site override helpers
- `src/lib/feedRules.ts` – domain-scoped feed cleaning rules
- `src/ui/theme.css` – shared brand theme (light + dark scheme)
- `public/icons/` – extension icons (regenerate with `npm run icons`)
- `docs/BRAND.md` – logo, palette, typography, and voice guidelines
- `docs/PRIVACY.md` / `docs/SUPPORT.md` – user-facing policy and support docs

## Development

```bash
npm install
npm run check   # lint + tests + typecheck/build + production-dep audit
```

CI runs the same gates (`.github/workflows/ci.yml`, documented in
`docs/CI.md`). The blocking audit covers production dependencies; a full-tree
audit runs informationally.

## Privacy baseline

- No third-party advertising trackers
- Settings remain local on device
- No cloud transmission

## Release

- `npm run package:extension` builds and zips `dist/` into
  `artifacts/cocoon-v<version>.zip` (requires the `zip` CLI)
- `docs/RELEASE.md` covers versioning and store submission
- `docs/STORE_LISTING.md` is the copy/paste kit for the Web Store dashboard

### Launch checklist

- [x] End-to-end-style UI flow tests for popup/options interactions
- [x] Automated domain consistency checks (host permissions vs feed-rule hosts)
- [x] Grounding overlay accessibility covered by automated tests
- [x] Feed banner shows once per host; rot warnings stay dismissed
- [x] Inline validation for per-site override and adaptive rule forms
- [x] Release packaging (`npm run package:extension`, `docs/RELEASE.md`)
- [ ] Manual domain QA on each supported platform (selectors change often —
      see `docs/DOMAIN_QA_TEMPLATE.md`)
- [ ] Manual accessibility QA with keyboard-only and screen-reader checks
      (`docs/ACCESSIBILITY_CHECKLIST.md`)

## More docs

- `docs/FEATURE_IDEAS.md` – prioritized next-step feature concepts
- `docs/ROADMAP.md` – intentionally deferred work and the reliability watch list
- `docs/PROFILE_RATIONALE.md` – profile intent and neurodivergent-fit guidance
