"use client";

import { useState } from "react";
import type { Tone, Language } from "@/lib/content-pack/types";

interface Props {
  onResult: (data: unknown) => void;
  onError: (msg: string) => void;
  isLoading: boolean;
  setLoading: (v: boolean) => void;
}

const TONES: { value: Tone; label: string }[] = [
  { value: "professionnel", label: "Professionnel" },
  { value: "simple", label: "Simple" },
  { value: "premium", label: "Premium" },
  { value: "convivial", label: "Convivial" },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

export default function ContentPackForm({ onResult, onError, isLoading, setLoading }: Props) {
  const [businessName, setBusinessName] = useState("");
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("France");
  const [servicesRaw, setServicesRaw] = useState("");
  const [tone, setTone] = useState<Tone>("professionnel");
  const [language, setLanguage] = useState<Language>("fr");
  const [hasDelivery, setHasDelivery] = useState(false);
  const [serviceArea, setServiceArea] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const services = servicesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (services.length === 0) {
      onError("Please enter at least one service.");
      return;
    }

    setLoading(true);
    onError("");
    onResult(null);

    try {
      const res = await fetch("/api/content-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName.trim(),
          niche: niche.trim(),
          city: city.trim(),
          country: country.trim() || "France",
          services,
          tone,
          language,
          has_delivery: hasDelivery,
          service_area: serviceArea.trim() || undefined,
        }),
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

  const inputBase =
    "w-full px-3.5 py-2.5 rounded-xl border border-neutral-700 bg-neutral-900 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 transition-colors";

  const labelBase = "block text-xs font-medium text-neutral-400 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-5">
      {/* Row 1: Name + Niche */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelBase}>Business name *</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Garage Martin"
            required
            disabled={isLoading}
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase}>Niche / category *</label>
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. garage automobile, pizzeria"
            required
            disabled={isLoading}
            className={inputBase}
          />
        </div>
      </div>

      {/* Row 2: City + Country */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelBase}>City *</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Lyon"
            required
            disabled={isLoading}
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase}>Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="France"
            disabled={isLoading}
            className={inputBase}
          />
        </div>
      </div>

      {/* Services */}
      <div>
        <label className={labelBase}>Services * <span className="text-neutral-600 font-normal">(comma-separated)</span></label>
        <input
          type="text"
          value={servicesRaw}
          onChange={(e) => setServicesRaw(e.target.value)}
          placeholder="e.g. révision, vidange, diagnostic électronique"
          required
          disabled={isLoading}
          className={inputBase}
        />
      </div>

      {/* Tone + Language */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelBase}>Tone</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                disabled={isLoading}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  tone === t.value
                    ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                    : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelBase}>Language</label>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLanguage(l.value)}
                disabled={isLoading}
                className={[
                  "px-4 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  language === l.value
                    ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                    : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600",
                ].join(" ")}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced options toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {showAdvanced ? "Hide" : "Show"} advanced options
      </button>

      {showAdvanced && (
        <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex items-center gap-3">
            <input
              id="has_delivery"
              type="checkbox"
              checked={hasDelivery}
              onChange={(e) => setHasDelivery(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded accent-violet-500"
            />
            <label htmlFor="has_delivery" className="text-sm text-neutral-300 cursor-pointer">
              Delivery / service at customer location available
            </label>
          </div>
          <div>
            <label className={labelBase}>Service area <span className="text-neutral-600 font-normal">(optional)</span></label>
            <input
              type="text"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="e.g. Orléans + 15 km"
              disabled={isLoading}
              className={inputBase}
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !businessName.trim() || !niche.trim() || !city.trim() || !servicesRaw.trim()}
        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Generating content pack…
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Generate Content Pack
          </>
        )}
      </button>
    </form>
  );
}
