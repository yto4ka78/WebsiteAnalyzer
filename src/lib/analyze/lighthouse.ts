import { launch as launchChrome } from "chrome-launcher";
import type { LighthouseScores } from "./types";

export async function runLighthouse(
  url: string
): Promise<{ scores: LighthouseScores; summary: string[] }> {
  // Import inside the function so missing optional assets don't crash the whole module evaluation.
  // This also helps us debug stages in server logs.
  const { default: lighthouse } = await import("lighthouse");

  const chrome = await launchChrome({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });

    const cats = result?.lhr?.categories;
    if (!cats) throw new Error("Lighthouse failed: no categories");

    const scores: LighthouseScores = {
      performance: Math.round((cats.performance?.score ?? 0) * 100),
      accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((cats["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((cats.seo?.score ?? 0) * 100),
    };

    const summary = [
      `Performance: ${scores.performance}/100`,
      `SEO: ${scores.seo}/100`,
      `Best practices: ${scores.bestPractices}/100`,
      `Accessibility: ${scores.accessibility}/100`,
    ];

    return { scores, summary };
  } finally {
    try { chrome.kill(); } catch { /* ignore */ }
  }
}
