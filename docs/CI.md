# Continuous integration

CI is intentionally lean for a small TypeScript extension. Each workflow
has a distinct job; overlapping/non-functional scanners were removed.

## Active workflows

| Workflow | Purpose |
| --- | --- |
| `ci.yml` (`quality`) | Lint + test + build + `npm audit --omit=dev` (blocking) and a full-tree audit (informational) — the primary gate. Production deps block; dev-only transitives are surfaced but can't red the gate. |
| `semgrep.yml` | SAST (public rule packs, no token needed) |
| `pages.yml` | Deploys the `docs/` privacy/support site to GitHub Pages on pushes to `main` that touch `docs/`. |
| `security-baseline.yml` | `npm audit` (high). Redundant with `ci.yml`'s audit, but kept because it is a **required status check** in branch protection — removing it would block all merges until branch protection is updated. |

Dependency updates are automated via Dependabot (`.github/dependabot.yml`,
github-actions + npm).

## Removed and why

- **`org-*` scheduled workflows** (`org-ci-tests`, `org-gitleaks`,
  `org-precommit`, `org-trivy`, `org-trufflehog`) — all five called reusable
  workflows pinned in the private `gr8monk3ys/github` repo: an external
  dependency a public repo shouldn't rely on, and a heavier pipeline than a
  repo this size warrants. Coverage is preserved elsewhere: tests run in
  `ci.yml`; dependency CVEs are covered by `npm audit` (per-PR in `ci.yml`,
  monthly in `security-baseline`) plus Dependabot; secret scanning is best
  handled by GitHub's native secret scanning + push protection (Settings →
  Code security); pre-commit hooks still run locally via
  `.pre-commit-config.yaml` (`pre-commit run --all-files`).
- **`org-codeql.yml`** — CodeQL code scanning requires GitHub Advanced
  Security, which was not available while this repo was private, so the job
  could only ever fail with "Code scanning is not enabled." `semgrep` provides
  SAST instead. Code scanning is free on public repos — prefer enabling CodeQL
  default setup (Settings → Code security) over re-adding the workflow.
- **`org-osv.yml`** — The pinned upstream reusable workflow referenced a
  non-existent action path (`google/osv-scanner-action/scan-repo`), so it failed
  in seconds on every run. Dependency CVEs are covered by `npm audit` +
  Dependabot.
- **`org-release-please.yml`** — `startup_failure` on every push: the reusable
  `reusable-release-please.yml` in the private `gr8monk3ys/github` repo is
  broken/misconfigured (not a pin issue — sibling reusable workflows at the same
  SHA pass; `secrets: inherit` did not help). It only powers release-PR
  automation. Versioning is handled manually via `npm run package:extension` +
  `docs/RELEASE.md`.

None of the removed workflows were required status checks, so removing them is
safe. `security-baseline` IS a required check, so it is kept (despite
duplicating `ci.yml`'s audit) until branch protection is updated to drop it.
