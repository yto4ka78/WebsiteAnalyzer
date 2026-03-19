import { chromium } from "playwright";
import path from "path";
import type { PageSignals } from "./types";

export async function fetchPageSignals(url: string): Promise<PageSignals> {
  // In serverless environments (Netlify), the default Playwright browser cache
  // path (e.g. ~/.cache/ms-playwright) may not exist at runtime.
  // We force Playwright to use a path inside the deployed bundle.
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH?.trim()) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(
      process.cwd(),
      "node_modules",
      ".cache",
      "ms-playwright"
    );
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: "Mozilla/5.0 (compatible; WebsiteAnalyzer/1.0)",
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    const finalUrl = page.url();

    const title = await page.title().catch(() => null);

    const metaDescription = await page
      .locator('meta[name="description"]')
      .getAttribute("content")
      .catch(() => null);
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href")
      .catch(() => null);
    const robotsMeta = await page
      .locator('meta[name="robots"]')
      .getAttribute("content")
      .catch(() => null);
    const viewport = await page
      .locator('meta[name="viewport"]')
      .count()
      .catch(() => 0);

    const h1 = await page
      .locator("h1")
      .allTextContents()
      .catch(() => []);
    const h2 = await page
      .locator("h2")
      .allTextContents()
      .catch(() => []);

    const images = await page
      .$$eval("img", (imgs) =>
        imgs.slice(0, 40).map((img) => ({
          src: (img.getAttribute("src") || "").slice(0, 300),
          alt: img.getAttribute("alt"),
        }))
      )
      .catch(() => []);

    const links = await page
      .$$eval("a", (as) =>
        as.slice(0, 60).map((a) => ({
          href: (a.getAttribute("href") || "").slice(0, 300),
          text: (a.textContent || "").trim().slice(0, 120),
        }))
      )
      .catch(() => []);

    return {
      url,
      finalUrl,
      title,
      metaDescription,
      h1,
      h2,
      canonical,
      robotsMeta,
      hasViewportMeta: viewport > 0,
      images,
      links,
    };
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
