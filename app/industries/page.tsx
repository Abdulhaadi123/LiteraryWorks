import Link from "next/link";
import { industries } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Target Industries & Sectors",
  "How LiteraryWorks engineers specialized software, AI systems, and ConTech workflows across commercial construction, healthcare, logistics, and enterprise SaaS.",
  "/industries"
);

export default function IndustriesPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="telemetry-pill">
            <span className="telemetry-live-dot" />
            <span>US SECTOR SPECIALIZATION</span>
          </div>
          <p className="eyebrow gold-text">
            <span className="tiny-diamond" /> INDUSTRY VERTICALS
          </p>
          <h1>
            Engineered for the Realities of<br />
            <em>Regulated &amp; Complex Sectors.</em>
          </h1>
          <p>
            We don&apos;t apply one-size-fits-all templates. We study the operational constraints, compliance rules, and data flows of each industry to build systems that fit your team&apos;s daily reality.
          </p>
        </div>
        <span className="page-hero-decoration" aria-hidden="true">
          SEC
        </span>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="section-head-split">
            <div>
              <p className="eyebrow">
                <span className="tiny-diamond" /> 01 // SECTORS IN FOCUS
              </p>
              <h2>
                Where our technology delivers<br />
                <em>the highest operational leverage.</em>
              </h2>
            </div>
            <div className="head-side">
              <p>
                From jobsite field coordination to high-security data rooms, discover how our custom architectures perform.
              </p>
            </div>
          </div>

          <div className="industry-list" style={{ marginTop: "48px" }}>
            {industries.map((item) => (
              <div className="industry-row" key={item.number}>
                <span className="industry-number">{item.number}</span>
                <div className="industry-content">
                  <h3>{item.name}</h3>
                  <span className="industry-tag">{item.tag}</span>
                </div>
                <p>{item.detail}</p>
                <span className="industry-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>
            ))}
          </div>

          {/* Construction Highlight */}
          <div className="service-addon" style={{ marginTop: "64px" }}>
            <div>
              <p className="eyebrow gold-text">
                <span className="tiny-diamond" /> FLAGSHIP SECTOR
              </p>
              <h3>Commercial Construction &amp; AEC Technology</h3>
              <p>
                Learn how our automated blueprint takeoffs, BIM conflict detection, and submittal automation pipelines are saving general contractors hundreds of hours per project.
              </p>
            </div>
            <Link href="/construction" className="button button-amber">
              View ConTech Overview <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Conversion Banner */}
      <section className="service-bridge section-pad">
        <div className="container bridge-grid">
          <div>
            <p className="eyebrow gold-text">
              <span className="tiny-diamond" /> CUSTOM SYSTEM ARCHITECTURE
            </p>
            <h2>
              Operating in a niche or <em>highly regulated market?</em>
            </h2>
          </div>
          <div>
            <p>
              Let&apos;s discuss your industry&apos;s specific compliance, security, and integration challenges in a confidential engineering audit.
            </p>
            <Link href="/contact" className="button button-amber">
              Schedule Industry Consultation <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
