# Maintenance

## Status

Cocoon is maintained on a **best-effort** basis by a single author.

The feed cleaner depends on CSS selectors for seven third-party sites that
change their markup without notice. When a selector stops matching, the
extension tells you rather than failing silently. Issues and PRs that update
`FEED_RULES` are welcome and are the highest-value contribution you can make.

Security reports go through `SECURITY.md`, not the public issue tracker.

## Why selector rot is the main maintenance burden

`src/lib/feedRules.ts` maps each supported host to a small list of CSS
selectors. Those selectors are the entire feed-hiding mechanism, and they point
at markup owned by companies that redesign on their own schedule.

`countFeedMatches()` exists because of this. After the content script applies
the feed CSS, it counts how many elements the effective selectors actually
matched. Zero matches on a supported host means the site changed, and the
content script surfaces an in-page notice instead of leaving the user to
believe the feature is working.

This is a deliberate trade. Cocoon cannot guarantee a selector keeps working;
it can guarantee it never quietly pretends to.

## Fixing a broken selector

1. Open the affected site logged in, with the extension disabled.
2. Find the container that wraps the algorithmic feed — not an individual post,
   and not a wrapper so broad it also holds navigation or search results.
3. Confirm it matches, and check how many elements it hits:

   ```js
   // paste in DevTools console on the affected site
   document.querySelectorAll("YOUR-SELECTOR-HERE").length
   ```

   One or two matches is normal. Zero means the selector is wrong. Dozens
   usually means you have selected individual posts rather than the feed
   container, which makes the rule brittle.

4. Update the host's entry in `FEED_RULES` in `src/lib/feedRules.ts`.

   Order matters: `getEffectiveFeedSelectors()` uses only the **first**
   selector at `limited` intensity, so put the least aggressive one first.

5. Run `npm run check`, then verify by hand against
   `docs/DOMAIN_QA_TEMPLATE.md`.

## What automated tests do and do not cover

Covered by `npm run check`:

- selector *logic* — intensity handling, host matching, CSS construction
- rot *detection* — that `countFeedMatches()` reports zero when nothing matches
- domain consistency — host permissions in the manifest stay in sync with the
  hosts in `FEED_RULES` (`src/lib/domainConsistency.test.ts`)

Not covered, and not coverable in CI:

- whether a selector still matches the **live** site

Nothing in the test suite talks to x.com or Instagram, so a fully green build
is compatible with every selector being stale. Only the manual domain QA pass
catches that. Treat a green CI run as evidence the code is correct, not as
evidence the extension currently works.

## Release

See `docs/RELEASE.md` for versioning and store submission, and
`docs/STORE_LISTING.md` for the listing copy and the pre-upload smoke test.
