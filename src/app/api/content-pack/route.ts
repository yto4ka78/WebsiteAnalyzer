import { NextResponse } from "next/server";
import { z } from "zod";
import PQueue from "p-queue";
import { generateContentPack } from "@/lib/content-pack/llm";
import type { ContentPackError, ContentPackResponse } from "@/lib/content-pack/types";

export const runtime = "nodejs";

const schema = z.object({
  business_name: z.string().min(1, "Business name is required").max(120),
  niche: z.string().min(1, "Niche/category is required").max(120),
  city: z.string().min(1, "City is required").max(100),
  country: z.string().min(1).max(100).default("France"),
  services: z
    .array(z.string().min(1).max(200))
    .min(1, "At least one service is required")
    .max(20),
  tone: z.enum(["professionnel", "simple", "premium", "convivial"]),
  language: z.enum(["fr", "en"]).default("fr"),
  has_delivery: z.boolean().default(false),
  service_area: z.string().max(200).optional(),
});

// Reuse same single-concurrency queue
const queue = new PQueue({ concurrency: 1 });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      const err: ContentPackError = {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
      return NextResponse.json(err, { status: 400 });
    }

    const input = parsed.data;

    const result = await queue.add(async () => {
      const report = await generateContentPack(input);

      const res: ContentPackResponse = {
        ok: true,
        input,
        generatedAt: new Date().toISOString(),
        report,
      };
      return res;
    });

    return NextResponse.json(result);
  } catch (e) {
    const err: ContentPackError = {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
    return NextResponse.json(err, { status: 500 });
  }
}
