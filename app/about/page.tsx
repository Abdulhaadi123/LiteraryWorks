import Link from "next/link";
import { approach } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "About LiteraryWorks Technologies",
  "The philosophy, team ethos, and engineering standards behind LiteraryWorks: an elite US technology and ConTech engineering practice.",
  "/about"
);

export default function AboutPage() {
  return (
    <>
      <section className="page-hero about-hero">
        <div className="container">
          <div className="telemetry-pill">
            <span className="telemetry-live-dot" />
            <span>OUR MISSION &amp; PHILOSOPHY</span>
          </div>
          <p className="eyebrow gold-text">
            <span className="tiny-diamond" /> ABOUT LITERARYWORKS
          </p>
          <h1>
            Clarity in Architecture.<br />
            <em>Rigorous Engineering.</em>
          </h1>
          <p>
            We help ambitious US organizations move past software bloat and empty AI promises into production-grade systems that accelerate real business operations.
          </p>
        </div>
        <span className="page-hero-decoration" aria-hidden="true">
          LW
        </span>
      </section>

      <section className="section-pad about-statement">
        <div className="container intro-grid">
          <div>
            <p className="eyebrow">
              <span className="tiny-diamond" /> WHO WE ARE
            </p>
            <span className="intro-side-index">ENGINEERING FIRST</span>
          </div>

          <div>
            <h2>
              We don&apos;t start with speculative tools.{" "}
              <em>We start with the operational bottleneck.</em>
            </h2>
            <p>
              LiteraryWorks Technologies LLC is a US-focused engineering and systems architecture firm. We combine strategic operational discovery, modern full-stack software development, and applied artificial intelligence to build systems that eliminate human friction.
            </p>
            <p>
              Our capabilities span two complementary engines: our **Core Technology Division** (delivering autonomous AI agent swarms, high-concurrency SaaS, and cloud platform engineering) and our specialized **ConTech &amp; Built Environment Division** (bringing digital precision, automated takeoffs, and BIM coordination to commercial construction).
            </p>
          </div>
        </div>
      </section>

      {/* Engineering Principles */}
      <section className="about-principles section-pad" id="principles">
        <div className="container">
          <p className="eyebrow gold-text">
            <span className="tiny-diamond" /> CORE PRINCIPLES
          </p>
          <h2>The Commitments Behind Every System We Ship</h2>

          <div className="principle-list">
            <article>
              <span>01</span>
              <div>
                <h3>Deterministic Execution Over Hype</h3>
                <p>
                  We engineer AI systems with verifiable source citations, structured data schemas, and rigorous unit testing. Technology should create clarity, not unpredictable surprises.
                </p>
              </div>
            </article>

            <article>
              <span>02</span>
              <div>
                <h3>Human Oversight at the Helm</h3>
                <p>
                  True automation doesn&apos;t eliminate human expertise; it removes tedious friction so senior leaders can make high-leverage decisions with complete audit transparency.
                </p>
              </div>
            </article>

            <article>
              <span>03</span>
              <div>
                <h3>Built for the Built World &amp; Enterprise Reality</h3>
                <p>
                  From muddy construction trailers to hardened cloud data centers, our software is tested under real operational conditions with offline-first support and zero-latency interfaces.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Phased Roadmap */}
      <section className="section-pad">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">
              <span className="tiny-diamond" /> HOW WE PARTNER
            </p>
            <h2>From Architectural Audit to Continuous Scale</h2>
          </div>

          <div className="process-grid" style={{ marginTop: "40px" }}>
            {approach.map((item) => (
              <div className="process-item" key={item.number}>
                <div className="process-line">
                  <span>{item.number} // {item.phase.toUpperCase()}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "50px" }}>
            <Link href="/contact" className="button button-amber">
              Discuss Your Project With Us <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
