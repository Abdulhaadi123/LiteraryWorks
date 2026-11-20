import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/ui";
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
    </>
  );
}
