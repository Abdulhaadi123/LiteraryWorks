import Link from "next/link";
import { services } from "@/lib/services";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer on-navy">
      <div className="brand-band" aria-hidden="true" />
      <div className="wrap footer-cta">
        <div>
          <p className="kicker">Start with clarity</p>
          <h2 className="h-lg">
            Know exactly what to automate, <em>before you pay to build it.</em>
          </h2>
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
          <Logo tone="light" />
          <p>AI, software and cloud systems for U.S. businesses. Written plainly, built carefully, handed over documented.</p>
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

      <div className="wrap footer-base">
        <p>© {new Date().getFullYear()} LiteraryWorks. All rights reserved.</p>
      </div>
    </footer>
  );
}
