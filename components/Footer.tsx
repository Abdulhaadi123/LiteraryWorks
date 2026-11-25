import Link from "next/link";
import { company, location } from "@/lib/content";
import type { CtaNames } from "@/lib/footer-cta";
import { projects } from "@/lib/projects";
import { services } from "@/lib/services";
import { FooterCtaBand } from "./FooterCta";
import { Logo } from "./Logo";

/** The names the call to action's words use on service and project pages. */
const ctaNames: CtaNames = {
  services: Object.fromEntries(services.map((s) => [s.slug, s.name])),
  projects: Object.fromEntries(projects.map((p) => [p.slug, p.name])),
  email: company.email,
  city: location.city,
  region: location.region,
};

export function Footer() {
  return (
    <footer className="site-footer on-navy textured">
      <div className="brand-band" aria-hidden="true" />
      <FooterCtaBand names={ctaNames} />

      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Link href="/" className="brand" aria-label="Literary Worx, home" prefetch={false}>
            <Logo tone="light" />
          </Link>
          <p>AI, software and cloud systems for U.S. businesses. Written plainly, built carefully, handed over documented.</p>
          <p className="footer-loc">
            <a href={location.mapLink} target="_blank" rel="noopener noreferrer">
              {location.street}, {location.city}, {location.regionCode} {location.postalCode}
            </a>
            <a href={company.phoneHref}>{company.phone}</a>
            <a href={`mailto:${company.email}`}>{company.email}</a>
          </p>
        </div>
        <nav aria-label="Services">
          <h3 className="footer-h">Services</h3>
          <ul>
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`}>{s.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Company">
          <h3 className="footer-h">Company</h3>
          <ul>
            <li>
              <Link href="/ai-audit">AI audit</Link>
            </li>
            <li>
              <Link href="/work">Case studies</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <h3 className="footer-h">Legal</h3>
          <ul>
            <li>
              <Link href="/privacy">Privacy notice</Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* the large wordmark is a second way home (not a second stop for the keyboard) */}
      <p className="footer-mark">
        <Link href="/" tabIndex={-1} aria-hidden="true" prefetch={false}>
          Literary Worx
        </Link>
      </p>
      <div className="wrap footer-base">
        <p>
          © {new Date().getFullYear()} {company.legalName}. Literary Worx is a brand of {company.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
