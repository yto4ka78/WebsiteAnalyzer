import { chromium } from "playwright";
import type { PageSignals } from "./types";

/** Realistic UA — some hosts redirect "simple" bots in a loop or to broken rules. */
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36";

function isTooManyRedirects(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("ERR_TOO_MANY_REDIRECTS") ||
    msg.includes("too many redirects") ||
    msg.includes("net::ERR_TOO_MANY_REDIRECTS")
  );
}

async function gotoWithFallback(page: import("playwright").Page, inputUrl: string): Promise<void> {
  try {
    await page.goto(inputUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    return;
  } catch (e) {
    if (!isTooManyRedirects(e)) throw e;
    try {
      const u = new URL(inputUrl);
      if (u.protocol === "https:") {
        u.protocol = "http:";
        await page.goto(u.toString(), { waitUntil: "domcontentloaded", timeout: 45_000 });
        return;
      }
    } catch {
      /* ignore fallback failure */
    }
    throw new Error(
      "The site returns an endless redirect loop (ERR_TOO_MANY_REDIRECTS). " +
        "This is usually a server or CDN misconfiguration on that domain, not a bug in the analyzer. " +
        "Try opening the URL in a normal browser; if it works there, the host may be blocking or mishandling automated clients."
    );
  }
}

export async function fetchPageSignals(
  url: string,
  { mobile = false }: { mobile?: boolean } = {}
): Promise<PageSignals> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: mobile ? MOBILE_UA : CHROME_UA,
    viewport: mobile ? { width: 412, height: 823 } : { width: 1350, height: 940 },
  });

  try {
    await gotoWithFallback(page, url);
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

    // Mobile-only: count interactive elements smaller than the recommended 48×48 px touch target
    let smallTapTargets: number | undefined;
    if (mobile) {
      smallTapTargets = await page
        .$$eval("a, button, [role='button'], input, select, textarea", (els) =>
          els.filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && (r.width < 48 || r.height < 48);
          }).length
        )
        .catch(() => undefined);
    }

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
      isMobile: mobile || undefined,
      smallTapTargets,
    };
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
