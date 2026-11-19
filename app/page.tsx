import Link from "next/link";
import { services, industries, approach, metrics } from "@/lib/content";
import { ServiceCard } from "@/components/ServiceCard";
import { SystemPreview } from "@/components/SystemPreview";
import { BlueprintGraphic } from "@/components/BlueprintGraphic";
import { Stage3D } from "@/motion/Stage3D";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="container hero-layout">
          <div className="hero-copy">
            <div className="hero-overline" data-reveal="fade">
              <span className="overline-dot" />
              <span>US ENTERPRISE AI &amp; BUILT ENVIRONMENT ENGINEERING</span>
              <span className="hero-overline-index">SYS / 001</span>
            </div>

            <h1 id="hero-heading" data-reveal="rise">
              Engineering Intelligence for the Built World &amp; Enterprise Scale.
            </h1>

            <p className="hero-description" data-reveal="rise">
              We design mission-critical AI systems, custom software platforms, and digital twin workflows for forward-thinking US enterprises, commercial builders, and industrial operators.
            </p>

            <div className="hero-actions" data-reveal="rise">
              <Link className="button button-amber" href="/contact">
                Schedule Engineering Audit <span aria-hidden="true">↗</span>
              </Link>
              <Link className="button button-outline" href="/construction">
                Explore ConTech Division <span aria-hidden="true">↗</span>
              </Link>
            </div>

            {/* Metrics Telemetry Strip */}
            <div className="hero-metrics-strip" data-reveal="fade">
              {metrics.map((m) => (
                <div className="metric-box" key={m.label}>
                  <strong>{m.value}</strong>
                  <span>{m.label}</span>
                  <small>{m.note}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual" data-reveal="scale">
            <SystemPreview />
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="container hero-bottom">
          <div className="hero-bottom-status">
            <span className="status-pulse-dot" />
            <span>US INFRASTRUCTURE: ONLINE</span>
          </div>
          <span className="hero-bottom-line" />
          <span className="hero-scroll-prompt">
            SCROLL TO INSPECT DIGITAL TWIN ARCHITECTURE <b aria-hidden="true">↓</b>
          </span>
        </div>
      </section>

      {/* Intro / Problem Statement */}
      <section className="intro-section section-pad" id="why">
        <div className="container intro-grid">
          <div>
            <p className="eyebrow">
              <span className="tiny-diamond" /> 01 // THE ARCHITECTURAL CHALLENGE
            </p>
            <span className="intro-side-index">BEYOND DISCONNECTED TOOLS</span>
          </div>

          <div>
            <h2 data-reveal="rise">
              The problem isn&apos;t a lack of tools.{" "}
              <em>It&apos;s that your operational systems don&apos;t talk to each other.</em>
            </h2>

            <div className="intro-below">
              <p>
                From fragmented spreadsheets and siloed ERPs to manual submittal bottlenecks on commercial job sites, valuable time is lost between handoffs. We build the connective intelligence—software, AI agents, and integrations that turn disjointed steps into an automated, transparent operation.
              </p>
              <Link className="button button-outline" href="/about">
                Our Engineering Philosophy <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Interactive Runway Scene */}
      <Stage3D
        scene="aiSystem"
        eyebrow="02 // INTERACTIVE 3D DIGITAL TWIN"
        title={
          <>
            Six Coordinated Layers. <br />
            <em>One Engineered Operation.</em>
          </>
        }
        description="Scroll through our reference architectural model. Modeled purely in procedural code—from seismic substructure and structural BIM framing to MEP data conduits, autonomous AI cores, and executive governance."
        steps={[
          {
            title: "Substructure & Hardened Infrastructure",
            text: "High-availability cloud architecture, zero-trust security perimeters, and reliable edge compute foundations.",
          },
          {
            title: "Structural BIM & Connected Data",
            text: "Unified data models, 3D CAD framing schemas, and permission-governed knowledge stores.",
          },
          {
            title: "MEP Conduits & Real-Time Integrations",
            text: "Bi-directional event buses synchronizing ERPs, Procore, Autodesk, and internal databases.",
          },
          {
            title: "Control Dashboards & Modern SaaS",
            text: "High-concurrency web portals and offline-first mobile applications built for field crews and executives.",
          },
          {
            title: "Autonomous AI Swarms & Core Intelligence",
            text: "Specialized AI agents executing automated takeoffs, schedule conflict audits, and multi-step tasks.",
          },
          {
            title: "Executive Governance & Safety Gate",
            text: "Mandatory human-in-the-loop sign-off, SOC2 compliance logging, and real-time operational telemetry.",
          },
        ]}
        labels={[
          { key: "cloud", label: "Substructure Foundation", detail: "01 / CLOUD & EDGE" },
          { key: "data", label: "BIM & Structural Framing", detail: "02 / DATA STORE" },
          { key: "integrations", label: "Conduits & API Pipelines", detail: "03 / CONNECTIVITY" },
          { key: "applications", label: "Control Dashboards", detail: "04 / PLATFORMS" },
          { key: "agents", label: "Autonomous AI Core", detail: "05 / SWARM AGENTS" },
          { key: "governance", label: "Command & Governance", detail: "06 / OVERSIGHT" },
        ]}
      />

      {/* ConTech & Built Environment Feature */}
      <section className="construction-feature" id="contech">
        <div className="construction-visual">
          <BlueprintGraphic />
        </div>

        <div className="construction-copy">
          <div className="telemetry-pill">
            <span className="telemetry-live-dot" />
            <span>CONTECH &amp; AEC DIVISION</span>
          </div>
          <p className="eyebrow gold-text">
            <span className="tiny-diamond" /> 03 // BUILT ENVIRONMENT
          </p>
          <h2>
            Physical structures.<br />
            <em>Digital precision.</em>
          </h2>
          <p>
            Commercial construction projects lose millions to paperwork delays, material estimation errors, and misaligned field handoffs. We build the next generation of construction intelligence—delivering automated blueprint takeoffs, live BIM clash analytics, and streamlined subcontractor submittal workflows.
          </p>

          <div className="construction-tags">
            <span>Automated AI Takeoffs</span>
            <span>BIM / CAD Pipelines</span>
            <span>Procore &amp; Autodesk Sync</span>
            <span>Submittal &amp; RFI Routing</span>
            <span>Jobsite Telematics</span>
          </div>

          <div className="contech-actions">
            <Link href="/construction" className="button button-amber">
              Explore ConTech Capabilities <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/contact" className="button button-outline">
              Request ConTech Audit <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="services-section section-pad" id="expertise">
        <div className="container">
          <div className="section-head-split">
            <div>
              <p className="eyebrow">
                <span className="tiny-diamond" /> 04 // CORE EXPERTISE
              </p>
              <h2>
                Built for the reality of<br />
                <em>high-stakes enterprise operations.</em>
              </h2>
            </div>
            <div className="head-side">
              <p>
                From specialized construction tech to autonomous AI agents and scalable cloud architectures, we design systems that perform under heavy enterprise load.
              </p>
              <Link href="/services" className="button button-outline">
                View All Capabilities <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="services-grid">
            {services.map((s) => (
              <ServiceCard service={s} key={s.slug} />
            ))}
          </div>
        </div>
      </section>

      {/* Value Comparison Section */}
      <section className="outcome-section">
        <div className="container outcome-grid">
          <div>
            <p className="eyebrow gold-text">
              <span className="tiny-diamond" /> 05 // QUANTIFIABLE OUTCOMES
            </p>
            <h2>
              Measurable leverage.<br />
              <em>Zero tech theater.</em>
            </h2>
            <p className="outcome-lead">
              We measure every system by hard operational metrics: hours returned to senior staff, risk eliminated from contracts, and cycle times cut in half.
            </p>
          </div>

          <div className="outcome-points">
            <article>
              <span>01</span>
              <div>
                <h3>Reclaim thousands of operational hours.</h3>
                <p>
                  Replace repetitive document sorting, submittal reviews, and manual spreadsheet entries with deterministic AI workflows that execute in seconds.
                </p>
              </div>
            </article>

            <article>
              <span>02</span>
              <div>
                <h3>Activate siloed enterprise data.</h3>
                <p>
                  Unify scattered blueprints, contract archives, and disconnected ERP records into a permission-governed retrieval system your leadership can trust.
                </p>
              </div>
            </article>

            <article>
              <span>03</span>
              <div>
                <h3>Eliminate costly change-order surprises.</h3>
                <p>
                  In construction and capital projects, our automated takeoff and clash detection systems identify discrepancies before equipment rolls onto the site.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="industries-section section-pad">
        <div className="container">
          <div className="section-head-split">
            <div>
              <p className="eyebrow">
                <span className="tiny-diamond" /> 06 // TARGET SECTORS
              </p>
              <h2>
                Engineered for complex,<br />
                <em>high-concurrency US industries.</em>
              </h2>
            </div>
            <div className="head-side">
              <p>
                We tailor our architectures to the regulatory, security, and operational standards of mission-critical American businesses.
              </p>
              <Link href="/industries" className="button button-outline">
                All Industry Verticals <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="industry-list">
            {industries.map((item) => (
              <div className="industry-row" key={item.number}>
                <span className="industry-number">{item.number}</span>
                <div className="industry-content">
                  <h3>{item.name}</h3>
                  <span className="industry-tag">{item.tag}</span>
                </div>
                <p>{item.detail}</p>
                <Link href={`/industries`} className="industry-arrow" aria-label={`Explore ${item.name}`}>
                  ↗
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process / Approach Section */}
      <section className="process-section section-pad">
        <div className="container">
          <div className="section-head-split">
            <div>
              <p className="eyebrow">
                <span className="tiny-diamond" /> 07 // DELIVERY METHODOLOGY
              </p>
              <h2>
                Predictable delivery.<br />
                <em>Rigorous execution.</em>
              </h2>
            </div>
            <div className="head-side">
              <p>
                Every engagement follows an accountable four-phase engineering framework designed to demonstrate value quickly.
              </p>
            </div>
          </div>

          <div className="process-grid">
            {approach.map((item) => (
              <div className="process-item" key={item.number}>
                <div className="process-line">
                  <span>{item.number} // {item.phase.toUpperCase()}</span>
                  <span className="process-node" />
                </div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="process-cta-box">
            <div>
              <h3>Ready to audit your operational workflows?</h3>
              <p>Schedule a focused 1-hour engineering consultation with our senior systems architects.</p>
            </div>
            <Link href="/contact" className="button button-amber">
              Book Technical Consultation <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
