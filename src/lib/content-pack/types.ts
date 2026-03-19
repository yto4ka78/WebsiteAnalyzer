// ── Input ─────────────────────────────────────────────────────────
export type Tone = "professionnel" | "simple" | "premium" | "convivial";
export type Language = "fr" | "en";

export type ContentPackInput = {
  business_name: string;
  niche: string;
  city: string;
  country: string;
  services: string[];
  tone: Tone;
  language: Language;
  has_delivery: boolean;
  service_area?: string;
};

// ── Report blocks ──────────────────────────────────────────────────
export type WebsiteSection = {
  section: string;
  goal: string;
  content_notes: string[];
};

export type SeoBlock = {
  title_variants: string[];
  meta_description_variants: string[];
  h1: string[];
  h2: string[];
};

export type KeywordCluster = {
  cluster: string;
  keywords: string[];
};

export type FaqItem = {
  q: string;
  a: string;
};

export type CtaVariant = {
  label: string;
  copy: string;
};

export type ServiceSnippet = {
  service: string;
  snippet: string;
};

export type CopyBlocks = {
  hero_headline: string;
  hero_subheadline: string;
  about_paragraph: string;
  services_snippets: ServiceSnippet[];
};

export type ContentPackReport = {
  content_pack_score: number;
  website_structure: WebsiteSection[];
  seo: SeoBlock;
  keyword_clusters: KeywordCluster[];
  faq: FaqItem[];
  cta_variants: CtaVariant[];
  schema_jsonld: Record<string, unknown>;
  copy_blocks: CopyBlocks;
};

// ── API response ───────────────────────────────────────────────────
export type ContentPackResponse = {
  ok: true;
  input: ContentPackInput;
  generatedAt: string;
  report: ContentPackReport;
};

export type ContentPackError = { ok: false; error: string };
