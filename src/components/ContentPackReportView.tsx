"use client";

import { useState } from "react";
import type {
  ContentPackResponse,
  FaqItem,
  CtaVariant,
  KeywordCluster,
  WebsiteSection,
} from "@/lib/content-pack/types";

// ── Shared helpers ─────────────────────────────────────────────────

function CopyBtn({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors ${className}`}
    >
      {copied ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function SectionHeader({ title, icon, onCopy }: { title: string; icon: React.ReactNode; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-neutral-600">{icon}</span>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{title}</h3>
      </div>
      {onCopy && <button onClick={onCopy} className="text-[11px] text-neutral-600 hover:text-violet-400 transition-colors">Copy all</button>}
    </div>
  );
}

function StringList({ items, emptyLabel = "—" }: { items: string[]; emptyLabel?: string }) {
  if (!items?.length) return <p className="text-sm text-neutral-600 italic">{emptyLabel}</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 group">
          <p className="text-sm text-neutral-300 flex-1 leading-snug">{item}</p>
          <CopyBtn text={item} className="opacity-0 group-hover:opacity-100 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

// ── Score ring ─────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#4ade80" : score >= 55 ? "#facc15" : "#f87171";
  const textColor = score >= 80 ? "text-green-400" : score >= 55 ? "text-yellow-400" : "text-red-400";
  const label = score >= 80 ? "Excellent" : score >= 55 ? "Good" : "Needs work";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 48 48)" />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-black text-2xl ${textColor}`}>{score}</span>
      </div>
      <span className={`text-xs font-semibold ${textColor}`}>{label}</span>
      <span className="text-[11px] text-neutral-600">Pack Score</span>
    </div>
  );
}

// ── Tab definitions ────────────────────────────────────────────────
type TabId = "overview" | "seo" | "copy" | "keywords" | "faq" | "cta" | "schema";
const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "seo", label: "SEO" },
  { id: "copy", label: "Copy" },
  { id: "keywords", label: "Keywords" },
  { id: "faq", label: "FAQ" },
  { id: "cta", label: "CTA" },
  { id: "schema", label: "Schema" },
];

// ── Overview tab ───────────────────────────────────────────────────
function OverviewTab({ sections }: { sections: WebsiteSection[] }) {
  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-white">{s.section}</p>
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-violet-600/20 text-violet-400 border border-violet-500/25 font-medium">
              Section {i + 1}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mb-2 italic">{s.goal}</p>
          {s.content_notes?.length > 0 && (
            <ul className="space-y-1">
              {s.content_notes.map((note, j) => (
                <li key={j} className="text-xs text-neutral-500 flex gap-2">
                  <span className="text-violet-700 shrink-0">·</span>{note}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

// ── SEO tab ────────────────────────────────────────────────────────
function SeoTab({ seo }: { seo: ContentPackResponse["report"]["seo"] }) {
  const blocks: [string, string[]][] = [
    ["Title variants", seo.title_variants],
    ["Meta description variants", seo.meta_description_variants],
    ["H1 suggestions", seo.h1],
    ["H2 suggestions", seo.h2],
  ];
  return (
    <div className="space-y-5">
      {blocks.map(([label, items]) => (
        <div key={label}>
          <SectionHeader
            title={label}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>}
            onCopy={() => navigator.clipboard.writeText(items.join("\n")).catch(() => {})}
          />
          <StringList items={items} />
        </div>
      ))}
    </div>
  );
}

// ── Copy tab ───────────────────────────────────────────────────────
function CopyTab({ copy }: { copy: ContentPackResponse["report"]["copy_blocks"] }) {
  return (
    <div className="space-y-5">
      {[
        { label: "Hero Headline", text: copy.hero_headline },
        { label: "Hero Sub-headline", text: copy.hero_subheadline },
        { label: "About Paragraph", text: copy.about_paragraph },
      ].map(({ label, text }) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{label}</p>
            <CopyBtn text={text} />
          </div>
          <p className="text-sm text-neutral-300 bg-neutral-900/60 rounded-xl border border-neutral-800 p-4 leading-relaxed whitespace-pre-wrap">{text || "—"}</p>
        </div>
      ))}

      {copy.services_snippets?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Service Snippets</p>
          <div className="space-y-3">
            {copy.services_snippets.map((s, i) => (
              <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold text-violet-300">{s.service}</p>
                  <CopyBtn text={s.snippet} />
                </div>
                <p className="text-sm text-neutral-300 leading-snug">{s.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Keywords tab ───────────────────────────────────────────────────
function KeywordsTab({ clusters }: { clusters: KeywordCluster[] }) {
  return (
    <div className="space-y-4">
      {clusters.map((c, i) => (
        <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-violet-300">{c.cluster}</p>
            <CopyBtn text={c.keywords.join(", ")} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {c.keywords.map((kw, j) => (
              <span key={j} className="text-xs px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300">
                {kw}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── FAQ tab ────────────────────────────────────────────────────────
function FaqTab({ faq }: { faq: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {faq.map((item, i) => (
        <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-800/40 transition-colors"
          >
            <p className="text-sm font-medium text-neutral-200 leading-snug">{item.q}</p>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`shrink-0 mt-0.5 text-neutral-600 transition-transform ${openIdx === i ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {openIdx === i && (
            <div className="px-4 pb-3 border-t border-neutral-800">
              <div className="flex items-start justify-between gap-3 pt-3">
                <p className="text-sm text-neutral-400 leading-relaxed">{item.a}</p>
                <CopyBtn text={`Q: ${item.q}\nA: ${item.a}`} className="shrink-0" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── CTA tab ────────────────────────────────────────────────────────
function CtaTab({ ctas }: { ctas: CtaVariant[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {ctas.map((cta, i) => (
        <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">{cta.label}</span>
            <CopyBtn text={cta.copy} />
          </div>
          <p className="text-sm text-neutral-200 font-medium leading-snug">{cta.copy}</p>
        </div>
      ))}
    </div>
  );
}

// ── Schema tab ────────────────────────────────────────────────────
function SchemaTab({ schema }: { schema: Record<string, unknown> }) {
  const json = JSON.stringify(schema, null, 2);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">JSON-LD</p>
        <CopyBtn text={json} />
      </div>
      <pre className="text-xs text-neutral-300 bg-neutral-950 border border-neutral-800 rounded-xl p-4 overflow-x-auto leading-relaxed">
        {json}
      </pre>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function ContentPackReportView({ data }: { data: ContentPackResponse }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { report, input } = data;

  function handlePrint() { window.print(); }

  const fullJson = JSON.stringify(data, null, 2);

  return (
    <div id="report-printable" className="w-full max-w-3xl mx-auto space-y-5">

      {/* Print-only brand */}
      <div className="print-only-brand items-center justify-between border-b border-neutral-700 pb-3 mb-1">
        <div className="flex items-center gap-2">
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#e5e7eb" }}>Local Content Pack</span>
        </div>
        <span style={{ fontSize: 11, color: "#6b7280" }}>{new Date(data.generatedAt).toLocaleDateString()}</span>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <ScoreRing score={report.content_pack_score} />
            <div>
              <p className="text-xl font-bold text-white">{input.business_name}</p>
              <p className="text-sm text-neutral-400 mt-0.5">{input.niche} · {input.city}, {input.country}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {input.services.slice(0, 4).map((s) => (
                  <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400">{s}</span>
                ))}
                {input.services.length > 4 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-500">+{input.services.length - 4}</span>
                )}
              </div>
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex flex-col gap-2 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
              </svg>
              Save PDF
            </button>
            <CopyBtn text={fullJson} className="justify-center" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="no-print">
        <div className="flex items-center gap-0.5 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "shrink-0 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all border",
                activeTab === tab.id
                  ? "bg-violet-600/15 text-violet-300 border-violet-500/25"
                  : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.04] border-transparent",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        {activeTab === "overview" && <OverviewTab sections={report.website_structure} />}
        {activeTab === "seo"      && <SeoTab seo={report.seo} />}
        {activeTab === "copy"     && <CopyTab copy={report.copy_blocks} />}
        {activeTab === "keywords" && <KeywordsTab clusters={report.keyword_clusters} />}
        {activeTab === "faq"      && <FaqTab faq={report.faq} />}
        {activeTab === "cta"      && <CtaTab ctas={report.cta_variants} />}
        {activeTab === "schema"   && <SchemaTab schema={report.schema_jsonld} />}
      </div>

      {/* Print: render all blocks (tabs hidden in print) */}
      <div className="hidden print:block space-y-6">
        <OverviewTab sections={report.website_structure} />
        <SeoTab seo={report.seo} />
        <CopyTab copy={report.copy_blocks} />
        <KeywordsTab clusters={report.keyword_clusters} />
        <FaqTab faq={report.faq} />
        <CtaTab ctas={report.cta_variants} />
        <SchemaTab schema={report.schema_jsonld} />
      </div>
    </div>
  );
}
