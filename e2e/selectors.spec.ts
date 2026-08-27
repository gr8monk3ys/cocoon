import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildFeedCleanerCss, countRuleCss, getEffectiveFeedRules, PATH_ATTR } from "../src/lib/feedRules";
import { HOST_RULES, ruleSelector } from "../src/rules";

/**
 * Selector-drift test. Every host has a hand-written fixture mirroring the
 * live markup its rules were verified against. A rule that no longer matches
 * its fixture is a rule someone edited badly; a fixture that no longer matches
 * the live site is caught by the content script's rot banner, not here.
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
          const marked = await page.evaluate(
            ([id, cfg]) => {
              // Same algorithm as src/lib/marker.ts, inlined because the page has no bundle.
              let n = 0;
              for (const container of document.querySelectorAll(cfg.containerSelector)) {
                for (const unit of container.querySelectorAll(cfg.unitSelector)) {
                  if (cfg.textAnchors.some((a) => (unit.textContent ?? "").includes(a))) {
                    unit.setAttribute("data-cocoon-unit", id);
                    n += 1;
                  }
                }
              }
              return n;
            },
            [rule.id, rule.mark] as const
          );
          expect(marked, `${rule.id}: marker found nothing`).toBeGreaterThan(0);
        }
        expect(await page.locator(ruleSelector(rule)).count(), `${rule.id}: ${ruleSelector(rule)}`).toBeGreaterThan(0);
      });
    }

    test("generated CSS parses with zero dropped rules", async ({ page }) => {
      const rules = getEffectiveFeedRules(host.host, "none");
      const css = buildFeedCleanerCss(host.host, "none");
      const parsed = await page.evaluate((cssText) => {
        const style = document.createElement("style");
        style.textContent = cssText;
        document.head.appendChild(style);
        return style.sheet ? style.sheet.cssRules.length : -1;
      }, css);
      expect(parsed).toBe(countRuleCss(rules));
    });

    test("the fixture's home page hides its gentle rules and nothing else", async ({ page }) => {
      // Render exactly what the content script would inject at "limited".
      const css = buildFeedCleanerCss(host.host, "limited");
      await page.evaluate(
        ([cssText, attr]) => {
          document.documentElement.setAttribute(attr, "home");
          const style = document.createElement("style");
          style.textContent = cssText;
          document.documentElement.appendChild(style);
        },
        [css, PATH_ATTR] as const
      );
      for (const rule of host.rules.filter((r) => !r.mayBeAbsent && !r.mark && (!r.paths || r.paths.includes("home")))) {
        const hidden = await page.locator(ruleSelector(rule)).first().evaluate((el) => getComputedStyle(el).display === "none");
        expect(hidden, `${rule.id} at limited`).toBe(rule.intensity === "limited");
      }
    });
  });
}
