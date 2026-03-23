import { launch as launchChrome } from "chrome-launcher";
import type { LighthouseScores } from "./types";

export async function runLighthouse(
  url: string
): Promise<{ scores: LighthouseScores; summary: string[] }> {
  // Import inside the function so missing optional assets don't crash the whole module evaluation.
  const { default: lighthouse } = await import("lighthouse");
  const { chromium } = await import("playwright");

  // Ensure lighthouse uses the same Chromium binary as Playwright.
  const chromePath = await chromium.executablePath();

  const chrome = await launchChrome({
    chromePath,
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    // --- Pass 1: Desktop, no throttling ---
    // Performance/Accessibility/Best-Practices are measured in desktop context
    // without CPU throttle so scores match real Chrome DevTools on a desktop.
    // Default 4× CPU slowdown on a shared cloud vCPU produces artificially
    // low Performance scores compared to what users see locally.
    const desktopResult = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices"],
    }, {
      extends: "lighthouse:default",
      settings: {
        throttlingMethod: "provided",
        throttling: {
          rttMs: 0,
          throughputKbps: 0,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        formFactor: "desktop",
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
        emulatedUserAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    // --- Pass 2: Mobile, standard throttling ---
    // SEO audits are evaluated as Google's mobile crawler sees the page:
    // viewport 412×823, mobile UA, standard network conditions.
    const mobileResult = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["seo"],
    }, {
      extends: "lighthouse:default",
      settings: {
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
        emulatedUserAgent:
          "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",
      },
    });

    const desktopCats = desktopResult?.lhr?.categories;
    const mobileCats = mobileResult?.lhr?.categories;
    if (!desktopCats || !mobileCats) throw new Error("Lighthouse failed: no categories");

    const scores: LighthouseScores = {
      performance:    Math.round((desktopCats.performance?.score      ?? 0) * 100),
      accessibility:  Math.round((desktopCats.accessibility?.score    ?? 0) * 100),
      bestPractices:  Math.round((desktopCats["best-practices"]?.score ?? 0) * 100),
      seo:            Math.round((mobileCats.seo?.score               ?? 0) * 100),
    };

    const summary = [
      `Performance (desktop): ${scores.performance}/100`,
      `SEO (mobile): ${scores.seo}/100`,
      `Best practices (desktop): ${scores.bestPractices}/100`,
      `Accessibility (desktop): ${scores.accessibility}/100`,
    ];

    return { scores, summary };
  } finally {
    try { chrome.kill(); } catch { /* ignore */ }
  }
}
