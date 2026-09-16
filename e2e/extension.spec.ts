import { chromium, expect, test, type BrowserContext } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { hostRulesFor, planPage } from "../src/lib/pagePlan";
import { DEFAULT_SETTINGS } from "../src/lib/types";
import { HOST_RULES, ruleSelector } from "../src/rules";

/**
 * Loads the BUILT extension (dist/) into Chromium and serves each host's
 * fixture at that host's real URL, so the content script runs exactly as it
 * would on the live site: manifest match, path stamping, marker observer,
 * injected CSS, rot banner. This is the closest thing to a store smoke test
 * that can run in CI.
 */
const DIST = resolve("dist");
const runsWithExtension = existsSync(join(DIST, "manifest.json"));

test.skip(!runsWithExtension, "dist/ is missing: run `npm run build` first");

let context: BrowserContext;
let userDataDir: string;

test.beforeAll(async () => {
  userDataDir = await mkdtemp(join(tmpdir(), "cocoon-e2e-"));
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    args: [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`]
  });
  // Any request to a supported host is answered with its fixture; nothing
  // else is allowed out.
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    // Alias-aware, and does not match a host that merely *ends with* a
    // supported name — which the inline `endsWith` here used to.
    const host = hostRulesFor(url.hostname);
    if (host && route.request().resourceType() === "document") {
      await route.fulfill({
        contentType: "text/html",
        body: readFileSync(resolve(`e2e/fixtures/${host.host.split(".")[0]}.html`), "utf8")
      });
      return;
    }
    await route.abort();
  });
});

test.afterAll(async () => {
  await context?.close();
  if (userDataDir) {
    await rm(userDataDir, { recursive: true, force: true });
  }
});

for (const host of HOST_RULES) {
  test(`${host.host}: the built content script hides the feed at the default intensity`, async () => {
    test.setTimeout(30_000);
    const page = await context.newPage();
    await page.goto(`https://www.${host.host}/`);

    // The content script runs at document_idle and reads settings first.
    await expect(page.locator("style#cocoon-style")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("data-cocoon-path", "home");

    // The plan the content script itself computes for this page at the default
    // settings: every rule whose absence would mean rot must be hidden.
    const gentle = planPage(host.host, "/", DEFAULT_SETTINGS).checkableRules;
    expect(gentle.length).toBeGreaterThan(0);
    for (const rule of gentle) {
      await expect(page.locator(ruleSelector(rule)).first(), rule.id).toBeAttached();
      await expect(page.locator(ruleSelector(rule)).first(), rule.id).toBeHidden();
    }

    // The feed was found, so the confirmation banner (not the rot warning)
    // shows on this first visit.
    await expect(page.locator("#cocoon-feed-banner-text")).toContainText("feed filtered on this site");
    await page.close();
  });
}

test("instagram: a post page keeps its post visible and shows no rot warning", async () => {
  const page = await context.newPage();
  await page.goto("https://www.instagram.com/p/abc123/");
  await expect(page.locator("style#cocoon-style")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("data-cocoon-path", "post");
  await expect(page.locator("main article").first()).toBeVisible();
  // Give the delayed rot re-checks (1.5s, 4s) time to fire — they must not.
  await page.waitForTimeout(4_500);
  await expect(page.locator("#cocoon-feed-banner")).toHaveCount(0);
  await page.close();
});
