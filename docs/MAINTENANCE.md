# Maintenance

## Status

Cocoon is maintained on a **best-effort** basis by a single author.

The feed cleaner depends on CSS selectors for seven third-party sites that
change their markup without notice. When a host's selectors stop matching, the
extension says so rather than failing silently — see the limits of that below.
Issues and PRs that update `FEED_RULES` are welcome and are the highest-value
contribution you can make.

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

### Two kinds of rot, two different signals

`countFeedMatches()` **sums** across a host's selectors, so it only sees rot
when *every* selector for that host dies. That leaves a blind spot, and it is
not hypothetical: Reddit carried a dead `[data-testid='post-container']` rule
for months while `shreddit-feed` kept the total above zero and the warning
silent. Sites rarely rename every feed surface at once, so partial rot is the
more common kind.

| | detected by | reported to | user impact |
|---|---|---|---|
| **total** — no selector matches | `countFeedMatches() === 0` | in-page banner | feed is not hidden |
| **partial** — some match, some don't | `findDeadFeedSelectors()` | `console.warn`, once per page load | none; feed still hidden |

Partial rot is deliberately **not** a banner. The feed is still being hidden, so
the feature works from the user's side and a warning would be pure noise —
`docs/BRAND.md` treats an unnecessary banner as a stressor, which is the wrong
thing to hand someone using a calm-focused extension. Its audience is whoever
maintains `FEED_RULES`.

So the honest guarantee is narrower than "it never fails silently": Cocoon will
not silently stop working, but it *can* silently accumulate dead selectors. The
console warning is what closes that gap, and it only helps someone who looks.

## Fixing a broken selector

Fastest way to find one: open a supported site with the extension **enabled**
and check the DevTools console. Partial rot prints there:

```
[Cocoon] 1 feed selector(s) for reddit.com no longer match anything,
though the feed is still being hidden by the rest. Please report this: …
```

Then:

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
