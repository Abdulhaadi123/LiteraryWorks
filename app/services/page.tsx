import Link from "next/link";
import { services } from "@/lib/content";
import { ServiceCard } from "@/components/ServiceCard";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Technology & AI Capabilities",
  "Explore LiteraryWorks' comprehensive technology engineering services: enterprise AI swarms, ConTech digital twins, custom SaaS, and cloud infrastructure for US organizations.",
  "/services"
);

export default function ServicesPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="telemetry-pill">
            <span className="telemetry-live-dot" />
            <span>FULL-STACK ENGINEERING CAPABILITIES</span>
          </div>
          <p className="eyebrow gold-text">
            <span className="tiny-diamond" /> CORE EXPERTISE
          </p>
          <h1>
            Engineered for Precision.<br />
            <em>Built for Measurable Growth.</em>
          </h1>
          <p>
            We partner with forward-thinking US enterprises, commercial builders, and high-growth operators to design, build, and deploy high-reliability software, autonomous AI systems, and connected digital platforms.
          </p>
        </div>
        <span className="page-hero-decoration" aria-hidden="true">
          SYS
        </span>
      </section>

      <section className="section-pad services-page-section">
        <div className="container">
          <div className="section-head-split">
            <div>
              <p className="eyebrow">
                <span className="tiny-diamond" /> 01 // CAPABILITIES CATALOG
              </p>
              <h2>
                Six Specialized Divisions.<br />
                <em>One Integrated Partner.</em>
              </h2>
            </div>
            <div className="head-side">
              <p>
                Every engagement blends strategic architecture, rigorous engineering, and long-term operational support.
              </p>
            </div>
          </div>

          <div className="services-grid" style={{ marginTop: "48px" }}>
            {services.map((service) => (
              <ServiceCard service={service} key={service.slug} />
            ))}
          </div>

          {/* Construction Feature Callout Card */}
          <div className="service-addon" style={{ marginTop: "64px" }}>
            <div>
              <p className="eyebrow gold-text">
                <span className="tiny-diamond" /> SPECIALIZED DIVISION
              </p>
              <h3>Construction Technology &amp; Heavy Asset Intelligence</h3>
              <p>
                Looking specifically for automated blueprint takeoffs, BIM coordination, field reporting, or subcontractor workflow management? Explore our dedicated ConTech systems.
              </p>
            </div>
            <Link href="/construction" className="button button-amber">
              Explore ConTech Division <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Engineering Standards */}
      <section className="outcome-section">
        <div className="container outcome-grid">
          <div>
            <p className="eyebrow gold-text">
              <span className="tiny-diamond" /> 02 // TECHNICAL ASSURANCE
            </p>
            <h2>
              The standards we build by.<br />
              <em>Zero compromise on quality.</em>
            </h2>
          </div>

          <div className="outcome-points">
            <article>
              <span>01</span>
              <div>
                <h3>Deterministic AI with Human Guardrails</h3>
                <p>
                  We never deploy &ldquo;black box&rdquo; autonomous agents without structured audit logs, verifiable source citations, and enforceable human approval gates for critical actions.
                </p>
              </div>
            </article>

            <article>
              <span>02</span>
              <div>
                <h3>US Enterprise Compliance &amp; Security</h3>
                <p>
                  Zero-trust network architecture, encrypted data at rest/transit, and SOC2 / HIPAA / ISO 27001 readiness embedded into system foundations from day one.
                </p>
              </div>
            </article>

            <article>
              <span>03</span>
              <div>
                <h3>Production-Grade Scalability &amp; Observability</h3>
                <p>
                  Containerized architectures, automated CI/CD deployments, real-time APM telemetry, and 99.98% SLA benchmarks designed to handle demanding enterprise load.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Consultation Banner */}
      <section className="service-bridge section-pad">
        <div className="container bridge-grid">
          <div>
            <p className="eyebrow gold-text">
              <span className="tiny-diamond" /> ARCHITECTURAL AUDIT
            </p>
            <h2>
              Not sure which solution <em>fits your operational reality?</em>
            </h2>
          </div>
          <div>
            <p>
              We offer a complimentary 1-hour systems audit to analyze your existing workflows and identify your highest-leverage digital opportunities.
            </p>
            <Link href="/contact" className="button button-amber">
              Book Architecture Audit <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
