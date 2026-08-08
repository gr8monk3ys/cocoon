# Continuous integration

CI is intentionally lean for a small, public TypeScript extension. Each workflow
has a distinct job; overlapping/non-functional scanners were removed.

## Active workflows

| Workflow | Purpose |
| --- | --- |
| `ci.yml` (`quality`) | Lint + test + build + `npm audit --omit=dev` (blocking) and a full-tree audit (informational) — the primary gate, and the **only required status check**. Production deps block; dev-only transitives are surfaced but can't red the gate. |
| `codeql.yml` | SAST via GitHub code scanning (`security-and-quality` queries). Free on public repos. |
| `semgrep.yml` | SAST (public rule packs, no token needed) |
| `precommit.yml` | pre-commit hooks (ruff, check-yaml, detect-private-key, large files) |
| `pages.yml` | Deploys the `docs/` privacy/support site to GitHub Pages on pushes to `main` that touch `docs/`, or on demand via `workflow_dispatch`. |
| `security-baseline.yml` | `npm audit` (high). Redundant with `ci.yml`'s audit; retained as a cheap independent scheduled check. |

Secret scanning is handled by **GitHub native secret scanning with push
protection**, enabled in repo settings rather than by a workflow. Push
protection blocks a secret at push time instead of reporting it after the fact,
which is strictly better than the scanner workflows it replaced.

Dependency updates are automated via Dependabot (`.github/dependabot.yml`,
github-actions + npm).

## Removed and why

- **All five `org-*.yml` workflows** (`org-ci-tests`, `org-gitleaks`,
  `org-precommit`, `org-trivy`, `org-trufflehog`) — they called reusable
  workflows in the **private** `gr8monk3ys/github` repo. A *public* repo cannot
  call a reusable workflow from a *private* one, so every one of them broke the
  moment this repo went public:

  ```
  gr8monk3ys/github/.github/workflows/reusable-gitleaks.yml@4a306a94
    : workflow was not found
  ```

  They passed beforehand only because the repo was private. Coverage was moved
  rather than dropped: secret scanning to GitHub native scanning + push
  protection, SAST to `codeql.yml` + `semgrep.yml`, hooks to `precommit.yml`,
  and `org-ci-tests` was already redundant with `ci.yml`'s test step. Trivy is
  not replaced — `npm audit` (twice) plus Dependabot security updates already
  cover dependency CVEs for a repo with two production dependencies.

- **`org-codeql.yml`** — previously removed because CodeQL requires GitHub
  Advanced Security, unavailable on a private repo. **Now re-added as
  `codeql.yml`**: code scanning is free on public repositories.
- **`org-osv.yml`** — The pinned upstream reusable workflow referenced a
  non-existent action path (`google/osv-scanner-action/scan-repo`), so it failed
  in seconds on every run. Dependency CVEs are covered by `npm audit` + Trivy +
  Dependabot.
- **`org-release-please.yml`** — `startup_failure` on every push: the reusable
  `reusable-release-please.yml` in the private `gr8monk3ys/github` repo is
  broken/misconfigured (not a pin issue — sibling reusable workflows at the same
  SHA pass; `secrets: inherit` did not help). It only powers release-PR
  automation. Versioning is handled manually via `npm run package:extension` +
  `docs/RELEASE.md`. Re-add it once the org reusable workflow is fixed.

## Required status check

Branch protection on `main` requires exactly one context:

```
$ gh api repos/gr8monk3ys/cocoon/branches/main/protection \
    --jq '.required_status_checks.contexts'
["quality"]
```

An earlier revision of this file claimed `security-baseline` was also required.
It is not, and was not — only `quality` gates merges.

Two properties of that name matter. It is the **PR-event** job name; the same
workflow reports as `ci-tests / ci-tests-minimum` on `push`, so requiring the
push-event name would block every merge permanently. And it must be sampled
from a PR head commit, never from the default branch.
