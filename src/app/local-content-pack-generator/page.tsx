"use client";

import { useState } from "react";
import ContentPackForm from "@/components/ContentPackForm";
import ContentPackReportView from "@/components/ContentPackReportView";
import ContentPackHistoryPanel from "@/components/ContentPackHistoryPanel";
import { useContentPackHistory } from "@/hooks/useContentPackHistory";
import type { ContentPackResponse } from "@/lib/content-pack/types";

export default function LocalContentPackPage() {
  const [result, setResult] = useState<ContentPackResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { history, addEntry, removeEntry, clearHistory } = useContentPackHistory();

  function handleResult(data: ContentPackResponse) {
    setResult(data);
    addEntry(data);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 pt-10 pb-12">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Hero */}
        <div className="text-center space-y-3 no-print">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-800/60 bg-violet-950/40 text-violet-400 text-xs font-medium mb-2">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Local SEO
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Local Content Pack Generator
          </h1>
          <p className="text-neutral-400 text-base max-w-xl mx-auto">
            Generate a complete SEO content pack for your local business — website structure,
            keyword clusters, FAQ, CTAs, Schema markup, and ready-to-use copy blocks.
          </p>
        </div>

        {/* History panel — above form */}
        <div className="no-print">
          <ContentPackHistoryPanel
            history={history}
            onSelect={(data) => { setResult(data); setError(""); }}
            onRemove={removeEntry}
            onClear={clearHistory}
          />
        </div>

        {/* Form */}
        <div className="no-print">
          <ContentPackForm
            onResult={(d) => handleResult(d as ContentPackResponse)}
            onError={setError}
            isLoading={loading}
            setLoading={setLoading}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center space-y-3 py-8 no-print">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-neutral-900 border border-neutral-800">
              <svg className="animate-spin w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-neutral-300 text-sm">Generating content pack...</span>
            </div>
            <p className="text-xs text-neutral-600">
              AI is crafting your SEO content pack — typically 20–40 seconds
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="max-w-2xl mx-auto rounded-xl border border-red-800 bg-red-950/40 p-4 text-red-300 text-sm no-print">
            <span className="font-semibold">Error: </span>{error}
          </div>
        )}

        {/* Report */}
        {result && !loading && <ContentPackReportView data={result} />}

      </div>
    </main>
  );
}
