// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { FACEBOOK_RULES } from "../rules/facebook";
import { UNIT_ATTR, type MarkerConfig } from "../rules";
import { markUnits, startMarkerObserver } from "./marker";

function mark(ruleId: string, config: MarkerConfig = cfg): number {
  return markUnits({ ruleId, cfg: config, unitAttr: UNIT_ATTR });
}

const cfg: MarkerConfig = {
  containerSelector: 'div[role="feed"]',
  unitSelector: ":scope > div",
  textAnchors: ["Suggested for you"]
};

function feedHtml(): string {
  return `
    <div role="feed">
      <div><span>Regular post from a friend</span></div>
      <div><span>Suggested for you</span><span>Someone random</span></div>
    </div>`;
}

describe("markUnits", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("marks only units containing an anchor phrase", () => {
    document.body.innerHTML = feedHtml();
    expect(mark("test.suggested")).toBe(1);
    const units = document.querySelectorAll('[data-cocoon-unit~="test.suggested"]');
    expect(units).toHaveLength(1);
    expect(units[0].textContent).toContain("Suggested for you");
  });

  it("is idempotent and stacks ids from several rules on one element", () => {
    document.body.innerHTML = feedHtml();
    mark("test.suggested");
    expect(mark("test.suggested")).toBe(0);
    expect(mark("test.other")).toBe(1);
    expect(document.querySelectorAll('[data-cocoon-unit~="test.suggested"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-cocoon-unit~="test.other"]')).toHaveLength(1);
  });

  it("returns 0 when the container is absent", () => {
    document.body.innerHTML = "<main></main>";
    expect(mark("test.suggested")).toBe(0);
  });

  it("marks the Facebook feed container via its screen-reader heading", () => {
    // Mirrors the live 2026 layout: role="feed" is gone; the container is the
    // div whose direct child is <h3>Feed posts</h3>.
    document.body.innerHTML = `
      <div role="main">
        <div><h3>Create a post</h3><div>composer</div></div>
        <div><h3>Stories</h3><div>stories cards</div></div>
        <div>
          <h3>Feed posts</h3>
          <div aria-hidden="true"></div>
          <div><div>post one</div><div>post two</div></div>
        </div>
      </div>`;
    const rule = FACEBOOK_RULES.rules.find((r) => r.id === "facebook.feedPosts");
    expect(rule?.mark).toBeDefined();
    expect(mark(rule!.id, rule!.mark!)).toBe(1);
    const marked = document.querySelectorAll('[data-cocoon-unit~="facebook.feedPosts"]');
    expect(marked).toHaveLength(1);
    expect(marked[0].querySelector("h3")?.textContent).toBe("Feed posts");
  });
});

describe("startMarkerObserver", () => {
  it("marks units added after start and stops cleanly", async () => {
    document.body.innerHTML = '<div role="feed"></div>';
    const stop = startMarkerObserver([
      { id: "test.suggested", label: "t", intensity: "none", mark: cfg }
    ]);
    const unit = document.createElement("div");
    unit.innerHTML = "<span>Suggested for you</span>";
    document.querySelector('[role="feed"]')!.appendChild(unit);
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(unit.getAttribute("data-cocoon-unit")).toBe("test.suggested");
    stop();
  });

  it("is a no-op for rule sets without markers", () => {
    expect(() => startMarkerObserver([{ id: "x.y", label: "t", intensity: "none", selector: "main" }])()).not.toThrow();
  });
});
