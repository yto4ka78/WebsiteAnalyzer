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
    const body = await req.json();
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
      const page = await fetchPageSignals(inputUrl);
      const lh = await runLighthouse(page.finalUrl);
      let llm;
      try {
        llm = await llmIssues({ page, lighthouseScores: lh.scores });
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
        throw e;
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
