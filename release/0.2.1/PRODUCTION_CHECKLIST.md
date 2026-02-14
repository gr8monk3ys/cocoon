# Cocoon 0.2.1 Production Checklist (Public Chrome Web Store)

Target URLs (GitHub Pages):
- Home: https://gr8monk3ys.github.io/cocoon/
- Privacy: https://gr8monk3ys.github.io/cocoon/privacy/
- Support: https://gr8monk3ys.github.io/cocoon/support/

URL files (copy/paste for Chrome Web Store):
- `release/0.2.1/PRIVACY_POLICY_URL.txt`
- `release/0.2.1/SUPPORT_URL.txt`

## 1) Release Candidate Build (must pass)
- [ ] `npm ci`
- [ ] `npm run check`
- [ ] `npm run package:extension`
- [ ] Zip artifact exists: `artifacts/cocoon-v0.2.1.zip`

## 2) Store Listing Requirements (must be complete)
- [ ] Extension name in manifest is `Cocoon` (`public/manifest.json`)
- [ ] Icons present in the zip (`icons/icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png`)
- [ ] GitHub Pages is enabled and live for `docs/` (public URL works)
- [ ] Privacy policy URL set to the public page (see `release/0.2.1/PRIVACY_POLICY_URL.txt`)
- [ ] Support URL set to the public page (see `release/0.2.1/SUPPORT_URL.txt`)
- [ ] Permission justifications written (especially `activeTab` and `alarms`)
- [ ] Screenshots captured (popup, options, grounding overlay, at least 1280x800 or as required by CWS)
- [ ] Category, language, and single-purpose description match actual behavior

## 3) Domain QA (manual; must be complete for all)
Fill: `release/0.2.1/DOMAIN_QA.md`
- [ ] x.com
- [ ] twitter.com
- [ ] facebook.com
- [ ] instagram.com
- [ ] youtube.com
- [ ] reddit.com
- [ ] tiktok.com

## 4) Accessibility Signoff (manual; required)
Fill: `release/0.2.1/A11Y_SIGNOFF.md`
- [ ] macOS VoiceOver signoff complete
- [ ] Windows NVDA signoff complete

## 5) Store Submission (manual)
- [ ] Upload `artifacts/cocoon-v0.2.1.zip` to Chrome Web Store
- [ ] Verify listing links work publicly (Privacy + Support)
- [ ] Verify permissions list matches the justification text (`storage`, `tabs`, `alarms`, host permissions)
- [ ] Submit for review

## 6) Post-Approval Smoke Test (manual; do immediately after publish)
- [ ] Install from Chrome Web Store in a clean Chrome profile
- [ ] Smoke test on `reddit.com` and `youtube.com` (feed cleaner toggle, per-site override, grounding overlay)
- [ ] Confirm scenario quick-switch expires and restores baseline after waiting (or via short expiry override)
