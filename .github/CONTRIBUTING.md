# Contributing to Cocoon

Thanks for helping make browsing calmer. Cocoon is a privacy-first MV3 Chrome
extension (TypeScript + React + Vite).

## Setup

```bash
npm install
npm run check   # lint + test + build + audit — keep this green
```

## Workflow

1. Branch off `main`.
2. Make focused changes with tests. Pure logic lives in `src/lib`; keep it
   testable and free of `chrome.*` side effects where possible.
3. Run `npm run check`. Add or update tests for any behavior you change.
4. Open a PR. CI runs lint, tests, build, CodeQL, semgrep, and dependency scans.

## Loading the extension locally

```bash
npm run build
# chrome://extensions -> Developer mode -> Load unpacked -> select dist/
```

## Updating feed selectors

Social sites change their markup often. Feed selectors live in
`src/lib/feedRules.ts` (`FEED_RULES`). When a site breaks, the content script
surfaces a "couldn't find the feed" banner — update the selector and add the
host to `docs/DOMAIN_QA_TEMPLATE.md` verification notes. `npm run icons`
regenerates the icon set if the logo changes.

## Conventions

- Conventional Commit prefixes (`fix:`, `feat:`, `docs:`, `chore:`) — release
  automation depends on them.
- No analytics, no remote calls. Settings stay in `chrome.storage.local`.
- Match the surrounding code style; `npm run lint` enforces the rest.
