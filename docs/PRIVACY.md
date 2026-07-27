# Cocoon Privacy Policy

_Last updated: 2026-02-11_

## Summary

Cocoon is designed to process browsing-adaptation settings locally on your device.

- We do **not** run third-party advertising trackers.
- We do **not** transmit your browsing content to cloud services in this release.
- We store extension settings in `chrome.storage.local`.

## Data we store

Cocoon stores only user-configured settings such as:

- profile preset selection
- sensory and feed-cleaner toggle state
- grounding tool toggle state
- per-site feed-cleaner overrides

This data remains local to your browser profile.

## Data we do not collect

- No account registration data
- No remote analytics events
- No cloud storage of browsing content
- No sale of personal information

## Permissions usage

Cocoon requests:

- `storage`: to save your extension settings
- `activeTab`: to read the active tab's URL for current-site controls when you open the popup
- `alarms`: to automatically end timed scenario quick-switches and restore your baseline settings (no browsing data involved)
- host permissions for supported social domains only, so content scripts can apply selected controls

## Security and retention

- Settings persist until you remove the extension or clear extension storage.
- You can reset settings from the options page.

## Contact

For privacy questions or deletion requests related to local settings behavior, open a support issue and include your extension version.
