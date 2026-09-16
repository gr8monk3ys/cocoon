import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { markUnits } from "../src/lib/marker";
import { PATH_ATTR, planPage } from "../src/lib/pagePlan";
import { DEFAULT_SETTINGS, type CocoonSettings, type FeedIntensity } from "../src/lib/types";
import { HOST_RULES, ruleSelector, UNIT_ATTR } from "../src/rules";

function settingsAt(feedIntensity: FeedIntensity): CocoonSettings {
  return { ...DEFAULT_SETTINGS, feedIntensity };
}

/**
 * Selector-drift test. Every host has a hand-written fixture mirroring the
 * live markup its rules were verified against. A rule that no longer matches
 * its fixture is a rule someone edited badly; a fixture that no longer matches
 * the live site is caught by the content script's rot banner, not here.
 *
 * Which rules apply, and the CSS they produce, come from `planPage` — the same
 * interface the content script uses. This suite used to re-derive both inline,
 * and its copy of the marking algorithm had already drifted from the real one.
 */
for (const host of HOST_RULES) {
  test.describe(host.host, () => {
    const fixture = resolve(`e2e/fixtures/${host.host.split(".")[0]}.html`);

    test.beforeEach(async ({ page }) => {
      await page.goto(pathToFileURL(fixture).href);
    });

    for (const rule of host.rules.filter((r) => !r.mayBeAbsent)) {
      test(`${rule.id} matches the fixture`, async ({ page }) => {
        if (rule.mark) {
          // `markUnits` is self-contained precisely so it can be serialized into
          // a page with no bundle. One implementation, verified here.
          const marked = await page.evaluate(markUnits, {
            ruleId: rule.id,
            cfg: rule.mark,
            unitAttr: UNIT_ATTR
          });
          expect(marked, `${rule.id}: marker found nothing`).toBeGreaterThan(0);
        }
        expect(await page.locator(ruleSelector(rule)).count(), `${rule.id}: ${ruleSelector(rule)}`).toBeGreaterThan(0);
      });
    }

    test("generated CSS parses with zero dropped rules", async ({ page }) => {
      const plan = planPage(host.host, "/", settingsAt("none"));
      const parsed = await page.evaluate((cssText) => {
        const style = document.createElement("style");
        style.textContent = cssText;
        document.head.appendChild(style);
        return style.sheet ? style.sheet.cssRules.length : -1;
      }, plan.feedCss);
      expect(parsed).toBe(plan.feedCssRuleCount);
    });

    test("the fixture's home page hides its gentle rules and nothing else", async ({ page }) => {
      // Render exactly what the content script would inject at "limited".
      const limited = planPage(host.host, "/", settingsAt("limited"));
      const strongest = planPage(host.host, "/", settingsAt("none"));
      await page.evaluate(
        ([cssText, attr]) => {
          document.documentElement.setAttribute(attr, "home");
          const style = document.createElement("style");
          style.textContent = cssText;
          document.documentElement.appendChild(style);
        },
        [limited.feedCss, PATH_ATTR] as const
      );

      const gentleIds = new Set(limited.checkableRules.map((rule) => rule.id));
      // Marker rules are stamped by the observer, which is not running here.
      for (const rule of strongest.checkableRules.filter((r) => !r.mark)) {
        const hidden = await page.locator(ruleSelector(rule)).first().evaluate((el) => getComputedStyle(el).display === "none");
        expect(hidden, `${rule.id} at limited`).toBe(gentleIds.has(rule.id));
      }
    });
  });
}
