"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContentPackResponse } from "@/lib/content-pack/types";

export type ContentPackHistoryEntry = {
  id: string;
  business_name: string;
  niche: string;
  city: string;
  generated_at: string;
  content_pack_score: number;
  full_report_json: ContentPackResponse;
};

function isContentPackResponse(x: unknown): x is ContentPackResponse {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  if (o.ok !== true) return false;
  const input = o.input;
  if (typeof input !== "object" || input === null) return false;
  const i = input as Record<string, unknown>;
  if (typeof i.business_name !== "string" || typeof i.niche !== "string" || typeof i.city !== "string")
    return false;
  if (typeof o.generatedAt !== "string") return false;
  const report = o.report;
  if (typeof report !== "object" || report === null) return false;
  const r = report as Record<string, unknown>;
  return typeof r.content_pack_score === "number";
}

const LS_KEY = "content_pack_previous_reports";
const MAX_ENTRIES = 20;

function load(): ContentPackHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ContentPackHistoryEntry[];
  } catch {
    return [];
  }
}

function persist(entries: ContentPackHistoryEntry[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  } catch {
    try {
      const trimmed = entries.slice(0, Math.floor(MAX_ENTRIES / 2));
      localStorage.setItem(LS_KEY, JSON.stringify(trimmed));
    } catch { /* give up */ }
  }
}

export function useContentPackHistory() {
  const [history, setHistory] = useState<ContentPackHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(load());
  }, []);

  const addEntry = useCallback((data: unknown) => {
    if (!isContentPackResponse(data)) return;
    setHistory((prev) => {
      // Deduplicate by business_name + city (same business = replace)
      const key = `${data.input.business_name}__${data.input.city}`.toLowerCase();
      const filtered = prev.filter(
        (e) =>
          `${e.business_name}__${e.city}`.toLowerCase() !== key
      );
      const entry: ContentPackHistoryEntry = {
        id: String(Date.now()),
        business_name: data.input.business_name,
        niche: data.input.niche,
        city: data.input.city,
        generated_at: data.generatedAt,
        content_pack_score: data.report.content_pack_score,
        full_report_json: data,
      };
      const next = [entry, ...filtered].slice(0, MAX_ENTRIES);
      persist(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  }, []);

  return { history, addEntry, removeEntry, clearHistory };
}
