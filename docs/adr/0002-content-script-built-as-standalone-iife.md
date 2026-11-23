# Build the content script as a standalone IIFE

## Status

Accepted

## Context

Cocoon is a Manifest V3 extension. MV3 injects content scripts as classic scripts, which cannot use the ES-module `import` statements Rollup emits for shared chunks. The popup, options page and background service worker are fine as ES modules (the manifest declares the worker `type: module`).

## Decision

`vite.config.ts` builds the popup, options and background entries. `vite.content.config.ts` builds `src/content.ts` separately as a self-contained IIFE with `inlineDynamicImports`, appended to `dist/` with `emptyOutDir: false`. `npm run build` runs both, in that order.

## Consequences

- Shared code imported by the content script is duplicated into `assets/content.js` rather than shared as a chunk.
- Any new content-script entry must be added to `vite.content.config.ts`, not `vite.config.ts`.
