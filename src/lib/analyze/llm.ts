import OpenAI from "openai";
import type { Issue, PageSignals } from "./types";

const apiKey = process.env.OPENAI_API_KEY?.trim();
// Important: do NOT throw at module-evaluation time.
// On serverless/standalone this can crash the whole handler on import.
const client = apiKey ? new OpenAI({ apiKey }) : null;

export async function llmIssues(args: {
  page: PageSignals;
  mobilePage: PageSignals;
  lighthouseScores: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
}): Promise<{
  issues: Issue[];
  recommendations: { quickWins: string[]; nextSteps: string[] };
}> {
  if (!client) {
    throw Object.assign(
      new Error("Problem with server setup. Contact support."),
      { status: 500 },
    );
  }

  const { page, mobilePage, lighthouseScores } = args;

  const mobileSection =
    `--- MOBILE signals (412×823 viewport, Android UA — used for SEO evaluation) ---\n` +
    `Title: ${mobilePage.title}\n` +
    `Meta description: ${mobilePage.metaDescription}\n` +
    `H1 count: ${mobilePage.h1.length}\n` +
    `H1 samples: ${mobilePage.h1.slice(0, 3).join(" | ")}\n` +
    `Canonical: ${mobilePage.canonical}\n` +
    `Robots meta: ${mobilePage.robotsMeta}\n` +
    `Viewport meta present: ${mobilePage.hasViewportMeta}\n` +
    (mobilePage.smallTapTargets !== undefined
      ? `Small tap targets (<48px): ${mobilePage.smallTapTargets}\n`
      : "") +
    `Images sample (src, alt): ${mobilePage.images
      .slice(0, 8)
      .map((i) => `${i.src} (alt=${i.alt ?? "null"})`)
      .join(" ; ")}\n` +
    `Links sample: ${mobilePage.links
      .slice(0, 12)
      .map((l) => `${l.text || "(no text)"} -> ${l.href}`)
      .join(" ; ")}`;

  const prompt = {
    role: "user" as const,
    content: [
      {
        type: "text" as const,
        text:
          `You are a senior web performance + technical SEO specialist.\n` +
          `Analyze the signals and return STRICT JSON only.\n\n` +
          `Return schema:\n` +
          `{\n` +
          `  "issues":[{"id":"...","title":"...","severity":"high|medium|low","evidence":"...","fix":"...","impact":"..."}],\n` +
          `  "recommendations":{"quickWins":["..."],"nextSteps":["..."]}\n` +
          `}\n\n` +
          `--- DESKTOP signals (performance, accessibility, best-practices context) ---\n` +
          `URL: ${page.finalUrl}\n` +
          `Title: ${page.title}\n` +
          `Meta description: ${page.metaDescription}\n` +
          `H1 count: ${page.h1.length}\n` +
          `H1 samples: ${page.h1.slice(0, 3).join(" | ")}\n` +
          `H2 count: ${page.h2.length}\n` +
          `Canonical: ${page.canonical}\n` +
          `Robots meta: ${page.robotsMeta}\n` +
          `Viewport meta present: ${page.hasViewportMeta}\n` +
          `Images sample (src, alt): ${page.images
            .slice(0, 8)
            .map((i) => `${i.src} (alt=${i.alt ?? "null"})`)
            .join(" ; ")}\n` +
          `Links sample: ${page.links
            .slice(0, 12)
            .map((l) => `${l.text || "(no text)"} -> ${l.href}`)
            .join(" ; ")}\n\n` +
          `${mobileSection}\n\n` +
          `Lighthouse scores (performance/accessibility/best-practices = desktop; seo = mobile): ${JSON.stringify(lighthouseScores)}\n\n` +
          `IMPORTANT: All SEO issues must be evaluated from the MOBILE perspective (use mobile signals above).\n` +
          `Prioritize issues that affect: calls/leads, mobile UX, and Google visibility.\n` +
          `Be specific and actionable. No generic advice.`,
      },
    ],
  };

  const resp = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [prompt],
    temperature: 0.2,
  });

  const text = resp.choices[0]?.message?.content ?? "";

  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  try {
    const json = JSON.parse(cleaned);
    return json;
  } catch {
    return {
      issues: [
        {
          id: "llm_parse_error",
          title: "LLM output was not valid JSON",
          severity: "low",
          evidence: text.slice(0, 600),
        },
      ],
      recommendations: { quickWins: [], nextSteps: [] },
    };
  }
}
