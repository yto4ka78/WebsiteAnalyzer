"use client";

import type { AnalyzeResponse, Issue, LighthouseScores } from "@/lib/analyze/types";

const SEVERITY_COLOR: Record<Issue["severity"], string> = {
  high: "bg-red-900/50 border-red-700 text-red-300",
  medium: "bg-yellow-900/40 border-yellow-700 text-yellow-300",
  low: "bg-neutral-800 border-neutral-700 text-neutral-300",
};

const SEVERITY_BADGE: Record<Issue["severity"], string> = {
  high: "bg-red-600 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-neutral-600 text-white",
};

function scoreColor(score: number) {
  if (score >= 90) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function ScoreRing({ label, score }: { label: string; score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 90 ? "#4ade80" : score >= 50 ? "#facc15" : "#f87171";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-18 h-18">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#374151" strokeWidth="6" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-bold text-lg ${scoreColor(score)}`}>
          {score}
        </span>
      </div>
      <span className="text-xs text-neutral-400 text-center leading-tight">{label}</span>
    </div>
  );
}

function LighthousePanel({ scores }: { scores: LighthouseScores }) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">
        Lighthouse Scores
      </h2>
      <div className="flex flex-wrap gap-6 justify-around">
        <ScoreRing label="Performance" score={scores.performance} />
        <ScoreRing label="SEO" score={scores.seo} />
        <ScoreRing label="Accessibility" score={scores.accessibility} />
        <ScoreRing label="Best Practices" score={scores.bestPractices} />
      </div>
    </section>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <div className={`rounded-xl border p-4 ${SEVERITY_COLOR[issue.severity]}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-semibold text-sm leading-snug">{issue.title}</p>
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full uppercase ${SEVERITY_BADGE[issue.severity]}`}>
          {issue.severity}
        </span>
      </div>
      {issue.evidence && (
        <p className="text-xs text-neutral-400 mb-1">
          <span className="font-semibold text-neutral-300">Evidence: </span>
          {issue.evidence}
        </p>
      )}
      {issue.fix && (
        <p className="text-xs text-neutral-400 mb-1">
          <span className="font-semibold text-neutral-300">Fix: </span>
          {issue.fix}
        </p>
      )}
      {issue.impact && (
        <p className="text-xs text-neutral-400">
          <span className="font-semibold text-neutral-300">Impact: </span>
          {issue.impact}
        </p>
      )}
    </div>
  );
}

function PageMetaPanel({ page }: { page: AnalyzeResponse["page"] }) {
  const rows: [string, React.ReactNode][] = [
    ["Final URL", <a key="url" href={page.finalUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline break-all">{page.finalUrl}</a>],
    ["Title", page.title ?? <span key="title" className="text-red-400 italic">Missing</span>],
    ["Meta Description", page.metaDescription ?? <span key="meta" className="text-red-400 italic">Missing</span>],
    ["H1 count", <span key="h1" className={page.h1.length === 1 ? "text-green-400" : "text-yellow-400"}>{page.h1.length}</span>],
    ["Canonical", page.canonical ?? <span key="canon" className="text-yellow-400 italic">Not set</span>],
    ["Robots meta", page.robotsMeta ?? <span key="robots" className="text-neutral-400 italic">Not set</span>],
    ["Viewport meta", page.hasViewportMeta ? <span key="vp-ok" className="text-green-400">Present</span> : <span key="vp-no" className="text-red-400">Missing</span>],
    ["Images (sampled)", `${page.images.length} total - ${page.images.filter(i => !i.alt).length} missing alt`],
  ];

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">
        Page Signals
      </h2>
      <dl className="grid grid-cols-1 gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-3 text-sm border-b border-neutral-800 pb-2 last:border-0 last:pb-0">
            <dt className="shrink-0 w-36 text-neutral-500">{label}</dt>
            <dd className="text-neutral-200 min-w-0 break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function ReportView({ data }: { data: AnalyzeResponse }) {
  const highCount = data.issues.filter(i => i.severity === "high").length;
  const medCount = data.issues.filter(i => i.severity === "medium").length;

  function handlePrint() {
    window.print();
  }

  return (
    <div id="report-printable" className="w-full max-w-3xl mx-auto space-y-6">

      {/* ── Print-only brand header (hidden on screen, appears once on page 1 of PDF) ── */}
      <div className="print-only-brand items-center justify-between border-b border-neutral-700 pb-3 mb-1">
        <div className="flex items-center gap-2">
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#e5e7eb", letterSpacing: "-0.02em" }}>
            Analyzer Suite
          </span>
        </div>
        <span style={{ fontSize: 11, color: "#6b7280" }}>
          analyzer-suite.com
        </span>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Analyzed</p>
            <p className="font-mono text-sm text-indigo-300 break-all">{data.inputUrl}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right">
              <p className="text-xs text-neutral-500 mb-1">
                {new Date(data.fetchedAt).toLocaleString()}
              </p>
              <p className="text-xs text-neutral-400">
                <span className="text-red-400 font-bold">{highCount} high</span>
                {" - "}
                <span className="text-yellow-400 font-bold">{medCount} medium</span>
                {" - "}
                <span className="text-neutral-400">{data.issues.length - highCount - medCount} low</span>
              </p>
            </div>
            {/* PDF export button */}
            <button
              onClick={handlePrint}
              title="Save as PDF"
              className="no-print shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 hover:border-neutral-600 text-neutral-300 hover:text-white text-xs font-medium transition-all duration-150"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Lighthouse */}
      <LighthousePanel scores={data.lighthouse.scores} />

      {/* Page signals */}
      <PageMetaPanel page={data.page} />

      {/* Issues */}
      {data.issues.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-3">
            Issues ({data.issues.length})
          </h2>
          <div className="space-y-3">
            {["high", "medium", "low"].flatMap(sev =>
              data.issues
                .filter(i => i.severity === sev)
                .map(issue => <IssueCard key={issue.id} issue={issue} />)
            )}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {(data.recommendations.quickWins.length > 0 || data.recommendations.nextSteps.length > 0) && (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">
            Recommendations
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {data.recommendations.quickWins.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-400 mb-2">Quick Wins</h3>
                <ul className="space-y-2">
                  {data.recommendations.quickWins.map((w, i) => (
                    <li key={i} className="text-sm text-neutral-300 flex gap-2">
                      <span className="text-green-500 shrink-0">+</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.recommendations.nextSteps.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-indigo-400 mb-2">Next Steps</h3>
                <ul className="space-y-2">
                  {data.recommendations.nextSteps.map((s, i) => (
                    <li key={i} className="text-sm text-neutral-300 flex gap-2">
                      <span className="text-indigo-400 shrink-0">-&gt;</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
