# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user is the author: an adult reducing sensory and algorithmic load on
the handful of social sites they still use, browsing on desktop Chrome. The job
is not "block social media" — it is to keep using a site while removing the
surfaces that pull attention or raise arousal (the algorithmic feed, Reels and
Stories rails, motion, brightness), and to have an immediate way down when
already dysregulated.

Cocoon is a personal tool kept public: the repository, the privacy and support
pages, and a complete Chrome Web Store submission kit all exist, and the
extension is **not listed on the store**. Anyone can load it unpacked. Future
work optimizes for the author's daily use, not for install counts, onboarding
funnels, or conversion.

The built-in profiles (ADHD, Autism, Anxiety, Custom) are starting presets, not
diagnoses or treatment plans — `docs/PROFILE_RATIONALE.md` states this and any
future copy must keep saying it.

## Product Purpose

Apply user-controlled visual adaptations to a fixed list of social sites, and
offer an on-demand grounding exercise. Everything runs on the device.

Success is that a supported site stays usable with its feed gone, that the
extension is silent when it is working, and that when a site changes its markup
the user is told rather than left with a feature that quietly stopped working.

## Positioning

**The rules are the product, and they are an audited artifact.**

`src/rules/<host>.ts` is the single source of truth: each rule carries a stable
id, the gentlest intensity that switches it on, the page kinds it applies to,
and either a CSS selector or a text-anchored marker. That one list drives the
injected stylesheet, the selector-rot check, the manifest host-permission
consistency test, and the e2e suite — where every rule is asserted against a
hand-written fixture of the live markup, and the built extension is loaded into
Chromium with each fixture served at the real host URL.

The consequence a neighbouring feed blocker cannot truthfully claim: when a
site's layout changes, Cocoon says so. Total rot raises an in-page banner;
partial rot (some selectors dead, the feed still hidden) goes to the console
for whoever maintains the rules. Most feed blockers fail silently and the user
finds out by scrolling.

## Operating Context

- Desktop Chrome, extension loaded unpacked from `dist/`.
- Seven hostnames across six sites: x.com / twitter.com, facebook.com,
  instagram.com, youtube.com, reddit.com, tiktok.com.
- All of them are SPAs. The content script loads once and the URL moves under
  it, so the page kind is re-stamped as the user navigates and an opened post
  is never hidden by a home-feed rule.
- Sites change their markup without notice. Facebook dropped `role="feed"` in
  2026 and its feed is now found by its screen-reader heading; maintaining
  rules against live drift is ongoing, expected work.
- Fixtures are hand-written snapshots: they catch bad rule edits, not live
  drift. Live drift is what the in-page rot banner is for.

## Capabilities and Constraints

Confirmed capabilities:

- **Feed cleaner** at three intensities — `full` (off), `limited` (the feed),
  `none` (feed plus Reels/Stories/Explore-style surfaces), with per-site
  overrides that can only ever clean *more* than the global setting.
- **Profiles** — ADHD, Autism, Anxiety, Custom. Any manual edit moves the
  profile to Custom.
- **Sensory controls** — colour-inversion dark mode and reduced motion.
- **Scenarios** — Focus, Low stimulation, Calm reset, Social guardrails, on a
  15/30/60-minute timer that snapshots the prior settings and restores them on
  expiry (via `chrome.alarms`, so it fires with no page open).
- **Adaptive suggestions** — optional per-domain and per-schedule profile
  suggestions, suggest-only by default.
- **Grounding overlay** — a text-only breathing timer plus a 5-4-3-2-1 flow,
  injected into the page, focus-trapped and dismissible.

Binding constraints, all confirmed:

- **No network requests, ever.** Rules ship in the bundle. No remote rule
  updates, no telemetry, no analytics, no crash reporting, no accounts.
  Settings live in `chrome.storage.local` and never leave the browser.
- **Narrow host permissions.** Never `<all_urls>`. The extension does nothing
  on sites outside the explicit list, and adding a site is a deliberate act
  that changes the manifest, the rules, a fixture, and a consistency test.
- **No motion in Cocoon's own UI.** `src/ui/theme.css` carries zero transitions
  and zero animations on purpose: reduce-motion is a product feature and the
  interface models it. This binds the popup, options page, and every in-page
  surface Cocoon injects.
- **No native form controls and no boxed cards.** Chrome's own chevrons,
  checkboxes and borders are replaced, and sections are separated by space and
  a single thread rather than nested bordered cards — the audience is people
  reducing sensory load, and identical-weight bordered boxes fill the view with
  edges.

Technical constraints:

- MV3. The content script is built separately as a self-contained IIFE, because
  MV3 injects content scripts as classic scripts that cannot use the ES-module
  imports Rollup emits for shared chunks.
- The popup may read only the active tab's hostname (`activeTab`), never its
  content.

Terminology is defined in `CONTEXT.md`: intensity, override, profile, scenario,
rule, host rules, page kind, marker, rot, page plan, commit.

## Brand Commitments

- Name: **Cocoon**. Store category: Accessibility.
- Existing mark and icon set in `public/icons/` and `docs/assets/`.
- Voice: plain, specific, non-clinical. States what it does and what it does
  not do. Never promises a therapeutic outcome, never implies a diagnosis, and
  keeps the "presets, not diagnoses" caveat wherever profiles are explained.
- The interface is quiet by design; personality lives in precision, not
  decoration.

## Evidence on Hand

Real and usable:

- Generated store assets in `docs/assets/store/` — `screenshot-popup.png`,
  `screenshot-options.png`, `promo-440x280.png`, `promo-1400x560.png`, all
  produced from the built extension by `npm run screenshots`.
- Published privacy and support pages at `https://cocoon.lscaturchio.xyz/privacy/`
  and `/support/`, served from `docs/` via GitHub Pages.
- `docs/PROFILE_RATIONALE.md` — the reasoning behind each preset, including its
  stated limitations.
- `docs/STORE_LISTING.md` — a written submission kit with permission
  justifications and data-usage disclosures.
- Hand-written fixtures in `e2e/fixtures/` mirroring each site's live markup.

Absences that future work must not fabricate: Cocoon has **no users, no
installs, no reviews, no ratings, no testimonials, no press, and no
benchmarks**. It is not listed on the Chrome Web Store. No claim of adoption,
efficacy, or clinical benefit is available to make.

## Product Principles

1. **Silence is the success state.** When the feed cleaner is working there is
   nothing to see. Every banner, toast and notice must justify itself against
   an audience that experiences unnecessary interruption as a stressor.
2. **Failure is announced, not swallowed.** A rule that stopped matching is
   surfaced — to the user when the feature is actually broken, to the console
   when it is degraded but still working. Never fail silently.
3. **The user keeps the site.** Cocoon removes surfaces, never access. An
   opened post, a subreddit, a profile the user navigated to deliberately is
   never hidden; per-site overrides exist so a site can be exempted rather than
   abandoned.
4. **Local by construction, not by promise.** Privacy is enforced by the
   manifest and the absence of network code, so it is verifiable from the
   source rather than trusted from a policy page.
5. **Presets are starting points.** Profiles are named for common needs, not
   for diagnoses, and every one of them is fully overridable.

## Accessibility & Inclusion

The audience is defined by access needs, so accessibility is the product rather
than a compliance layer.

- Both extension pages are asserted against `jest-axe` with zero violations.
- Every injected in-page surface is real DOM with real semantics — the
  grounding overlay is `role="dialog"` + `aria-modal` with a focus trap and
  focus restoration; the rot notice is `role="status"` with a labelled dismiss
  control. Notices are never CSS `content` text, which assistive tech cannot
  reliably reach.
- The breathing guide is text updating an `aria-live` region, never animation.
- Dark mode is colour inversion with media re-inverted; the README points users
  wanting true per-site theming at a dedicated extension rather than
  over-claiming.
