"use client";

import { useState } from "react";
import AnalyzerForm from "@/components/AnalyzerForm";
import ReportView from "@/components/ReportView";
import HistoryPanel from "@/components/HistoryPanel";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import type { AnalyzeResponse } from "@/lib/analyze/types";

export default function HomePage() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { history, addEntry, removeEntry, clearHistory } = useAnalysisHistory();

  function handleResult(data: AnalyzeResponse) {
    setResult(data);
    addEntry(data);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 pt-10 pb-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3 no-print">
          <h1 className="text-4xl font-bold tracking-tight">
            Website Analyzer
          </h1>
          <p className="text-neutral-400 text-base">
            Lighthouse + AI-powered SEO &amp; performance audit in seconds
          </p>
        </div>

        {/* History panel — above form */}
        <div className="no-print">
          <HistoryPanel
            history={history}
            onSelect={(data) => { setResult(data); setError(""); }}
            onRemove={removeEntry}
            onClear={clearHistory}
          />
        </div>

        {/* Form */}
        <div className="no-print">
          <AnalyzerForm
            onResult={(d) => handleResult(d as AnalyzeResponse)}
            onError={setError}
            isLoading={loading}
            setLoading={setLoading}
          />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center space-y-3 py-8 no-print">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-neutral-900 border border-neutral-800">
              <svg className="animate-spin w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-neutral-300 text-sm">Running Lighthouse + AI analysis...</span>
            </div>
            <p className="text-xs text-neutral-600">This typically takes 30-60 seconds</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="max-w-2xl mx-auto rounded-xl border border-red-800 bg-red-950/40 p-4 text-red-300 text-sm no-print">
            <span className="font-semibold">Error: </span>{error}
          </div>
        )}

        {/* Results */}
        {result && !loading && <ReportView data={result} />}
      </div>
    </main>
  );
}
