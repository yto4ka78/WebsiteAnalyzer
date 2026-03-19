"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalyzeResponse } from "@/lib/analyze/types";

export type HistoryEntry = {
  id: string;          // unique id — timestamp ms as string
  url: string;         // canonical input URL
  fetchedAt: string;   // ISO string
  data: AnalyzeResponse;
};

function isAnalyzeResponse(x: unknown): x is AnalyzeResponse {
  return (
    typeof x === "object" &&
    x !== null &&
    "ok" in x &&
    (x as { ok?: boolean }).ok === true &&
    "inputUrl" in x &&
    typeof (x as { inputUrl?: unknown }).inputUrl === "string"
  );
}

const LS_KEY = "wa_history_v1";
const MAX_ENTRIES = 20;

function load(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full — trim oldest and retry
    try {
      const trimmed = entries.slice(0, Math.floor(MAX_ENTRIES / 2));
      localStorage.setItem(LS_KEY, JSON.stringify(trimmed));
    } catch { /* give up */ }
  }
}

export function useAnalysisHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load on mount (client-only)
  useEffect(() => {
    setHistory(load());
  }, []);

  const addEntry = useCallback((data: unknown) => {
    if (!isAnalyzeResponse(data)) return;
    setHistory((prev) => {
      // Replace existing entry for the same URL, or prepend new one
      const filtered = prev.filter((e) => e.url !== data.inputUrl);
      const entry: HistoryEntry = {
        id: String(Date.now()),
        url: data.inputUrl,
        fetchedAt: data.fetchedAt,
        data,
      };
      const next = [entry, ...filtered].slice(0, MAX_ENTRIES);
      save(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      save(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  }, []);

  return { history, addEntry, removeEntry, clearHistory };
}
