import { ContactForm } from "@/components/ContactForm";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Schedule Technical Consultation",
  "Connect with LiteraryWorks' senior systems architects to discuss custom AI systems, ConTech solutions, or enterprise cloud platforms.",
  "/contact"
);

export default function ContactPage() {
  return (
    <>
      <section className="page-hero contact-hero">
        <div className="container">
          <div className="telemetry-pill">
            <span className="telemetry-live-dot" />
            <span>US ENGINEERING CONSULTATION</span>
          </div>
          <p className="eyebrow gold-text">
            <span className="tiny-diamond" /> START THE CONVERSATION
          </p>
          <h1>
            Tell Us the Bottleneck.<br />
            <em>We&apos;ll Architect the Solution.</em>
          </h1>
          <p>
            Whether you&apos;re planning an autonomous AI agent swarm, automating construction takeoffs, or modernizing an enterprise cloud platform, it begins with an honest, technical conversation.
          </p>
        </div>
        <span className="page-hero-decoration" aria-hidden="true">
          ↗
        </span>
      </section>

      <section className="section-pad contact-section">
        <div className="container contact-grid">
          <div className="contact-intro">
            <p className="eyebrow">
              <span className="tiny-diamond" /> DIRECT INQUIRY
            </p>
            <h2>
              What would you like <em>to run faster &amp; cleaner?</em>
            </h2>
            <p>
              Share an overview of your current challenges, desired timeline, or system requirements. Our senior systems architects will review your submission and reach out within 24 business hours.
            </p>

            <div className="contact-hubs-box">
              <span className="hubs-label">OPERATIONAL HUBS</span>
              <div className="hub-row">
                <div>
                  <strong>New York, NY</strong>
                  <p>Enterprise Software &amp; Financial AI</p>
                </div>
                <div>
                  <strong>Austin, TX</strong>
                  <p>ConTech Systems &amp; Robotics/IoT</p>
                </div>
              </div>
            </div>

            <div className="contact-note">
              <span className="contact-note-icon">🛡️</span>
              <div>
                <strong>Confidential &amp; Secure</strong>
                <p>
                  We treat all operational blueprints, system architectures, and client disclosures under strict mutual non-disclosure (NDA) standards.
                </p>
              </div>
            </div>
          </div>

          <div>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
