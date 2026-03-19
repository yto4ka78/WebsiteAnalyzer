"use client";

import { useCallback, useEffect, useState } from "react";
import type { MapsAnalyzeResponse } from "@/lib/maps-analyze/types";

export type MapsHistoryEntry = {
  id: string;        // unique — timestamp ms as string
  url: string;       // input Google Maps URL
  name: string;      // business name from snapshot
  fetchedAt: string; // ISO string
  data: MapsAnalyzeResponse;
};

function isMapsAnalyzeResponse(x: unknown): x is MapsAnalyzeResponse {
  return (
    typeof x === "object" &&
    x !== null &&
    "ok" in x &&
    (x as { ok?: boolean }).ok === true &&
    "inputUrl" in x &&
    typeof (x as { inputUrl?: unknown }).inputUrl === "string" &&
    "fetchedAt" in x &&
    typeof (x as { fetchedAt?: unknown }).fetchedAt === "string" &&
    "report" in x &&
    typeof (x as { report?: unknown }).report === "object" &&
    (x as { report?: { business_snapshot?: { name?: unknown } } }).report?.business_snapshot != null &&
    typeof (x as { report: { business_snapshot: { name?: unknown } } }).report.business_snapshot.name === "string"
  );
}

const LS_KEY = "maps_history_v1";
const MAX_ENTRIES = 20;

function load(): MapsHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MapsHistoryEntry[];
  } catch {
    return [];
  }
}

function save(entries: MapsHistoryEntry[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  } catch {
    // Storage full — keep the newest half and retry
    try {
      const trimmed = entries.slice(0, Math.floor(MAX_ENTRIES / 2));
      localStorage.setItem(LS_KEY, JSON.stringify(trimmed));
    } catch { /* give up */ }
  }
}

export function useMapsAnalysisHistory() {
  const [history, setHistory] = useState<MapsHistoryEntry[]>([]);

  // Hydrate from localStorage on first client render
  useEffect(() => {
    setHistory(load());
  }, []);

  const addEntry = useCallback((data: unknown) => {
    if (!isMapsAnalyzeResponse(data)) return;
    setHistory((prev) => {
      // Replace existing entry for the same URL so there are no duplicates
      const filtered = prev.filter((e) => e.url !== data.inputUrl);
      const entry: MapsHistoryEntry = {
        id: String(Date.now()),
        url: data.inputUrl,
        name: data.report.business_snapshot.name,
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
