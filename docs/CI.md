# Continuous integration

CI is intentionally lean for a small, private TypeScript extension. Each workflow
has a distinct job; overlapping/non-functional scanners were removed.

## Active workflows

| Workflow | Purpose |
| --- | --- |
| `ci.yml` (`quality`) | Lint + test + build + `npm audit` — the primary gate |
| `org-precommit.yml` | pre-commit hooks (ruff format/lint, etc.) |
| `semgrep.yml` | SAST (public rule packs, no token needed) |
| `org-gitleaks.yml` | Secret scanning |
| `org-trivy.yml` | Dependency/filesystem vulnerability scanning |
| `org-trufflehog.yml` | Secret scanning (verified secrets) |
| `org-release-please.yml` | Release automation on `main` |
| `security-baseline.yml` | `npm audit` (high). Redundant with `ci.yml`'s audit, but kept because it is a **required status check** in branch protection — removing it would block all merges until branch protection is updated. |

Dependency updates are automated via Dependabot (`.github/dependabot.yml`,
github-actions + npm).

## Removed and why

- **`org-codeql.yml`** — CodeQL code scanning requires GitHub Advanced Security,
  which is not enabled on this **private** repo, so the job could only ever fail
  with "Code scanning is not enabled." `semgrep` provides SAST instead. Re-add it
  if GHAS is enabled (Settings → Code security).
- **`org-osv.yml`** — The pinned upstream reusable workflow referenced a
  non-existent action path (`google/osv-scanner-action/scan-repo`), so it failed
  in seconds on every run. Dependency CVEs are covered by `npm audit` + Trivy +
  Dependabot.

`codeql` and `osv` are not required status checks, so removing them is safe.
`security-baseline` IS a required check, so it is kept (despite duplicating
`ci.yml`'s audit) until branch protection is updated to drop it.

## Possible further consolidation (not done)

- `org-ci-tests.yml` overlaps with `ci.yml`'s test step.
- `org-gitleaks` and `org-trufflehog` are both secret scanners.

These pass and are cheap, so they were left in place; drop one of each if you
want a tighter pipeline.
