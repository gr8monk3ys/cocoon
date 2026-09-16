# Agent instructions

Cocoon is a Manifest V3 Chrome extension (React + TypeScript, built with
Vite, tested with Vitest). See `README.md` for feature/architecture context
and `docs/CI.md` for what CI actually runs.

## Setup

```bash
npm install
```

## Verify

Run the full local gate before considering any change done — it's the same
one CI enforces as the required status check:

```bash
npm run check   # lint + test + typecheck/build + production-dep audit
```

`npm run check` runs, in order:

1. `npm run lint` — `eslint .`
2. `npm test` — `vitest run`
3. `npm run build` — `tsc --noEmit && vite build && vite build --config vite.content.config.ts`
4. `npm audit --omit=dev --audit-level=moderate` — blocking for production
   dependencies only (a separate full-tree audit in CI is informational)

Each step can also be run individually while iterating:

```bash
npm run lint
npm test
npm run build
```

All four must pass (audit: zero moderate+ vulnerabilities in production
dependencies) before a change is considered complete.

## Notes for agents

- No test/e2e browser harness beyond Vitest + `jsdom`/Testing Library; UI
  behavior is covered by DOM-level interaction tests under `src/**/*.test.*`.
- Keep new/changed logic covered by a Vitest test in the same area as the
  code (see existing `*.test.ts`/`*.test.tsx` files for the pattern).
- Manual QA items (cross-site selector checks, screen-reader passes) are
  tracked in `README.md`'s launch checklist and `docs/DOMAIN_QA_TEMPLATE.md`
  / `docs/ACCESSIBILITY_CHECKLIST.md` — these are not agent-runnable and are
  out of scope for automated verification.
