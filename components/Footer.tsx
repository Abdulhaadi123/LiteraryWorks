import Link from "next/link";
import { company, location } from "@/lib/content";
import { services } from "@/lib/services";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer on-navy textured">
      <div className="brand-band" aria-hidden="true" />
      <div className="wrap footer-cta">
        <div>
          <p className="kicker">Start with clarity</p>
          <h2 className="h-lg">
            Know exactly what to automate, <em>before you pay to build it</em>
          </h2>
          <ul className="cta-facts">
            <li>
              <b>60 min</b>
              <span>Free audit session</span>
            </li>
            <li>
              <b>14 days</b>
              <span>Structured audit</span>
            </li>
            <li>
              <b>One team</b>
              <span>Plan, build and handover</span>
            </li>
          </ul>
        </div>
        <div className="cta-row">
          <Link className="btn btn-white" href="/contact?topic=audit">
            Book a free AI audit
          </Link>
          <Link className="btn btn-line" href="/ai-audit">
            The three ways to start
          </Link>
        </div>
      </div>

      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Link href="/" className="brand" aria-label="Literary Worx, home" prefetch={false}>
            <Logo tone="light" />
          </Link>
          <p>AI, software and cloud systems for U.S. businesses. Written plainly, built carefully, handed over documented.</p>
          <p className="footer-loc">
            <a href={location.mapLink} target="_blank" rel="noopener noreferrer">
              {location.label}
            </a>
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
