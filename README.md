# Cocoon

Cocoon is a privacy-first Chrome extension for reducing online overwhelm for neurodivergent and mental health-affected users.

## Production-hardening scope delivered

This repository includes a production-hardening pass over the MVP:

- Permission scope narrowed to supported social domains (no `<all_urls>`)
- Domain-scoped feed cleaner rules to reduce false positives
- Accessibility upgrades for grounding dialog (semantics, Escape close, focus return)
- **Per-site feed cleaner overrides** in popup and options UIs
- Expanded unit test coverage for settings and feed-rule behavior
- Upgraded build/test toolchain dependencies and audit cleanup
- User-facing privacy and support documentation (`docs/PRIVACY.md`, `docs/SUPPORT.md`)

## Current features

1. **Profile presets**: ADHD, Autism, Anxiety, and Custom
2. **Sensory controls**: lightweight dark mode (color inversion; for full per-site theming we recommend Dark Reader) and reduced motion
3. **Feed cleaner**: hides algorithmic feed surfaces on supported social platforms, and warns you if a site's layout changes so the cleaner doesn't fail silently
4. **Grounding overlay**: a motion-free guided breathing timer + 5-4-3-2-1 grounding flow
5. **Per-site overrides**: enable/disable feed cleaner per supported domain

All settings are stored locally with `chrome.storage.local`.

## Supported domains

- `x.com`, `twitter.com`
- `facebook.com`, `instagram.com`
- `youtube.com`
- `reddit.com`
- `tiktok.com`

## Architecture

- Manifest V3 extension runtime
- React + TypeScript popup and options UIs
- Background service worker for setup and messaging
- Content script for in-page adaptation behavior
- Typed settings and messaging modules in `src/lib`

## Project structure

- `public/manifest.json` – extension permissions and entrypoints
- `src/background.ts` – install/init behavior
- `src/content.ts` – page adaptation and grounding dialog behavior
- `src/popup/main.tsx` – quick controls + current-site override
- `src/options/main.tsx` – full settings + per-site override management
- `src/lib/settings.ts` – typed settings + per-site override helpers
- `src/lib/feedRules.ts` – domain-scoped feed cleaning rules
- `public/icons/` – extension + store icons (regenerate with `npm run icons`)
- `docs/PRIVACY.md` – user-facing privacy policy for beta
- `docs/SUPPORT.md` – support workflow and safety notes
- `docs/PROFILE_RATIONALE.md` – profile intent and neurodivergent-fit guidance

## Local development

### 1) Install dependencies

```bash
npm install
```

### 2) Run quality checks

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=moderate
```

### 3) Load extension in Chrome

1. Build with `npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select `dist/`

## Privacy baseline

- No third-party advertising trackers
- Settings remain local on device
- No cloud transmission in this release

## Remaining production checklist

Before broad launch, complete:

- [x] End-to-end-style UI flow tests for popup/options interactions (`src/popup/main.ui.test.ts`, `src/options/main.ui.test.ts`)
- [ ] Domain QA on each supported platform after frontend changes (manual)
- [x] Automated domain consistency checks for host permissions vs feed-rule hosts (`src/lib/domainConsistency.test.ts`)
- [x] Grounding overlay accessibility behavior is covered by automated tests (`src/content.ui.test.ts`)
- [ ] Accessibility QA with keyboard-only and screen-reader checks
- [x] Release/versioning automation for Chrome Web Store packaging (`npm run package:extension`, `docs/RELEASE.md`)

## Release automation

- Run `npm run check` for full quality gates.
- Run `npm run package:extension` to generate a release zip in `artifacts/`.
- Follow `docs/RELEASE.md` for versioning and store submission steps.


## Product ideation backlog

- See `docs/FEATURE_IDEAS.md` for prioritized next-step feature concepts aligned with Cocoon's privacy-first model, including adaptive profile planning for mixed and changing user contexts.
- See `docs/ROADMAP.md` for intentionally deferred work and the reliability watch list.


## Profiles explained

See `docs/PROFILE_RATIONALE.md` for detailed guidance on ADHD, Autism, Anxiety, and Custom profile intent and tradeoffs.
