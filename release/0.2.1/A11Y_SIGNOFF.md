# Cocoon 0.2.1 Accessibility Signoff (Manual)

Date:
Tester:
Extension version: 0.2.1

Evidence captured (optional):

## Scope

Complete both:

- macOS VoiceOver (Chrome)
- Windows NVDA (Chrome)

## Critical flows to verify

- Popup:
  - Profile selection is announced correctly.
  - Toggles/buttons have clear accessible names.
  - Current-site (per-domain) override can be discovered and toggled.
  - Scenario quick-switch buttons announce state/intent.
- Options page:
  - Form fields have labels and predictable tab order.
  - Per-site override management is operable with keyboard and SR.
- Grounding overlay:
  - Dialog semantics (role + label) are present.
  - `Escape` closes the dialog.
  - Focus returns to the element that opened it.

## 1) macOS VoiceOver signoff

Environment:

- macOS version:
- VoiceOver version:
- Chrome version:

Checklist:

- [ ] Popup is navigable with VO (controls are discoverable, correctly named).
- [ ] Popup profile control reads current value and allows changing selection.
- [ ] Popup toggles announce checked/unchecked state.
- [ ] Current-site override row is reachable and operable.
- [ ] Grounding overlay announces as a dialog and reads the title.
- [ ] `Escape` closes grounding overlay and focus returns to opener.
- [ ] Options page fields have labels (VO reads label + value).
- [ ] Options per-site overrides are operable (add/remove/edit) without confusion.

Notes:

## 2) Windows NVDA signoff

Environment:

- Windows version:
- NVDA version:
- Chrome version:

Checklist:

- [ ] Popup is navigable with NVDA (controls are discoverable, correctly named).
- [ ] Popup profile control reads current value and allows changing selection.
- [ ] Popup toggles announce checked/unchecked state.
- [ ] Current-site override row is reachable and operable.
- [ ] Grounding overlay announces as a dialog and reads the title.
- [ ] `Escape` closes grounding overlay and focus returns to opener.
- [ ] Options page fields have labels (NVDA reads label + value).
- [ ] Options per-site overrides are operable (add/remove/edit) without confusion.

Notes:

## Signoff

- VoiceOver signoff: [ ] PASS / [ ] FAIL
- NVDA signoff: [ ] PASS / [ ] FAIL

If FAIL, list the blockers and create a follow-up issue before submitting to the Chrome Web Store.

