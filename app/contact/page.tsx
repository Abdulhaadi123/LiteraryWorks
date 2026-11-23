import { ContactForm } from "@/components/ContactForm";
import { Faq, PageHero, SectionHead } from "@/components/ui";
import { company, faqs, location } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Contact",
  "Book your free 1-hour AI audit, or tell us about a project. We typically reply within one business day.",
  "/contact",
);

export default function ContactPage() {
  return (
    <>
      <PageHero
        kicker="Contact"
        title={
          <>
            Book your free <em>AI audit.</em>
          </>
        }
        lead="Tell us a little about your business and what you would like to improve. We will reply by email to agree a time for a working session."
      />
      <section className="section on-white">
        <div className="wrap contact-grid">
          <div>
            <h2 className="h-md">What happens next</h2>
            <ol className="next">
              <li>
                <b>You send a few details.</b>
                <span>What the work is, where it gets stuck, and what you would like to change.</span>
              </li>
              <li>
                <b>We reply by email.</b>
                <span>We typically reply within one business day to agree a time.</span>
              </li>
              <li>
                <b>One hour, on your workflows.</b>
                <span>A working session, not a sales call. You leave with a clear next step.</span>
              </li>
            </ol>
          </div>
          <ContactForm />
        </div>
      </section>

      <section className="section on-white location" id="location">
        <div className="wrap location-grid">
          <div>
            <SectionHead
              kicker="Where we are"
              title={
                <>
                  Based in <em>{location.label}.</em>
                </>
              }
              lead="We work with businesses across the U.S. from San Antonio. Most of the work happens remotely, in working sessions on your own tools."
            />
            <a className="btn btn-line" href={location.mapLink} target="_blank" rel="noopener noreferrer">
              Open in Google Maps
            </a>
            <dl className="location-facts">
              <div>
                <dt>Company</dt>
                <dd>{company.legalName}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${company.email}`}>{company.email}</a>
                </dd>
              </div>
            </dl>
          </div>
          <div className="map-frame">
            <iframe
              title={`Map: ${location.label}`}
              src={location.mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="section on-mist">
        <div className="wrap two-col">
          <SectionHead kicker="Questions" title={<>Before you <em>write.</em></>} lead="How the audit works, what it costs and who it is for." />
          <Faq items={faqs} />
        </div>
      </section>
    </>
  );
}
