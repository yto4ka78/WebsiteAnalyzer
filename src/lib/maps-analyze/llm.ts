import OpenAI from "openai";
import type { MapsBusinessData, MapsLLMReport } from "./types";
import type { ThemeCount } from "./themes";
import { computeAverageRating, computeOwnerReplyCount } from "./themes";

const apiKey = process.env.OPENAI_API_KEY?.trim();
// Important: don't create OpenAI client at module-evaluation time.
// Next build may import this module without secrets configured yet.
const client = apiKey ? new OpenAI({ apiKey }) : null;

const SYSTEM_PROMPT = `You are a senior local SEO and reputation management consultant.
Your task is to analyze Google Maps business data and produce a professional, actionable reputation report.
Important rules:
- Use ONLY the data provided.
- Do NOT invent facts.
- Do NOT speculate beyond the data.
- Be specific and actionable.
- Focus on business impact (calls, visits, conversions, rating improvement).
- If data is missing, use "unknown".
- Avoid generic advice.
- Return ONLY valid JSON (no markdown, no explanations outside JSON).
JSON structure:
{
  "business_snapshot": {
    "name": string,
    "category": string | "unknown",
    "rating": number | "unknown",
    "review_count_total": number | "unknown",
    "reviews_analyzed": number,
    "average_rating_from_sample": number | "unknown",
    "owner_reply_rate_estimate": "high" | "medium" | "low" | "unknown"
  },
  "sentiment_analysis": {
    "overall_sentiment": "positive" | "mixed" | "negative" | "unknown",
    "positive_themes": [
      {
        "theme": string,
        "mentions": number | "unknown",
        "percentage_estimate": number | "unknown",
        "example_quotes": [string]
      }
    ],
    "negative_themes": [
      {
        "theme": string,
        "mentions": number | "unknown",
        "percentage_estimate": number | "unknown",
        "example_quotes": [string]
      }
    ]
  },
  "priority_issues": [
    {
      "title": string,
      "severity": "high" | "medium" | "low",
      "evidence": string,
      "business_impact": string,
      "recommended_action": string
    }
  ],
  "opportunities": [
    {
      "title": string,
      "why_it_matters": string,
      "action_plan": [string]
    }
  ],
  "reputation_risk_score": number,
  "reply_templates": {
    "negative_review_response": string,
    "positive_review_response": string
  },
  "strategic_recommendations_30_days": [string],
  "summary_for_owner": string
}
Scoring logic for reputation_risk_score:
- Scale from 0 (no risk) to 100 (critical risk).
- Increase risk if: negative themes are frequent, low owner reply rate, rating below 4.0, recurring operational complaints.
- Decrease risk if: strong positive themes dominate, high engagement with reviews, rating above 4.3.
Theme percentage rule: percentage_estimate = round((theme_mentions / total_reviews_analyzed) * 100).
Use short quotes (max 12 words each).`;

export async function mapsLlmReport(
  business: MapsBusinessData,
  themes: ThemeCount[]
): Promise<MapsLLMReport> {
  if (!client) {
    throw new Error(
      "OPENAI_API_KEY is not set on the server. Add it to Fly secrets (see .env.example)."
    );
  }

  const avgRating = computeAverageRating(business.reviews);
  const ownerReplies = computeOwnerReplyCount(business.reviews);

  // Truncate reviews to 25, keep most informative (non-empty text)
  const topReviews = [...business.reviews]
    .filter((r) => r.text.trim().length > 0)
    .slice(0, 25);

  const userMessage = `Business info:
- name: ${business.name}
- category: ${business.category}
- rating: ${business.rating}
- total_review_count: ${business.review_count}
- google_maps_url: ${business.maps_url}

Review dataset summary:
- total_reviews_analyzed: ${business.reviews.length}
- calculated_average_rating: ${avgRating}
- owner_replies_detected: ${ownerReplies}

Precomputed theme counts:
${JSON.stringify(themes, null, 2)}

Representative reviews (max 25, newest first):
${JSON.stringify(topReviews, null, 2)}

Produce the JSON report.`;

  const resp = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.15,
    max_tokens: 3000,
  });

  const raw = resp.choices[0]?.message?.content ?? "";
  const cleaned = raw
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as MapsLLMReport;
  } catch {
    // Fallback report so UI always has something to render
    return {
      business_snapshot: {
        name: business.name,
        category: business.category,
        rating: business.rating,
        review_count_total: business.review_count,
        reviews_analyzed: business.reviews.length,
        average_rating_from_sample: avgRating,
        owner_reply_rate_estimate: "unknown",
      },
      sentiment_analysis: {
        overall_sentiment: "unknown",
        positive_themes: [],
        negative_themes: [],
      },
      priority_issues: [
        {
          title: "LLM parse error",
          severity: "low",
          evidence: raw.slice(0, 400),
          business_impact: "Report could not be parsed.",
          recommended_action: "Retry the analysis.",
        },
      ],
      opportunities: [],
      reputation_risk_score: 50,
      reply_templates: {
        negative_review_response: "",
        positive_review_response: "",
      },
      strategic_recommendations_30_days: [],
      summary_for_owner: "Report generation encountered an error. Please retry.",
    };
  }
}
