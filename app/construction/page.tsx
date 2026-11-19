import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { BlueprintGraphic } from "@/components/BlueprintGraphic";

export const metadata = pageMeta(
  "Construction & Built Environment Intelligence",
  "Explore LiteraryWorks' specialized ConTech solutions, automated blueprint takeoffs, BIM coordination, and project systems for US commercial contractors and developers.",
  "/construction"
);

export default function ConstructionPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero construction-page-hero">
        <div className="container">
          <div className="telemetry-pill">
            <span className="telemetry-live-dot" />
            <span>BUILT ENVIRONMENT &amp; CONTECH DIVISION</span>
          </div>
          <p className="eyebrow gold-text">
            <span className="tiny-diamond" /> CONSTRUCTION &amp; HEAVY ASSETS
          </p>
          <h1>
            Building Smarter.<br />
            <em>Engineered for the Physical World.</em>
          </h1>
          <p>
            Bridging heavy physical construction with high-precision digital intelligence. We engineer automated blueprint takeoffs, BIM/CAD scheduling workflows, submittal automation, and jobsite telemetry for US general contractors, specialty trades, and commercial developers.
          </p>

          <div className="hero-actions" style={{ marginTop: "36px" }}>
            <Link href="/contact" className="button button-amber">
              Request ConTech Demo <span aria-hidden="true">↗</span>
            </Link>
            <Link href="#solutions" className="button button-outline">
              Explore Core Capabilities <span aria-hidden="true">↓</span>
            </Link>
          </div>
        </div>
        <span className="page-hero-decoration" aria-hidden="true">
          BIM
        </span>
      </section>

      {/* Interactive Blueprint Feature */}
      <section className="section-pad" id="solutions">
        <div className="container">
          <div className="section-head-split">
            <div>
              <p className="eyebrow">
                <span className="tiny-diamond" /> 01 // DIGITAL TWIN &amp; CAD PRECISION
              </p>
              <h2>
                Interactive Project Telemetry.<br />
                <em>Real-Time Clash &amp; Takeoff Engine.</em>
              </h2>
            </div>
            <div className="head-side">
              <p>
                Toggle layers below to inspect how our software connects structural framing, MEP infrastructure, and IoT sensors into one governed digital twin.
              </p>
            </div>
          </div>

          <div style={{ marginTop: "40px" }}>
            <BlueprintGraphic />
          </div>
        </div>
      </section>

      {/* Physical Project Solutions & Technology Pillars */}
      <section className="section-pad">
        <div className="container">
          <div className="construction-division-grid">
            <div>
              <p className="eyebrow">
                <span className="tiny-diamond" /> 02 // CONTECH SOFTWARE PILLARS
              </p>
              <h2>
                Eliminate Jobsite Friction.<br />
                <em>From Blueprint to Handover.</em>
              </h2>
              <p>
                Contractors are burdened with manual submittals, fragmented estimating spreadsheets, and miscommunicated RFIs. We deliver unified software solutions designed specifically around commercial construction workflows:
              </p>

              <div className="construction-list">
                <div className="contech-feature-item">
                  <strong>Automated AI Blueprint Takeoffs</strong>
                  <p>Parse complex multi-page architectural and structural vector PDFs in minutes. Automatically extract linear footages, area counts, and fixture quantities with verified audit trails.</p>
                </div>

                <div className="contech-feature-item">
                  <strong>BIM &amp; Schedule Conflict Detection</strong>
                  <p>Correlate 3D BIM models against 4D project timelines. Identify trade stacking, spatial clashes, and delivery delays before crews are blocked on site.</p>
                </div>

                <div className="contech-feature-item">
                  <strong>Autonomous Submittal &amp; RFI Routing</strong>
                  <p>Intelligently parse spec books, match product cut sheets, flag specification deviations, and route approval packets through general contractors and architects automatically.</p>
                </div>

                <div className="contech-feature-item">
                  <strong>Procore, Autodesk &amp; ERP Connectors</strong>
                  <p>Bidirectional live synchronization between your field coordination platforms and back-office financial systems (Sage, Foundation, Viewpoint, QuickBooks).</p>
                </div>
              </div>
            </div>

            <div className="construction-stats-card">
              <div className="stats-card-header">
                <span className="status-indicator-dot" />
                <span>FIELD IMPACT METRICS (US COMMERCIAL PILOTS)</span>
              </div>
              <div className="stats-metric-grid">
                <div className="stat-box">
                  <strong>78%</strong>
                  <span>Faster Takeoff Turnarounds</span>
                  <small>From 3 days to under 4 hours</small>
                </div>
                <div className="stat-box">
                  <strong>-35%</strong>
                  <span>RFI Cycle Time</span>
                  <small>Automated spec book correlation</small>
                </div>
                <div className="stat-box">
                  <strong>$0</strong>
                  <span>Costly Clash Surprises</span>
                  <small>Early BIM spatial reconciliation</small>
                </div>
                <div className="stat-box">
                  <strong>100%</strong>
                  <span>Audit Trail Completeness</span>
                  <small>Every change order documented</small>
                </div>
              </div>

              <div className="stats-card-note">
                <p>
                  *Based on deployment data across commercial general contractors and mechanical/electrical trade partners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance & Regulatory Notice */}
      <section className="construction-notice">
        <div className="container">
          <div className="notice-icon">⚖️</div>
          <div>
            <h3>Professional Standards &amp; Verified Delivery</h3>
            <p>
              LiteraryWorks Technologies LLC specializes in software engineering, artificial intelligence, and digital workflow systems for the built environment. Any physical construction, engineering oversight, or regulated site execution is coordinated through appropriately licensed, bonded, and insured professionals in compliance with applicable US municipal, state, and federal building codes.
            </p>
          </div>
        </div>
      </section>

      {/* Conversion Banner */}
      <section className="service-bridge section-pad">
        <div className="container bridge-grid">
          <div>
            <p className="eyebrow gold-text">
              <span className="tiny-diamond" /> START WITH AN ENGINEERING REVIEW
            </p>
            <h2>
              Ready to modernize <em>your construction workflows?</em>
            </h2>
          </div>
          <div>
            <p>
              Let&apos;s review your current bidding, takeoff, or project coordination stack and identify where intelligent automation delivers immediate returns.
            </p>
            <Link href="/contact" className="button button-amber">
              Schedule ConTech Consultation <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
