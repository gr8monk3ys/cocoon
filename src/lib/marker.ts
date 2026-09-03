import { UNIT_ATTR, type FeedRule, type MarkerConfig } from "../rules";

export interface MarkRequest {
  ruleId: string;
  cfg: MarkerConfig;
  /** Attribute to stamp; always `UNIT_ATTR` in production. */
  unitAttr: string;
}

/**
 * Stamps `data-cocoon-unit="<ruleId>"` on every unit inside a container whose
 * text contains one of the anchors, appending to any tokens already there.
 * Returns how many were newly marked.
 *
 * Deliberately self-contained: no imports, no closure, exactly one argument.
 * The fixture e2e serializes this function's source into a page that has no
 * bundle (`page.evaluate`), so a free variable here would become a
 * ReferenceError there — and the suite would go back to keeping its own,
 * divergent copy of the algorithm.
 */
export function markUnits({ ruleId, cfg, unitAttr }: MarkRequest): number {
  let marked = 0;
  for (const container of document.querySelectorAll(cfg.containerSelector)) {
    for (const unit of container.querySelectorAll(cfg.unitSelector)) {
      const text = unit.textContent ?? "";
      if (!cfg.textAnchors.some((anchor) => text.includes(anchor))) {
        continue;
      }
      const tokens = (unit.getAttribute(unitAttr) ?? "").split(/\s+/).filter(Boolean);
      if (tokens.includes(ruleId)) {
        continue;
      }
      unit.setAttribute(unitAttr, [...tokens, ruleId].join(" "));
      marked += 1;
    }
  }
  return marked;
}

/**
 * Scans now and keeps marking as the SPA renders. Mutation bursts are batched
 * into one scan per 250ms. Returns a stop function.
 */
export function startMarkerObserver(rules: FeedRule[]): () => void {
  const markable = rules.filter((rule): rule is FeedRule & { mark: MarkerConfig } => rule.mark !== undefined);
  if (markable.length === 0) {
    return () => {};
  }

  let timer: number | undefined;
  const scan = (): void => {
    for (const rule of markable) {
      markUnits({ ruleId: rule.id, cfg: rule.mark, unitAttr: UNIT_ATTR });
    }
  };
  const observer = new MutationObserver(() => {
    if (timer !== undefined) {
      return;
    }
    timer = window.setTimeout(() => {
      timer = undefined;
      scan();
    }, 250);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scan();

  return () => {
    observer.disconnect();
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
  };
}
