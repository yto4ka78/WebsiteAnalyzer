"use client";

import { useState } from "react";
import type { MapsHistoryEntry } from "@/hooks/useMapsAnalysisHistory";
import type { MapsAnalyzeResponse } from "@/lib/maps-analyze/types";

interface Props {
  history: MapsHistoryEntry[];
  onSelect: (data: MapsAnalyzeResponse) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

// Risk score pill — mirrors the gauge colours in MapsReportView
function RiskPill({ score }: { score: number }) {
  const color =
    score <= 30
      ? "bg-green-900/60 text-green-300 border-green-700/50"
      : score <= 60
      ? "bg-yellow-900/50 text-yellow-300 border-yellow-700/50"
      : "bg-red-900/50 text-red-300 border-red-700/50";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color} shrink-0`} title="Risk score">
      {score}
    </span>
  );
}

// Star rating badge
function RatingBadge({ rating }: { rating: number | "unknown" }) {
  if (rating === "unknown") return null;
  const color =
    rating >= 4.3
      ? "bg-green-900/60 text-green-300 border-green-700/50"
      : rating >= 3.5
      ? "bg-yellow-900/50 text-yellow-300 border-yellow-700/50"
      : "bg-red-900/50 text-red-300 border-red-700/50";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color} flex items-center gap-0.5 shrink-0`} title="Rating">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      {typeof rating === "number" ? rating.toFixed(1) : rating}
    </span>
  );
}

export default function MapsHistoryPanel({ history, onSelect, onRemove, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Toggle button */}
      <button
        onClick={() => { setOpen((v) => !v); setConfirmClear(false); }}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800/70 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <span className="text-sm font-medium text-neutral-300">
            Previous analyses
          </span>
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/25">
            {history.length}
          </span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-neutral-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      <div className={[
        "overflow-hidden transition-all duration-250 ease-in-out",
        open ? "max-h-[600px] opacity-100 mt-1" : "max-h-0 opacity-0",
      ].join(" ")}>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 backdrop-blur divide-y divide-neutral-800">

          {/* Header row */}
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[11px] text-neutral-500 uppercase tracking-widest font-semibold">
              Saved reports
            </span>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Clear all?</span>
                <button
                  onClick={() => { onClear(); setConfirmClear(false); setOpen(false); }}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
                >
                  Yes, clear
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-[11px] text-neutral-600 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Entry list */}
          <ul className="max-h-80 overflow-y-auto divide-y divide-neutral-800/60">
            {history.map((entry) => {
              const snap = entry.data.report.business_snapshot;
              const risk = entry.data.report.reputation_risk_score;
              const highIssues = entry.data.report.priority_issues.filter(i => i.severity === "high").length;
              const date = new Date(entry.fetchedAt);
              const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
              const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

              return (
                <li key={entry.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-neutral-800/40 transition-colors">
                  <button
                    onClick={() => { onSelect(entry.data); setOpen(false); }}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    {/* Maps pin icon */}
                    <div className="shrink-0 w-5 h-5 flex items-center justify-center text-emerald-600">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>

                    {/* Name + date */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-neutral-200 truncate font-medium">
                        {entry.name !== "unknown" ? entry.name : entry.url}
                      </p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        {dateStr} at {timeStr}
                        {highIssues > 0 && (
                          <span className="ml-2 text-red-400 font-semibold">
                            · {highIssues} high {highIssues === 1 ? "issue" : "issues"}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Risk + rating pills */}
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      <RatingBadge rating={snap.rating} />
                      <RiskPill score={risk} />
                    </div>
                  </button>

                  {/* Remove */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
                    title="Remove from history"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-900/30 text-neutral-600 hover:text-red-400"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
