import { NextResponse } from "next/server";
import PQueue from "p-queue";
import { analyzeSchema } from "@/lib/validators";
import { fetchPageSignals } from "@/lib/analyze/pageFetch";
import { runLighthouse } from "@/lib/analyze/lighthouse";
import { llmIssues } from "@/lib/analyze/llm";
import type { AnalyzeError, AnalyzeResponse } from "@/lib/analyze/types";

export const runtime = "nodejs"; // required for playwright/lighthouse

const queue = new PQueue({ concurrency: 1 }); // MVP: 1 analysis at a time

const QUOTA_EXCEEDED_MESSAGE =
  "This is a free non-commercial project paid for by the creator. The token balance has been exhausted — analysis with recommendations is temporarily unavailable. Try again later or use the Lighthouse report only.";

export async function POST(req: Request) {
  try {
    console.log("[api/analyze] called");

    const openaiKeyPresent = Boolean(process.env.OPENAI_API_KEY?.trim());
    console.log(`[api/analyze] OPENAI_API_KEY present: ${openaiKeyPresent}`);

    let body: unknown;
    try {
      body = await req.json();
    } catch (e) {
      console.error("[api/analyze] req.json() failed", e);
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" } satisfies AnalyzeError,
        { status: 400 }
      );
    }

    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      const err: AnalyzeError = {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
      return NextResponse.json(err, { status: 400 });
    }

    const inputUrl = parsed.data.url;

    const result = await queue.add(async () => {
      let page;
      try {
        console.log("[api/analyze] stage fetchPageSignals (desktop)");
        page = await fetchPageSignals(inputUrl);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        throw new Error(`stage:fetchPageSignals:${message}`);
      }

      // Run lighthouse and mobile fetch in parallel — both need the final URL
      let lh: Awaited<ReturnType<typeof runLighthouse>>;
      let mobilePage: Awaited<ReturnType<typeof fetchPageSignals>>;
      try {
        console.log("[api/analyze] stage runLighthouse + fetchPageSignals (mobile) in parallel");
        [lh, mobilePage] = await Promise.all([
          runLighthouse(page.finalUrl),
          fetchPageSignals(page.finalUrl, { mobile: true }).catch((e) => {
            // Mobile fetch failure is non-fatal — fall back to desktop signals
            console.warn("[api/analyze] mobile fetchPageSignals failed, using desktop signals", e);
            return { ...page, isMobile: true };
          }),
        ]);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        throw new Error(`stage:runLighthouse:${message}`);
      }

      let llm;
      try {
        console.log("[api/analyze] stage llmIssues");
        llm = await llmIssues({ page, mobilePage, lighthouseScores: lh.scores });
      } catch (e) {
        const status = (e as { status?: number })?.status;
        const message = e instanceof Error ? e.message : "";
        const isQuotaExceeded =
          status === 429 ||
          message.includes("429") ||
          message.toLowerCase().includes("quota");
        if (isQuotaExceeded) {
          throw Object.assign(new Error(QUOTA_EXCEEDED_MESSAGE), { status: 429 });
        }

        // Keep original message, but tag stage to speed up production debugging.
        if (e instanceof Error) {
          throw new Error(`stage:llmIssues:${e.message}`);
        }
        throw new Error(`stage:llmIssues:Unknown error`);
      }

      const res: AnalyzeResponse = {
        ok: true,
        inputUrl,
        fetchedAt: new Date().toISOString(),
        page,
        lighthouse: {
          scores: lh.scores,
          summary: lh.summary,
        },
        issues: llm.issues ?? [],
        recommendations: llm.recommendations ?? { quickWins: [], nextSteps: [] },
      };

      return res;
    });

    return NextResponse.json(result);
  } catch (e) {
    const status = (e as { status?: number })?.status;
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[api/analyze] handler error", { status, message });
    const isQuotaExceeded =
      status === 429 ||
      message.includes("429") ||
      message.toLowerCase().includes("quota");

    if (isQuotaExceeded) {
      return NextResponse.json(
        { ok: false, error: QUOTA_EXCEEDED_MESSAGE },
        { status: 429 }
      );
    }

    const err: AnalyzeError = {
      ok: false,
      error: message,
    };
    return NextResponse.json(err, { status: 500 });
  }
}
