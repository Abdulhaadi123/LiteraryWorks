import Link from "next/link";
import { CasesDeck } from "@/components/ServicesDeck";
import { AuditStrip, Industries } from "@/components/Sections";
import { CaseCards, PageHero, Portfolio, SectionHead } from "@/components/ui";
import { projectList } from "@/lib/projects";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Case studies",
  "Case studies in healthcare, logistics, sales and industrial operations: what was broken, what we built and what changed.",
  "/work",
);

export default function WorkPage() {
  return (
    <>
      <h1 className="sr-only">Case studies</h1>
      <CasesDeck
        id="cases-deck"
        intro={
          <>
            <p className="kicker">Case studies</p>
            <h2 className="h-hero">
              Real systems. <em>Real outcomes.</em>
            </h2>
            <p className="lead">
              How we have taken organizations from manual, fragmented operations to AI systems that run reliably every day, and the numbers that followed. Keep scrolling to turn through them.
            </p>
            <div className="cta-row">
              <Link className="btn btn-navy" href="/contact?topic=audit">
                Book a free audit
              </Link>
            </div>
          </>
        }
        fallback={
          <>
            <PageHero
              as="h2"
              kicker="Case studies"
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
                <CaseCards layout="rows" />
              </div>
            </section>
          </>
        }
      />

      <section className="section on-mist">
        <div className="wrap">
          <SectionHead
            kicker="More we have built"
            title={
              <>
                A wider <em>portfolio.</em>
              </>
            }
            lead="Platforms and apps across healthcare, sales, recruiting, legal, finance and travel. Open any of them for what it does, how it was built and its screens."
          />
          <Portfolio items={projectList} />
        </div>
      </section>

      <Industries tone="white" />

      <AuditStrip tone="mist" />
    </>
  );
}
