import Link from "next/link";
import { SectionHead } from "@/components/ui";
import { company, location, products } from "@/lib/content";

/**
 * Who stands behind the brand: the legal company, where it is based, who it serves and how to reach it, as a ruled
 * fact sheet. Only facts the site already states; no street address or phone number is published.
 */
export function CompanyFacts({ tone = "white", contact = true }: { tone?: "white" | "mist"; /** The "Contact the team" button (left out on the contact page itself). */ contact?: boolean }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Legal name", value: company.legalName },
    { label: "Brand", value: "LiteraryWorks" },
    {
      label: "Headquarters",
      value: (
        <a href={location.mapLink} target="_blank" rel="noopener noreferrer">
          {location.label}, United States
          <span className="sr-only"> (opens Google Maps in a new tab)</span>
        </a>
      ),
    },
    { label: "Serving", value: "Businesses across the United States, mostly remote" },
    { label: "Focus", value: "AI automation, web and mobile apps, cloud systems" },
    {
      label: "Our products",
      value: products.map((p, i) => (
        <span key={p.name}>
          {i > 0 && ", "}
          <a href={p.url} target="_blank" rel="noopener noreferrer">
            {p.name}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </span>
      )),
    },
    { label: "Email", value: <a href={`mailto:${company.email}`}>{company.email}</a> },
  ];

  return (
    <section className={`section on-${tone} company`} id="company" aria-labelledby="company-title">
      <div className="wrap company-grid">
        <div className="company-intro">
          <SectionHead
            kicker="Company"
            title={
              <span id="company-title">
                The company <em>behind the work</em>
              </span>
            }
            lead={`LiteraryWorks is a brand of ${company.legalName}, a technology company based in ${location.label}. We design, build and run AI, software and cloud systems for U.S. businesses.`}
          />
          <div className="cta-row">
            {contact ? (
              <Link className="btn btn-navy" href="/contact">
                Contact the team
              </Link>
            ) : null}
            <a className={`btn ${contact ? "btn-line" : "btn-navy"}`} href={location.mapLink} target="_blank" rel="noopener noreferrer">
              Open in Google Maps
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
        <dl className="company-sheet" data-reveal>
          {rows.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
