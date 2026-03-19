import { NextResponse } from "next/server";
import { z } from "zod";
import PQueue from "p-queue";
import { fetchMapsData } from "@/lib/maps-analyze/mapsFetch";
import { computeThemes } from "@/lib/maps-analyze/themes";
import { mapsLlmReport } from "@/lib/maps-analyze/llm";
import type { MapsAnalyzeError, MapsAnalyzeResponse } from "@/lib/maps-analyze/types";

export const runtime = "nodejs";

// Accept Google Maps URLs: google.com/maps, google.fr/maps, goo.gl, maps.app.goo.gl, maps.google.*
function isGoogleMapsUrl(u: string): boolean {
  try {
    const p = new URL(u);
    if (p.protocol !== "http:" && p.protocol !== "https:") return false;
    const h = p.hostname.toLowerCase();
    return (
      h.includes("google.com") ||
      h.endsWith("goo.gl") ||
      h.includes("maps.app.goo.gl") ||
      h.startsWith("maps.google.") ||
      /\.google\.(com|[a-z]{2,3}(\.[a-z]{2})?)$/.test(h) // google.com, google.fr, google.co.uk
    );
  } catch {
    return false;
  }
}

const mapsSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Please enter a valid URL")
    .refine(
      isGoogleMapsUrl,
      "Use a Google Maps link, e.g. https://www.google.com/maps/place/... or https://maps.app.goo.gl/..."
    ),
});

// Share the same concurrency queue as the website analyzer (1 browser at a time)
const queue = new PQueue({ concurrency: 1 });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = mapsSchema.safeParse(body);
    if (!parsed.success) {
      const err: MapsAnalyzeError = {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
      return NextResponse.json(err, { status: 400 });
    }

    const inputUrl = parsed.data.url;

    const result = await queue.add(async () => {
      // 1. Scrape Google Maps
      const business = await fetchMapsData(inputUrl);

      if (business.reviews.length === 0 && business.name === "unknown") {
        throw new Error(
          "Could not extract data from this Google Maps page. " +
            "Make sure the URL points directly to a business listing."
        );
      }

      // 2. Pre-compute themes
      const themes = computeThemes(business.reviews);

      // 3. LLM reputation report
      const report = await mapsLlmReport(business, themes);

      const res: MapsAnalyzeResponse = {
        ok: true,
        inputUrl,
        fetchedAt: new Date().toISOString(),
        business,
        report,
      };

      return res;
    });

    return NextResponse.json(result);
  } catch (e) {
    const err: MapsAnalyzeError = {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
    return NextResponse.json(err, { status: 500 });
  }
}
