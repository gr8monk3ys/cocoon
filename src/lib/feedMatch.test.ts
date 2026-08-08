// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { countFeedMatches } from "./feedRules";

describe("countFeedMatches (selector-rot detection)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("counts matching feed elements on a supported host", () => {
    document.body.innerHTML = "<shreddit-feed></shreddit-feed>";
    expect(countFeedMatches(document, "reddit.com", "limited")).toBe(1);
  });

  it("returns 0 when the markup no longer matches (selector rot)", () => {
    document.body.innerHTML = "<div class='totally-different-layout'></div>";
    expect(countFeedMatches(document, "reddit.com", "limited")).toBe(0);
  });

  it("returns 0 for unsupported hosts and for 'full' intensity", () => {
    document.body.innerHTML = "<shreddit-feed></shreddit-feed>";
    expect(countFeedMatches(document, "example.com", "none")).toBe(0);
    expect(countFeedMatches(document, "reddit.com", "full")).toBe(0);
  });

  it("does not match a Reddit post page at any intensity", () => {
    // A comments page renders <shreddit-post> with no enclosing <shreddit-feed>.
    // Guards against 'fixing' the stale [data-testid='post-container'] rule by
    // adding a post-level selector, which would hide the post the user opened.
    document.body.innerHTML = "<shreddit-post></shreddit-post>";
    expect(countFeedMatches(document, "reddit.com", "limited")).toBe(0);
    expect(countFeedMatches(document, "reddit.com", "none")).toBe(0);
  });
});
