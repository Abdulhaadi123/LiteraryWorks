import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        {/* Top CTA Banner */}
        <div className="footer-top">
          <div className="footer-top-copy">
            <div className="footer-badge">
              <span className="footer-badge-dot" />
              <span>READY TO ARCHITECT WHAT&apos;S NEXT</span>
            </div>
            <h2>
              Transform operations.<br />
              <em>Build with precision.</em>
            </h2>
            <p className="footer-lead">
              From autonomous AI agent swarms to BIM digital twins and high-concurrency cloud systems, we engineer software that removes operational friction.
            </p>
            <div className="footer-actions">
              <Link className="button button-amber" href="/contact">
                Schedule Engineering Consultation <span aria-hidden="true">↗</span>
              </Link>
              <Link className="button button-outline" href="/construction">
                Explore ConTech Division <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="footer-aside">
            <div className="aside-telemetry-box">
              <span className="aside-title">US ENGINEERING HUBS</span>
              <div className="aside-hubs">
                <div>
                  <strong>New York, NY</strong>
                  <small>Enterprise &amp; Finance</small>
                </div>
                <div>
                  <strong>Austin, TX</strong>
                  <small>ConTech &amp; AI Labs</small>
                </div>
              </div>
              <div className="aside-divider" />
              <div className="aside-stat">
                <span>SYSTEM UPTIME</span>
                <strong>99.98% SLA</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Navigation Grid */}
        <div className="footer-nav-grid">
          <div className="footer-brand-col">
            <Link className="footer-wordmark" href="/">
              Literary<strong>Works</strong>
              <small>Enterprise Intelligence &amp; Built Environments</small>
            </Link>
            <p className="footer-brand-desc">
              A high-precision US technology engineering firm delivering custom AI systems, modern cloud platforms, and construction technology solutions.
            </p>
            <div className="compliance-badges">
              <span>SOC2 TYPE II READY</span>
              <span>HIPAA ALIGNED</span>
              <span>ISO 27001 READY</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Capabilities</h4>
            <Link href="/services#ai-agents">Autonomous AI Swarms</Link>
            <Link href="/construction">BIM &amp; ConTech Software</Link>
            <Link href="/services#custom-saas">Custom Cloud Platforms</Link>
            <Link href="/services#integrations">Legacy &amp; ERP Pipelines</Link>
            <Link href="/services#cloud">Hardened Cloud &amp; DevOps</Link>
          </div>

          <div className="footer-col">
            <h4>Industries</h4>
            <Link href="/industries">Commercial Construction</Link>
            <Link href="/industries">Heavy Industry &amp; Logistics</Link>
            <Link href="/industries">AEC &amp; Real Estate</Link>
            <Link href="/industries">Financial Services</Link>
            <Link href="/industries">Healthcare Networks</Link>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <Link href="/about">Our Approach</Link>
            <Link href="/about#principles">Engineering Principles</Link>
            <Link href="/construction">Licensing &amp; Delivery</Link>
            <Link href="/contact">Book Technical Audit</Link>
            <Link href="/privacy">Privacy &amp; Security</Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-credits">
            © {new Date().getFullYear()} LiteraryWorks Technologies LLC. All rights reserved. US-focused technology and ConTech engineering services.
          </p>
          <div className="footer-bottom-links">
            <Link href="/privacy">Privacy Policy</Link>
            <span>·</span>
            <Link href="/privacy">Terms of Service</Link>
            <span>·</span>
            <Link href="/privacy">Security Whitepaper</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
