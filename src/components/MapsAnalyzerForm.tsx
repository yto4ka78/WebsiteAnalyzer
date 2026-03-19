"use client";

import { useState } from "react";

interface Props {
  onResult: (data: unknown) => void;
  onError: (msg: string) => void;
  isLoading: boolean;
  setLoading: (v: boolean) => void;
}

export default function MapsAnalyzerForm({ onResult, onError, isLoading, setLoading }: Props) {
  const [url, setUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    onError("");
    onResult(null);

    try {
      const res = await fetch("/api/maps-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        onError(data.error ?? "Something went wrong");
      } else {
        onResult(data);
      }
    } catch {
      onError("Network error — check the server is running");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.google.com/maps/place/..."
          required
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 text-base"
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Analyzing…
            </span>
          ) : (
            "Analyze"
          )}
        </button>
      </div>
      <p className="text-xs text-neutral-500 mt-2 ml-1">
        Paste a Google Maps business URL — we scrape reviews and generate a full reputation report
      </p>
    </form>
  );
}
