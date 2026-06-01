# Roadmap & deferred work

Tracks work intentionally deferred, with the reasoning, so it isn't mistaken for
an oversight. See `docs/FEATURE_IDEAS.md` for product/feature concepts.

## Deliberately deferred (with rationale)

- **Preact swap to shrink `messages.js` (~143 KB).** The React runtime is bundled
  into the popup/options pages. Aliasing `react`→`preact/compat` would cut it to
  ~15 KB, but those are extension pages (not a hot path), and the swap risks the
  `createRoot`/JSX-runtime/testing-library setup. Not worth destabilizing a green
  build pre-launch. Revisit if bundle size becomes a real concern.
- **i18n (`_locales`).** English-only for v1. Adds manifest/message scaffolding
  with little value until there's demand from non-English users.
- **Firefox / Edge ports.** Edge accepts the same MV3 zip. Firefox needs manifest
  tweaks (`browser_specific_settings`, background scripts). Defer until Chrome
  traction justifies it.
- **In-CI browser E2E.** Unit/jsdom tests cover logic and the content-script DOM
  behavior, including selector-rot detection (`countFeedMatches`). A true
  load-unpacked Playwright run needs browser binaries the reusable CI may not
  provide and is flaky for MV3 service workers. The pre-upload smoke test in
  `docs/STORE_LISTING.md` remains a manual gate for now.
- **Dark-mode rework.** Cocoon ships lightweight color-inversion dark mode (with
  media re-inversion) and the options page recommends Dark Reader for full
  theming. A real per-site theming engine is out of scope; we set expectations
  instead of competing with dedicated tools.

## Reliability watch

- **Feed selector rot.** Hardcoded selectors for 7 fast-moving SPAs are the main
  maintenance burden. The content script now warns the user when nothing matches
  (instead of failing silently). Keep `FEED_RULES` in `src/lib/feedRules.ts`
  current; verify per `docs/DOMAIN_QA_TEMPLATE.md`.
