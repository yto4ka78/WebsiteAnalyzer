import OpenAI from "openai";
import type { ContentPackInput, ContentPackReport } from "./types";

const apiKey = process.env.OPENAI_API_KEY?.trim();
// Important: don't create OpenAI client at module-evaluation time.
// Next build may import this module without having secrets configured yet.
const client = apiKey ? new OpenAI({ apiKey }) : null;

const SYSTEM_PROMPT = `You are an expert local SEO content strategist.
Generate a complete content pack for a local business website.

CRITICAL RULES:
- Return ONLY valid JSON — no markdown, no text outside JSON.
- Generate ALL user-facing copy in the specified language (fr or en).
- Weave the city naturally into SEO titles and copy for local search intent.
- No keyword stuffing. Max 2 keyword insertions per block.
- content_pack_score 0–100: deduct for missing inputs, generic copy, thin FAQ, no local intent.
- schema_jsonld: valid Schema.org JSON-LD, pick the most specific @type for the business.
- FAQ: 6–8 realistic customer questions with short, direct answers.
- CTA: 4–5 variants with distinct angles (urgency / trust / value / local).
- keyword_clusters: 3–5 clusters, 5–8 keywords each.
- website_structure: 5–7 sections covering a typical local business site.
- Keep copy short and actionable — avoid filler phrases.

Return exactly this JSON shape (no extra keys):
{
  "content_pack_score": number,
  "website_structure": [{"section":string,"goal":string,"content_notes":[string]}],
  "seo": {
    "title_variants": [string],
    "meta_description_variants": [string],
    "h1": [string],
    "h2": [string]
  },
  "keyword_clusters": [{"cluster":string,"keywords":[string]}],
  "faq": [{"q":string,"a":string}],
  "cta_variants": [{"label":string,"copy":string}],
  "schema_jsonld": object,
  "copy_blocks": {
    "hero_headline": string,
    "hero_subheadline": string,
    "about_paragraph": string,
    "services_snippets": [{"service":string,"snippet":string}]
  }
}`;

export async function generateContentPack(
  input: ContentPackInput
): Promise<ContentPackReport> {
  if (!client) {
    throw new Error(
      "OPENAI_API_KEY is not set on the server. Add it to Fly secrets (see .env.example)."
    );
  }

  const deliveryLine = input.has_delivery
    ? `- Delivery available: yes`
    : `- Delivery available: no`;

  const serviceAreaLine = input.service_area
    ? `- Service area: ${input.service_area}`
    : "";

  const userMessage = `Business details:
- Name: ${input.business_name}
- Niche/category: ${input.niche}
- City: ${input.city}
- Country: ${input.country}
- Services: ${input.services.join(", ")}
- Tone: ${input.tone}
- Language for copy: ${input.language}
${deliveryLine}
${serviceAreaLine}

Generate the full content pack JSON.`;

  const resp = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.25,
    max_tokens: 4000,
  });

  const raw = resp.choices[0]?.message?.content ?? "";
  const cleaned = raw
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as ContentPackReport;
  } catch {
    // Fallback so the API always returns something renderable
    return {
      content_pack_score: 0,
      website_structure: [],
      seo: { title_variants: [], meta_description_variants: [], h1: [], h2: [] },
      keyword_clusters: [],
      faq: [],
      cta_variants: [],
      schema_jsonld: {},
      copy_blocks: {
        hero_headline: "",
        hero_subheadline: "",
        about_paragraph: "",
        services_snippets: [],
      },
    };
  }
}
