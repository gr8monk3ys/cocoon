import { UNIT_ATTR, type FeedRule, type MarkerConfig } from "../rules";

function addToken(element: Element, token: string): boolean {
  const tokens = (element.getAttribute(UNIT_ATTR) ?? "").split(/\s+/).filter(Boolean);
  if (tokens.includes(token)) {
    return false;
  }
  element.setAttribute(UNIT_ATTR, [...tokens, token].join(" "));
  return true;
}

/**
 * Stamps `data-cocoon-unit="<ruleId>"` on every unit inside a container whose
 * text contains one of the anchors. Returns how many were newly marked.
 */
export function markUnits(root: ParentNode, ruleId: string, cfg: MarkerConfig): number {
  let marked = 0;
  for (const container of root.querySelectorAll(cfg.containerSelector)) {
    for (const unit of container.querySelectorAll(cfg.unitSelector)) {
      const text = unit.textContent ?? "";
      if (cfg.textAnchors.some((anchor) => text.includes(anchor)) && addToken(unit, ruleId)) {
        marked += 1;
      }
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
      markUnits(document, rule.id, rule.mark);
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
