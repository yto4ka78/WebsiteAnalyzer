export type LighthouseScores = {
  performance: number; // 0..100
  accessibility: number;
  bestPractices: number;
  seo: number;
};

export type PageSignals = {
  url: string;
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  h1: string[];
  h2: string[];
  canonical: string | null;
  robotsMeta: string | null;
  hasViewportMeta: boolean;
  images: { src: string; alt: string | null }[];
  links: { href: string; text: string }[];
  /** true when signals were collected with a mobile UA + 412×823 viewport */
  isMobile?: boolean;
  /** number of links/buttons whose bounding box is smaller than 48×48 px */
  smallTapTargets?: number;
};

export type Issue = {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  evidence?: string;
  fix?: string;
  impact?: string; // business impact
};

export type AnalyzeResponse = {
  ok: true;
  inputUrl: string;
  fetchedAt: string;
  page: PageSignals;
  lighthouse: {
    scores: LighthouseScores;
    summary: string[]; // short bullets from LH
  };
  issues: Issue[];
  recommendations: { quickWins: string[]; nextSteps: string[] };
};

export type AnalyzeError = { ok: false; error: string };
