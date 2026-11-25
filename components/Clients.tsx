import { clientQuotes } from "@/lib/clients";
import { ClientLogos } from "./ClientLogos";
import { Testimonials } from "./Testimonials";
import { SectionHead } from "./ui";

/** The businesses we have built for (their logos) and what they say: on the about page. */
export function Clients({ tone = "white" }: { tone?: "white" | "mist" }) {
  return (
    <section className={`section on-${tone} clients`} id="clients">
      <div className="wrap">
        <SectionHead
          kicker="Our clients"
          title={
            <>
              Trusted by the teams <em>we build for</em>
            </>
          }
          lead="From first-time founders to established businesses: some of the people we have built AI products and systems for, in their own words."
        />
      </div>
      <ClientLogos />
      <Testimonials items={clientQuotes} />
    </section>
  );
}
