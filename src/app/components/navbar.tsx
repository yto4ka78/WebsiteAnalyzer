"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  {
    label: "Website Analyzer",
    href: "/",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: "Maps Business Analyzer",
    href: "/maps-analyzer",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: "Document Extractor",
    href: "/doc-extractor",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: "FAQ",
    href: "/faq",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Frosted glass bar */}
      <div className="border-b border-white/[0.06] bg-neutral-950/80 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/60 group-hover:bg-indigo-500 transition-colors duration-150">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-semibold text-[13px] text-white tracking-tight hidden sm:block">
              Analyzer Suite
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={[
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                      active
                        ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/25"
                        : "text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.05] border border-transparent",
                    ].join(" ")}
                  >
                    <span className={active ? "text-indigo-400" : "text-neutral-600 group-hover:text-neutral-400"}>
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 rounded-lg hover:bg-white/[0.06] transition-colors gap-[5px]"
          >
            <span
              className={[
                "block w-[18px] h-[1.5px] bg-neutral-400 rounded-full transition-all duration-200 origin-center",
                menuOpen ? "rotate-45 translate-y-[6.5px]" : "",
              ].join(" ")}
            />
            <span
              className={[
                "block w-[18px] h-[1.5px] bg-neutral-400 rounded-full transition-all duration-200",
                menuOpen ? "opacity-0 scale-x-0" : "",
              ].join(" ")}
            />
            <span
              className={[
                "block w-[18px] h-[1.5px] bg-neutral-400 rounded-full transition-all duration-200 origin-center",
                menuOpen ? "-rotate-45 -translate-y-[6.5px]" : "",
              ].join(" ")}
            />
          </button>
        </nav>
      </div>

      {/* Mobile dropdown */}
      <div
        className={[
          "md:hidden overflow-hidden transition-all duration-200 ease-in-out",
          menuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="border-b border-white/[0.06] bg-neutral-950/95 backdrop-blur-xl">
          <ul className="max-w-6xl mx-auto px-4 py-2 flex flex-col gap-0.5">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={[
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full",
                      active
                        ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/25"
                        : "text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.05] border border-transparent",
                    ].join(" ")}
                  >
                    <span className={active ? "text-indigo-400" : "text-neutral-600"}>
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </header>
  );
}
