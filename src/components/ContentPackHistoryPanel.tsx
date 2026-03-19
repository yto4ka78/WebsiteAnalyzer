"use client";

import { useState } from "react";
import type { ContentPackHistoryEntry } from "@/hooks/useContentPackHistory";
import type { ContentPackResponse } from "@/lib/content-pack/types";

interface Props {
  history: ContentPackHistoryEntry[];
  onSelect: (data: ContentPackResponse) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-green-900/60 text-green-300 border-green-700/50"
      : score >= 55
      ? "bg-yellow-900/50 text-yellow-300 border-yellow-700/50"
      : "bg-red-900/50 text-red-300 border-red-700/50";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color}`} title="Pack score">
      {score}
    </span>
  );
}

export default function ContentPackHistoryPanel({ history, onSelect, onRemove, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <button
        onClick={() => { setOpen((v) => !v); setConfirmClear(false); }}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800/70 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <span className="text-sm font-medium text-neutral-300">Previous analyses</span>
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/25">
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

      <div className={[
        "overflow-hidden transition-all duration-250 ease-in-out",
        open ? "max-h-[600px] opacity-100 mt-1" : "max-h-0 opacity-0",
      ].join(" ")}>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 backdrop-blur divide-y divide-neutral-800">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[11px] text-neutral-500 uppercase tracking-widest font-semibold">Saved packs</span>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Clear all?</span>
                <button onClick={() => { onClear(); setConfirmClear(false); setOpen(false); }} className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">Yes, clear</button>
                <button onClick={() => setConfirmClear(false)} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="text-[11px] text-neutral-600 hover:text-red-400 transition-colors">Clear all</button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto divide-y divide-neutral-800/60">
            {history.map((entry) => {
              const date = new Date(entry.generated_at);
              const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
              const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

              return (
                <li key={entry.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-neutral-800/40 transition-colors">
                  <button
                    onClick={() => { onSelect(entry.full_report_json); setOpen(false); }}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    <div className="shrink-0 w-5 h-5 flex items-center justify-center text-violet-600">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-neutral-200 truncate font-medium">{entry.business_name}</p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        {entry.niche} · {entry.city} · {dateStr} at {timeStr}
                      </p>
                    </div>
                    <div className="hidden sm:block shrink-0">
                      <ScorePill score={entry.content_pack_score} />
                    </div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
                    title="Remove"
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
