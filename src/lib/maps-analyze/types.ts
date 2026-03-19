// ── Raw data fetched from Google Maps ─────────────────────────────
export type Review = {
  date: string;
  rating: number;
  text: string;
  owner_replied: boolean | "unknown";
};

export type MapsBusinessData = {
  name: string;
  category: string;
  rating: number | "unknown";
  review_count: number | "unknown";
  maps_url: string;
  reviews: Review[];
};

// ── LLM report structure (mirrors the system prompt JSON schema) ──
export type BusinessSnapshot = {
  name: string;
  category: string;
  rating: number | "unknown";
  review_count_total: number | "unknown";
  reviews_analyzed: number;
  average_rating_from_sample: number | "unknown";
  owner_reply_rate_estimate: "high" | "medium" | "low" | "unknown";
};

export type SentimentTheme = {
  theme: string;
  mentions: number | "unknown";
  percentage_estimate: number | "unknown";
  example_quotes: string[];
};

export type SentimentAnalysis = {
  overall_sentiment: "positive" | "mixed" | "negative" | "unknown";
  positive_themes: SentimentTheme[];
  negative_themes: SentimentTheme[];
};

export type PriorityIssue = {
  title: string;
  severity: "high" | "medium" | "low";
  evidence: string;
  business_impact: string;
  recommended_action: string;
};

export type Opportunity = {
  title: string;
  why_it_matters: string;
  action_plan: string[];
};

export type ReplyTemplates = {
  negative_review_response: string;
  positive_review_response: string;
};

export type MapsLLMReport = {
  business_snapshot: BusinessSnapshot;
  sentiment_analysis: SentimentAnalysis;
  priority_issues: PriorityIssue[];
  opportunities: Opportunity[];
  reputation_risk_score: number;
  reply_templates: ReplyTemplates;
  strategic_recommendations_30_days: string[];
  summary_for_owner: string;
};

// ── API response types ─────────────────────────────────────────────
export type MapsAnalyzeResponse = {
  ok: true;
  inputUrl: string;
  fetchedAt: string;
  business: MapsBusinessData;
  report: MapsLLMReport;
};

export type MapsAnalyzeError = { ok: false; error: string };
