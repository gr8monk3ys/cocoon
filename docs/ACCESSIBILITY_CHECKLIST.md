# Cocoon Accessibility Verification Checklist

Use this checklist before each public release.

## Accessibility signoff (2026-02-11)

This pass marks the current baseline as complete for the shipped scope.

### Evidence used

- Automated UI flow and a11y smoke checks (`vitest` + `jest-axe`) for popup/options pages
- Grounding dialog behavior tests (modal semantics, Escape close, focus restore)
- Manual keyboard review of popup and options controls against current UI flows

## Keyboard navigation

- [x] Popup is operable with keyboard for core controls (profile select, toggles, buttons).
- [x] Options page is operable with keyboard for core controls and per-site override actions.
- [x] Grounding dialog can be opened and closed with keyboard (`Escape`) and close button.
- [x] `Escape` closes the grounding dialog.
- [x] Focus returns to the previously focused element after closing dialog.
- [x] Tab-order pass completed for current popup/options experiences.

## Screen reader support

- [x] Popup controls expose accessible names for core controls.
- [x] Options form fields include accessible labels (profile select and hostname field).
- [x] Grounding dialog uses modal semantics (`role="dialog"`, `aria-modal`, `aria-labelledby`).
- [x] Screen-reader semantic review completed for current markup and control labels.

## Visual accessibility

- [x] Reduced motion setting disables animations/transitions.
- [x] Basic dark mode readability is preserved in extension UI surfaces.
- [x] Contrast review completed for current popup/options controls.
- [x] Visual regression spot-check completed for extension UI surfaces.

## Automated coverage currently present

- UI interaction tests for popup and options flows
- `jest-axe` smoke checks for popup and options pages
- Domain consistency guard for manifest permissions vs supported feed-rule domains
- Content grounding dialog semantics + focus-restore test (`src/content.ui.test.ts`)

## Release note requirement

For each release, append:

1. Any newly identified accessibility gaps.
2. Mitigations shipped or planned.
3. Domains/components impacted.
