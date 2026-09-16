# Cocoon — domain model

The words this codebase uses, and what they mean. Terms here are load-bearing:
module names, types and test names use them, so renaming one is a rename
everywhere.

## The product

**Feed cleaner** — the feature that hides algorithmic feeds. Off by default on
unsupported sites; never removes anything the user navigated to deliberately.

**Intensity** — how much the feed cleaner hides, one of three values:

| value     | meaning                                                        |
| --------- | -------------------------------------------------------------- |
| `full`    | the full feed, i.e. the cleaner is **off**                      |
| `limited` | the feed itself                                                 |
| `none`    | the feed plus Reels/Stories/Explore-style suggestion surfaces    |

`full` reads backwards the first time: it names what the *user sees*, not what
the extension does. Nothing hides at `full`.

**Override** — a per-site decision that beats the global intensity, stored
under a normalized hostname. Enabling a site can only ever clean *more* than
the global setting, never less.

**Profile** — a named bundle of settings (ADHD, Autism, Anxiety, Custom). Any
manual edit moves the profile to `custom`; that rule lives in `manualEdit`.

**Scenario** — a timed profile (Focus, Low stimulation, Calm reset, Social
guardrails) that snapshots the settings it replaced and restores them when it
expires.

**Grounding overlay** — the motion-free breathing timer and 5-4-3-2-1 flow.

## The rules

**Rule** — one hideable surface on one host: an id, the gentlest **intensity**
that switches it on, and either a CSS `selector` or a `mark`. Never both.
`src/rules/<host>.ts` is the single source of truth.

**Host rules** — every rule for one site, plus its aliases (`twitter.com` for
`x.com`) and its **page kind** prefixes.

**Page kind** — coarse classification of a pathname: `home`, `reels`,
`explore`, `stories`, `watch`, `post`, `other`. Stamped on `<html>` as
`data-cocoon-path` so path-scoped rules can be plain CSS that survives SPA
navigation without rebuilding the stylesheet.

**Marker** — a rule that CSS alone cannot express. A MutationObserver finds
units by their text (Facebook's feed is identifiable only by its screen-reader
heading) and stamps `data-cocoon-unit`, which the generated CSS then hides.

**Rot** — a rule that stopped matching because the site changed its markup.
*Total* rot (nothing matches) becomes a user-facing banner. *Partial* rot (some
selectors dead, others alive) goes to the console only: the feed is still
hidden, so a banner would be noise, and unnecessary banners are the wrong thing
to hand someone using a calm-focused extension.

## The architecture

**Page plan** — everything the content script needs to know about the current
page, decided in one pure call: `planPage(hostname, pathname, settings)`.
Resolves the host once, applies the **override**, classifies the **page kind**,
and returns the stylesheet, the active **rules**, and the rules whose absence
would mean **rot**. Deciding is pure and lives above the seam; touching the
document is `pageDom` and lives below it.

**Page surface** (`src/lib/pageDom.ts`) — the only module that writes to the
page: stylesheet, path attribute, marker observer. Everything it does is driven
by a **page plan**.

**Commit** — the one write path for settings (`commitSettings`): derive the
mirrored fields, persist, broadcast to open tabs. Nothing else saves settings.
