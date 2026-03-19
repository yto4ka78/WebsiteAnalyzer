import type { Review } from "./types";

// Domain-agnostic themes with keyword matchers
const THEME_KEYWORDS: Record<string, RegExp> = {
  "Service & Staff":      /\b(service|staff|employee|team|worker|representative|agent|helpful|rude|friendly|professional|unprofessional|attitude|polite|impolite|courteous|disrespectful)\b/i,
  "Wait Time & Speed":    /\b(wait|slow|fast|quick|speed|long|delay|hour|minute|prompt|immediately|efficient|inefficient|timely|on.?time)\b/i,
  "Price & Value":        /\b(price|expensive|cheap|affordable|worth|value|cost|overpriced|reasonable|fair|fee|charge|rip.?off|budget)\b/i,
  "Product & Food Quality": /\b(quality|fresh|delicious|stale|tasteless|good|bad|great|terrible|excellent|awful|amazing|poor|fantastic|disappointing|superb)\b/i,
  "Cleanliness & Hygiene":/\b(clean|dirty|messy|hygiene|sanit|spotless|filthy|tidy|dusty|smell|odor)\b/i,
  "Communication":        /\b(communicat|response|reply|contact|call|email|answer|listen|explain|inform|notify|update)\b/i,
  "Location & Parking":   /\b(location|parking|park|access|find|directions|convenient|close|far|nearby|navigate|entrance)\b/i,
  "Problem Resolution":   /\b(resolve|fix|issue|problem|complaint|solution|refund|compensat|mistake|error|wrong|broken|damage|repair)\b/i,
  "Booking & Process":    /\b(book|appointment|schedul|process|easy|difficult|online|app|website|form|checkout|registration)\b/i,
  "Atmosphere & Ambiance":/\b(atmosphere|ambiance|ambience|cozy|noisy|quiet|comfortable|vibe|decor|environment|music|lighting)\b/i,
};

export type ThemeCount = {
  theme: string;
  count: number;
};

export function computeThemes(reviews: Review[]): ThemeCount[] {
  const counts: Record<string, number> = {};

  for (const review of reviews) {
    const combined = `${review.text}`.toLowerCase();
    for (const [theme, regex] of Object.entries(THEME_KEYWORDS)) {
      if (regex.test(combined)) {
        counts[theme] = (counts[theme] ?? 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([theme, count]) => ({ theme, count }));
}

export function computeAverageRating(reviews: Review[]): number | "unknown" {
  const rated = reviews.filter((r) => r.rating > 0);
  if (rated.length === 0) return "unknown";
  const sum = rated.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

export function computeOwnerReplyCount(reviews: Review[]): number {
  return reviews.filter((r) => r.owner_replied === true).length;
}
