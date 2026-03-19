"use client";

import { useState } from "react";
import type { HistoryEntry } from "@/hooks/useAnalysisHistory";
import type { AnalyzeResponse } from "@/lib/analyze/types";

interface Props {
  history: HistoryEntry[];
  onSelect: (data: AnalyzeResponse) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 90
      ? "bg-green-900/60 text-green-300 border-green-700/50"
      : score >= 50
      ? "bg-yellow-900/50 text-yellow-300 border-yellow-700/50"
      : "bg-red-900/50 text-red-300 border-red-700/50";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color}`}>
      {score}
    </span>
  );
}

export default function HistoryPanel({ history, onSelect, onRemove, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Toggle button */}
      <button
        onClick={() => { setOpen((v) => !v); setConfirmClear(false); }}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800/70 transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <span className="text-sm font-medium text-neutral-300">
            Previous analyses
          </span>
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/25">
            {history.length}
          </span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-neutral-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      <div
        className={[
          "overflow-hidden transition-all duration-250 ease-in-out",
          open ? "max-h-[600px] opacity-100 mt-1" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 backdrop-blur divide-y divide-neutral-800">
          {/* Header row */}
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[11px] text-neutral-500 uppercase tracking-widest font-semibold">
              Saved results
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
              const s = entry.data.lighthouse.scores;
              const highIssues = entry.data.issues.filter(i => i.severity === "high").length;
              const date = new Date(entry.fetchedAt);
              const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
              const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

              return (
                <li key={entry.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-neutral-800/40 transition-colors">
                  {/* Click area — select entry */}
                  <button
                    onClick={() => { onSelect(entry.data); setOpen(false); }}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    {/* Favicon */}
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(entry.url)}&sz=32`}
                      alt=""
                      width={16}
                      height={16}
                      className="shrink-0 rounded-sm opacity-80"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />

                    {/* URL + date */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-neutral-200 truncate font-medium">
                        {entry.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
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

                    {/* Score pills */}
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      <ScorePill score={s.performance} />
                      <ScorePill score={s.seo} />
                      <ScorePill score={s.accessibility} />
                    </div>
                  </button>

                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
                    title="Remove from history"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-900/30 text-neutral-600 hover:text-red-400"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
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
