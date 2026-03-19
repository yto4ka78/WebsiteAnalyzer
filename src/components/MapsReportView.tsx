"use client";

import { useState } from "react";
import type { MapsAnalyzeResponse, PriorityIssue, SentimentTheme } from "@/lib/maps-analyze/types";

// ── Helpers ────────────────────────────────────────────────────────

const SEV_COLORS: Record<PriorityIssue["severity"], string> = {
  high:   "bg-red-900/50 border-red-700 text-red-300",
  medium: "bg-yellow-900/40 border-yellow-700 text-yellow-300",
  low:    "bg-neutral-800 border-neutral-700 text-neutral-300",
};
const SEV_BADGE: Record<PriorityIssue["severity"], string> = {
  high:   "bg-red-600 text-white",
  medium: "bg-yellow-500 text-black",
  low:    "bg-neutral-600 text-white",
};

function riskColor(score: number) {
  if (score <= 30) return { ring: "#4ade80", text: "text-green-400", label: "Low Risk" };
  if (score <= 60) return { ring: "#facc15", text: "text-yellow-400", label: "Medium Risk" };
  return { ring: "#f87171", text: "text-red-400", label: "High Risk" };
}

function RiskGauge({ score }: { score: number }) {
  const { ring, text, label } = riskColor(score);
  const r = 52;
  const circ = 2 * Math.PI * r;
  // Half-circle gauge: use 180deg arc (half circumference)
  const half = circ / 2;
  const filled = (score / 100) * half;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 130, height: 72 }}>
        <svg width="130" height="72" viewBox="0 0 130 72">
          {/* Background arc */}
          <path
            d="M 10 65 A 55 55 0 0 1 120 65"
            fill="none"
            stroke="#374151"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Filled arc — drawn as a proportion of the half-circle */}
          <path
            d="M 10 65 A 55 55 0 0 1 120 65"
            fill="none"
            stroke={ring}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 172} 172`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={`text-3xl font-black leading-none ${text}`}>{score}</span>
        </div>
      </div>
      <span className={`text-sm font-semibold ${text}`}>{label}</span>
      <span className="text-[11px] text-neutral-500">Reputation Risk Score</span>
    </div>
  );
}

function StarBar({ rating }: { rating: number | "unknown" }) {
  if (rating === "unknown") return <span className="text-neutral-500 text-sm">—</span>;
  const full = Math.floor(rating);
  const frac = rating - full;
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= full ? "#facc15" : i === full + 1 && frac >= 0.5 ? "#facc15" : "#374151"} opacity={i === full + 1 && frac > 0 && frac < 0.5 ? 0.4 : 1}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-white font-bold text-sm ml-1">{typeof rating === "number" ? rating.toFixed(1) : "—"}</span>
    </div>
  );
}

function ThemeRow({ theme, isPositive }: { theme: SentimentTheme; isPositive: boolean }) {
  const [open, setOpen] = useState(false);
  const pct = typeof theme.percentage_estimate === "number" ? theme.percentage_estimate : 0;
  const barColor = isPositive ? "bg-green-500" : "bg-red-500";
  const textColor = isPositive ? "text-green-300" : "text-red-300";
  return (
    <div className="space-y-1">
      <button onClick={() => setOpen(v => !v)} className="w-full text-left">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium ${textColor}`}>{theme.theme}</span>
          <div className="flex items-center gap-2 shrink-0">
            {typeof theme.mentions === "number" && (
              <span className="text-xs text-neutral-500">{theme.mentions} mentions</span>
            )}
            {pct > 0 && (
              <span className="text-xs font-bold text-neutral-400">{pct}%</span>
            )}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-neutral-600 transition-transform ${open ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
        {pct > 0 && (
          <div className="mt-1 h-1 rounded-full bg-neutral-800">
            <div className={`h-1 rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        )}
      </button>
      {open && theme.example_quotes.length > 0 && (
        <ul className="pl-2 space-y-1 mt-1">
          {theme.example_quotes.map((q, i) => (
            <li key={i} className="text-xs text-neutral-400 italic border-l-2 border-neutral-700 pl-2">
              &ldquo;{q}&rdquo;
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs px-2 py-1 rounded-md border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function MapsReportView({ data }: { data: MapsAnalyzeResponse }) {
  const { report, business } = data;
  const snap = report.business_snapshot;
  const sentiment = report.sentiment_analysis;
  const highIssues = report.priority_issues.filter(i => i.severity === "high").length;

  function handlePrint() { window.print(); }

  const sentimentColors = {
    positive: "text-green-400",
    mixed: "text-yellow-400",
    negative: "text-red-400",
    unknown: "text-neutral-400",
  };

  return (
    <div id="report-printable" className="w-full max-w-3xl mx-auto space-y-6">

      {/* Print-only brand */}
      <div className="print-only-brand items-center justify-between border-b border-neutral-700 pb-3 mb-1">
        <div className="flex items-center gap-2">
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#e5e7eb", letterSpacing: "-0.02em" }}>
            Google Maps Business Report
          </span>
        </div>
        <span style={{ fontSize: 11, color: "#6b7280" }}>{new Date(data.fetchedAt).toLocaleDateString()}</span>
      </div>

      {/* ── Header card ── */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-500 mb-1">Business</p>
            <p className="text-xl font-bold text-white truncate">{snap.name}</p>
            {snap.category !== "unknown" && (
              <p className="text-sm text-neutral-400 mt-0.5">{snap.category}</p>
            )}
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <StarBar rating={snap.rating} />
              {snap.review_count_total !== "unknown" && (
                <span className="text-xs text-neutral-500">
                  {typeof snap.review_count_total === "number" ? snap.review_count_total.toLocaleString() : snap.review_count_total} total reviews
                </span>
              )}
              <span className="text-xs text-neutral-500">
                {snap.reviews_analyzed} analyzed
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handlePrint}
              className="no-print flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Save PDF
            </button>
            {snap.owner_reply_rate_estimate !== "unknown" && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                snap.owner_reply_rate_estimate === "high"
                  ? "bg-green-900/40 border-green-700 text-green-300"
                  : snap.owner_reply_rate_estimate === "medium"
                  ? "bg-yellow-900/30 border-yellow-700 text-yellow-300"
                  : "bg-red-900/30 border-red-700 text-red-300"
              }`}>
                {snap.owner_reply_rate_estimate} reply rate
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Risk score + overall sentiment ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 flex items-center justify-center">
          <RiskGauge score={report.reputation_risk_score} />
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 flex flex-col justify-center gap-3">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
            Overall Sentiment
          </p>
          <p className={`text-2xl font-bold capitalize ${sentimentColors[sentiment.overall_sentiment]}`}>
            {sentiment.overall_sentiment}
          </p>
          <div className="space-y-1 text-xs text-neutral-500">
            <p>{highIssues} high-severity issue{highIssues !== 1 ? "s" : ""} found</p>
            <p>{report.opportunities.length} growth opportunities</p>
            <p>{report.strategic_recommendations_30_days.length} 30-day actions</p>
          </div>
        </div>
      </div>

      {/* ── Owner summary ── */}
      {report.summary_for_owner && (
        <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/30 p-5">
          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-2">
            Executive Summary
          </p>
          <p className="text-sm text-neutral-200 leading-relaxed">{report.summary_for_owner}</p>
        </div>
      )}

      {/* ── Sentiment themes ── */}
      {(sentiment.positive_themes.length > 0 || sentiment.negative_themes.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {sentiment.positive_themes.length > 0 && (
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <h2 className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-3">
                Positive Themes
              </h2>
              <div className="space-y-3">
                {sentiment.positive_themes.map((t) => (
                  <ThemeRow key={t.theme} theme={t} isPositive />
                ))}
              </div>
            </section>
          )}
          {sentiment.negative_themes.length > 0 && (
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <h2 className="text-xs font-semibold text-red-500 uppercase tracking-widest mb-3">
                Negative Themes
              </h2>
              <div className="space-y-3">
                {sentiment.negative_themes.map((t) => (
                  <ThemeRow key={t.theme} theme={t} isPositive={false} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Priority issues ── */}
      {report.priority_issues.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-3">
            Priority Issues ({report.priority_issues.length})
          </h2>
          <div className="space-y-3">
            {(["high", "medium", "low"] as const).flatMap(sev =>
              report.priority_issues
                .filter(i => i.severity === sev)
                .map(issue => (
                  <div key={issue.title} className={`rounded-xl border p-4 ${SEV_COLORS[issue.severity]}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-semibold text-sm">{issue.title}</p>
                      <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full uppercase ${SEV_BADGE[issue.severity]}`}>
                        {issue.severity}
                      </span>
                    </div>
                    {issue.evidence && (
                      <p className="text-xs text-neutral-400 mb-1">
                        <span className="font-semibold text-neutral-300">Evidence: </span>{issue.evidence}
                      </p>
                    )}
                    {issue.business_impact && (
                      <p className="text-xs text-neutral-400 mb-1">
                        <span className="font-semibold text-neutral-300">Impact: </span>{issue.business_impact}
                      </p>
                    )}
                    {issue.recommended_action && (
                      <p className="text-xs text-neutral-400">
                        <span className="font-semibold text-neutral-300">Action: </span>{issue.recommended_action}
                      </p>
                    )}
                  </div>
                ))
            )}
          </div>
        </section>
      )}

      {/* ── Opportunities ── */}
      {report.opportunities.length > 0 && (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">
            Growth Opportunities
          </h2>
          <div className="space-y-4">
            {report.opportunities.map((opp) => (
              <div key={opp.title} className="border-b border-neutral-800 pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-indigo-300 mb-1">{opp.title}</p>
                <p className="text-xs text-neutral-400 mb-2">{opp.why_it_matters}</p>
                <ul className="space-y-1">
                  {opp.action_plan.map((step, i) => (
                    <li key={i} className="text-xs text-neutral-300 flex gap-2">
                      <span className="text-indigo-500 shrink-0 font-bold">{i + 1}.</span>{step}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 30-day plan ── */}
      {report.strategic_recommendations_30_days.length > 0 && (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">
            30-Day Action Plan
          </h2>
          <ol className="space-y-2">
            {report.strategic_recommendations_30_days.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm text-neutral-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── Reply templates ── */}
      {(report.reply_templates.negative_review_response || report.reply_templates.positive_review_response) && (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">
            Reply Templates
          </h2>
          <div className="space-y-4">
            {report.reply_templates.negative_review_response && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Negative Review Response</p>
                  <CopyButton text={report.reply_templates.negative_review_response} />
                </div>
                <p className="text-sm text-neutral-300 bg-neutral-800/60 rounded-lg p-3 leading-relaxed whitespace-pre-wrap border border-neutral-700">
                  {report.reply_templates.negative_review_response}
                </p>
              </div>
            )}
            {report.reply_templates.positive_review_response && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-green-400 uppercase tracking-wide">Positive Review Response</p>
                  <CopyButton text={report.reply_templates.positive_review_response} />
                </div>
                <p className="text-sm text-neutral-300 bg-neutral-800/60 rounded-lg p-3 leading-relaxed whitespace-pre-wrap border border-neutral-700">
                  {report.reply_templates.positive_review_response}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Raw reviews count ── */}
      {business.reviews.length > 0 && (
        <p className="text-center text-xs text-neutral-700 pb-2">
          Analysis based on {business.reviews.length} scraped reviews
          {business.review_count !== "unknown"
            ? ` out of ${typeof business.review_count === "number" ? business.review_count.toLocaleString() : business.review_count} total`
            : ""}
        </p>
      )}
    </div>
  );
}
