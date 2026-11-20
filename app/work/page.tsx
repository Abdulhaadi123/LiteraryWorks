import Link from "next/link";
import { CaseCards, PageHero, SectionHead } from "@/components/ui";
import { moreBuilt } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Work",
  "Case studies in healthcare, logistics, sales and industrial operations: what was broken, what we built and what changed.",
  "/work",
);

export default function WorkPage() {
  return (
    <>
      <PageHero
        kicker="Work"
        title={
          <>
            Real systems. <em>Real outcomes.</em>
          </>
        }
        lead="How we have taken organizations from manual, fragmented operations to AI systems that run reliably every day, and the numbers that followed."
      >
        <Link className="btn btn-navy" href="/contact?topic=audit">
          Book a free audit
        </Link>
      </PageHero>

      <section className="section on-white">
        <div className="wrap">
          <h2 className="sr-only">Case studies</h2>
          <CaseCards />
        </div>
      </section>

      <section className="section on-mist">
        <div className="wrap">
          <SectionHead
            kicker="More we have built"
            title={
              <>
                A wider <em>portfolio.</em>
              </>
            }
            lead="Platforms and apps across healthcare, sales, recruiting, legal, finance and travel."
          />
          <ul className="more-built" data-stagger>
            {moreBuilt.map((m) => (
              <li key={m.name}>
                <h3>{m.name}</h3>
                <p className="soft">{m.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
