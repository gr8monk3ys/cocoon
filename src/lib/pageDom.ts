import { ruleSelector } from "../rules";
import { startMarkerObserver } from "./marker";
import { PATH_ATTR, type PagePlan } from "./pagePlan";

let styleTag: HTMLStyleElement | null = null;
let stopMarkerObserver: (() => void) | null = null;

/**
 * The only module that writes to the page. Everything it does is driven by a
 * plan, so what happens on a page is decided (and testable) before anything is
 * touched: stylesheet, path attribute, marker observer.
 */
export function applyPlan(plan: PagePlan): void {
  // Adopt an existing tag before making one: a content script can be injected
  // into a page twice, and two stylesheets would fight.
  styleTag ??= document.querySelector<HTMLStyleElement>("#cocoon-style");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "cocoon-style";
    document.documentElement.appendChild(styleTag);
  }
  styleTag.textContent = plan.css;
  document.documentElement.setAttribute(PATH_ATTR, plan.path);

  // Restart rather than reconcile: rule sets are small and a settings change
  // can add or drop marker rules entirely.
  stopMarkerObserver?.();
  stopMarkerObserver = startMarkerObserver(plan.activeRules);
}

function countMatches(root: ParentNode, selector: string): number {
  try {
    return root.querySelectorAll(selector).length;
  } catch {
    // Malformed selector: treat as no match rather than throwing.
    return 0;
  }
}

/**
 * How many feed elements the plan's checkable rules currently match. Used to
 * detect total selector rot (a supported site changed its markup) so the user
 * gets told instead of the feature failing silently.
 */
export function countFeedMatches(root: ParentNode, plan: PagePlan): number {
  let count = 0;
  for (const rule of plan.checkableRules) {
    count += countMatches(root, ruleSelector(rule));
  }
  return count;
}

/**
 * Checkable selectors that currently match nothing, while at least one sibling
 * still does — i.e. *partial* rot.
 *
 * `countFeedMatches` sums across selectors, so it cannot see this: Reddit
 * carried a dead `[data-testid='post-container']` rule for months while
 * `shreddit-feed` kept the total above zero and the user-facing rot warning
 * silent. Partial rot is invisible to the total by construction, and it is the
 * more common kind, because sites rarely rename every feed surface at once.
 *
 * Returns [] when nothing matches at all — that is total rot, which
 * `countFeedMatches` already reports to the user.
 */
export function findDeadFeedSelectors(root: ParentNode, plan: PagePlan): string[] {
  const dead: string[] = [];
  let anyMatched = false;

  for (const rule of plan.checkableRules) {
    const selector = ruleSelector(rule);
    if (countMatches(root, selector) > 0) {
      anyMatched = true;
    } else {
      dead.push(selector);
    }
  }

  return anyMatched ? dead : [];
}
