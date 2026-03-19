import { chromium } from "playwright";
import type { MapsBusinessData, Review } from "./types";

// Robust multi-strategy text extractor
async function tryText(
  page: import("playwright").Page,
  selectors: string[]
): Promise<string | null> {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 })) {
        const t = await el.textContent();
        if (t?.trim()) return t.trim();
      }
    } catch { /* next */ }
  }
  return null;
}

async function tryAttr(
  page: import("playwright").Page,
  selectors: string[],
  attr: string
): Promise<string | null> {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 })) {
        const v = await el.getAttribute(attr);
        if (v?.trim()) return v.trim();
      }
    } catch { /* next */ }
  }
  return null;
}

export async function fetchMapsData(url: string): Promise<MapsBusinessData> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-US",
    timezoneId: "America/New_York",
    viewport: { width: 1280, height: 900 },
  });

  // Hide automation fingerprints
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });

    // Accept cookie consent if shown (EU / global)
    try {
      for (const sel of [
        'button:has-text("Accept all")',
        'button:has-text("Accept")',
        'form[action*="consent"] button',
      ]) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 2_000 })) {
          await btn.click();
          await page.waitForTimeout(1_500);
          break;
        }
      }
    } catch { /* no consent */ }

    // Wait for h1 (business name) to appear
    await page.waitForSelector("h1", { timeout: 20_000 });
    await page.waitForTimeout(1_500);

    // ── Business name ───────────────────────────────────────────────
    const name =
      (await tryText(page, ["h1.DUwDvf", "h1"])) ?? "unknown";

    // ── Rating ──────────────────────────────────────────────────────
    let rating: number | "unknown" = "unknown";
    const ratingAria = await tryAttr(page, [
      'span[aria-label*="stars"]',
      'div[aria-label*="stars"]',
      '[aria-label*=" star"]',
    ], "aria-label");
    if (ratingAria) {
      const m = ratingAria.match(/(\d+\.?\d*)/);
      if (m) rating = parseFloat(m[1]);
    }
    if (rating === "unknown") {
      const ratingTxt = await tryText(page, ["div.F7nice span", "span.ceNzKf", "div.MW4etd"]);
      if (ratingTxt) {
        const n = parseFloat(ratingTxt);
        if (!isNaN(n) && n <= 5) rating = n;
      }
    }

    // ── Review count ────────────────────────────────────────────────
    let review_count: number | "unknown" = "unknown";
    const reviewCountText = await tryText(page, [
      'span[aria-label*="reviews"]',
      'button[aria-label*="reviews"]',
      "div.UY7F9",
    ]);
    if (reviewCountText) {
      const m = reviewCountText.match(/([\d,]+)/);
      if (m) review_count = parseInt(m[1].replace(/,/g, ""), 10);
    }

    // ── Category ───────────────────────────────────────────────────
    const category =
      (await tryText(page, [
        "button.DkEaL",
        "span.YhemCb",
        "div.skqShb button",
        "[data-item-id='category']",
      ])) ?? "unknown";

    // ── Reviews ────────────────────────────────────────────────────
    const reviews: Review[] = [];

    try {
      // Click Reviews tab
      const reviewsTab = page
        .locator('button[aria-label*="Reviews"], button[data-tab-index="1"]')
        .first();
      if (await reviewsTab.isVisible({ timeout: 5_000 })) {
        await reviewsTab.click();
        await page.waitForTimeout(2_000);

        // Sort by Newest
        try {
          const sortBtn = page
            .locator('button[aria-label*="Sort"], button[data-value="Sort"]')
            .first();
          if (await sortBtn.isVisible({ timeout: 3_000 })) {
            await sortBtn.click();
            await page.waitForTimeout(800);
            const newestOption = page
              .locator(
                'li[data-index="1"], div[role="menuitem"]:has-text("Newest"), li:has-text("Newest")'
              )
              .first();
            if (await newestOption.isVisible({ timeout: 2_000 })) {
              await newestOption.click();
              await page.waitForTimeout(2_000);
            }
          }
        } catch { /* keep default sort */ }

        // Scroll to load up to ~25 reviews
        const scrollTarget = page
          .locator('div[role="main"]')
          .first();
        for (let i = 0; i < 6; i++) {
          try {
            await scrollTarget.evaluate((el) => el.scrollBy(0, 2500));
          } catch {
            await page.evaluate(() => window.scrollBy(0, 2500));
          }
          await page.waitForTimeout(1_200);
        }

        // Extract individual reviews
        const reviewEls = await page.locator("div.jftiEf").all().catch(() => []);

        for (const rev of reviewEls.slice(0, 25)) {
          try {
            // Expand "More" if present
            try {
              const more = rev.locator("button.w8nwRe").first();
              if (await more.isVisible({ timeout: 400 })) {
                await more.click();
                await page.waitForTimeout(200);
              }
            } catch { /* not expandable */ }

            // Star rating
            let revRating = 0;
            const starAria = await rev
              .locator('[aria-label*="star"]')
              .first()
              .getAttribute("aria-label")
              .catch(() => null);
            if (starAria) {
              const m = starAria.match(/(\d)/);
              if (m) revRating = parseInt(m[1], 10);
            }

            // Date
            const date =
              (await rev
                .locator("span.rsqaWe")
                .first()
                .textContent()
                .catch(() => null))?.trim() ?? "unknown";

            // Text
            const text =
              (await rev
                .locator("span.wiI7pd")
                .first()
                .textContent()
                .catch(() => null))?.trim().slice(0, 600) ?? "";

            // Owner reply
            const ownerReplied = await rev
              .locator("div.CDe7pd")
              .count()
              .then((c) => c > 0)
              .catch(() => false as boolean | "unknown");

            if (revRating > 0 || text.length > 0) {
              reviews.push({ date, rating: revRating, text, owner_replied: ownerReplied });
            }
          } catch { /* skip broken review */ }
        }
      }
    } catch { /* reviews section unavailable */ }

    return { name, category, rating, review_count, maps_url: url, reviews };
  } finally {
    await browser.close().catch(() => {});
  }
}
