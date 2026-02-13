# Cocoon Release Process

## Preconditions

- All CI checks pass (`lint`, `test`, `build`, `audit`).
- Accessibility checklist has been completed for this release.
- Domain QA has been run for supported social platforms.

## Versioning

1. Update `package.json` version.
2. Update `public/manifest.json` version to match exactly.
3. Commit version bump.

The packaging script fails fast if versions do not match.

## Package extension

```bash
npm run package:extension
```

This command:

- runs a production build,
- verifies `package.json` and `public/manifest.json` versions are aligned,
- outputs a signed-ready zip artifact at `artifacts/cocoon-v<version>.zip`.

## Submit

1. Upload zip artifact to Chrome Web Store.
2. Include release notes with domain-rule changes and accessibility notes.
3. Monitor early rollout feedback and rollback quickly if feed selectors regress.
