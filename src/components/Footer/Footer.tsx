import Link from "next/link";
import styles from "./Footer.module.css";

const TOOLS = [
  {
    label: "Website Analyzer",
    href: "/",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: "Maps Business Analyzer",
    href: "/maps-analyzer",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: "Content Pack Generator",
    href: "/local-content-pack-generator",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

const RESOURCES = [
  { label: "FAQ", href: "/faq" },
  { label: "Sitemap", href: "/sitemap.xml" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>

        {/* Brand */}
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink}>
            <div className={styles.logoBox}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className={styles.brandName}>Analyzer Suite</span>
          </Link>
          <p className={styles.tagline}>
            Lighthouse + AI-powered SEO &amp; performance audits for any website.
          </p>
        </div>

        {/* Tools column */}
        <nav className={styles.navGroup} aria-label="Tools">
          <p className={styles.navTitle}>Tools</p>
          <ul className={styles.navList}>
            {TOOLS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.navLink}>
                  <span className={styles.navLinkIcon}>{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Resources column */}
        <nav className={styles.navGroup} aria-label="Resources">
          <p className={styles.navTitle}>Resources</p>
          <ul className={styles.navList}>
            {RESOURCES.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <p className={styles.copy}>© {year} Analyzer Suite. Free to use.</p>
        <span className={styles.badge}>
          <span className={styles.badgeDot} />
          All systems operational
        </span>
      </div>
    </footer>
  );
}
